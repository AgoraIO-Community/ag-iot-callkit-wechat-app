/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2022 Agora Lab, Inc (http://www.agora.io/)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

import {
    initIot,
    getIotClient,
    destroyMqtt,
} from './core/index';
import {
    joinChannel,
    userPublishStream,
    initRtc,
    destroyRtc,
    muteLocal,
    muteRemote,
    setAudioCodec,
    getAudioCodec,
} from './rtc/index';
import {
    callDeviceService,
    answerDeviceService,
} from './core/agoraService';
import {
    authThirdPartyRegister,
    authThirdPartyLogin,
    authThirdPartyGetUid,
    authThirdPartyRemoveAccount,
} from './core/authService';
import { base32Encode, log } from './utils/index';
import eventBus from './utils/event-bus';
import {
    PEER_STREAM_ADDED_EVENT,
    PEER_HANGUP_EVENT,
    PEER_BUSY_EVENT,
    PEER_ANSWER_EVENT,
    PEER_REQUEST_EVENT,
    USER_SESSION_END_EVENT,
    MQTT_RECONNECTED,
    MQTT_DISCONNECTED,
} from './utils/const';

const CALLKIT_STATE_IDLE = 1; // < 当前 空闲状态无通话
const CALLKIT_STATE_DIALING = 2; // < 正在呼叫设备中
const CALLKIT_STATE_INCOMING = 3; // < 正在有来电中
const CALLKIT_STATE_TALKING = 4; // < 正在通话中

const REASON_NONE = 0; // < 没有reason字段
const REASON_LOCAL_HANGUP = 1; // < 本地挂断
const REASON_LOCAL_ANSWER = 2; // < 本地应答
const REASON_PEER_HANGUP = 3; // < 对端挂断
const REASON_PEER_ANSWER = 4; // < 对端应答
const REASON_PEER_CALL_TIMEOUT = 5; // < 对端应答超时
const REASON_LOCAL_CALL_TIMEOUT = 7; // < 本地应答超时

/*
    local call -> local hangup
    local call -> peer hangup
    local call -> peer busy
    local call -> peer answer -> local hangup
    local call -> peer answer -> peer hangup
    local call -> no answer

    peer call -> peer hangup
    peer call -> local hangup
    peer call -> local busy
    peer call -> local answer -> peer hangup
    peer call -> local answer -> local hangup
    peer call -> no answer
*/

let currentState = CALLKIT_STATE_IDLE;
let accountManager;
let callkitManager;
let callkitContext;

function setCallkitContext(json) {
    if (!callkitContext) callkitContext = {};
    if (json.attachMsg) callkitContext.attachMsg = json.attachMsg;
    if (json.calleeId) callkitContext.calleeId = json.calleeId;
    if (json.callerId) callkitContext.callerId = json.callerId;
    if (json.channelName) callkitContext.channelName = json.channelName;
    if (json.rtcToken) callkitContext.rtcToken = json.rtcToken;
    if (json.sessionId) callkitContext.sessionId = json.sessionId;
    if (json.uid) callkitContext.uid = json.uid;
}

function clearCallkitContext() {
    callkitContext = null;
}

function peerCallingAction() {
    log.i('peerCallingAction Invoked');
    initRtc(forceHangupAction);
    joinChannel(callkitContext.rtcToken, callkitContext.channelName, callkitContext.uid);
    eventBus.emit(PEER_REQUEST_EVENT, callkitContext);
}

function peerAcceptAction() {
    log.i('peerAcceptAction Invoked');
    initRtc(forceHangupAction);
    joinChannel(callkitContext.rtcToken, callkitContext.channelName, callkitContext.uid);
    eventBus.emit(PEER_ANSWER_EVENT, callkitContext);
}

function peerHangupAction() {
    log.i('peerHangupAction Invoked');
    destroyRtc();
    hangupDevice();
    eventBus.emit(PEER_HANGUP_EVENT, callkitContext);
    clearCallkitContext();
}

function peerBusyAction() {
    log.i('peerBusyAction Invoked');
    eventBus.emit(PEER_BUSY_EVENT, callkitContext);
    clearCallkitContext();
}

function localAcceptAction() {
    log.i('localAcceptAction Invoked');
    initRtc(forceHangupAction);
    joinChannel(callkitContext.rtcToken, callkitContext.channelName, callkitContext.uid);
}

function localCallingAction() {
    log.i('localCallingAction Invoked');
    initRtc(forceHangupAction);
    joinChannel(callkitContext.rtcToken, callkitContext.channelName, callkitContext.uid);
}

function localHangupAction() {
    log.i('localHangupAction Invoked');
    destroyRtc();
    clearCallkitContext();
}

function localBusyAction() {
    log.i('localBusyAction Invoked');
    eventBus.emit(PEER_HANGUP_EVENT, callkitContext);
    clearCallkitContext();
}

function forceHangupAction() {
    if (!callkitContext) return;
    log.i('forceHangupAction Invoked');
    const iotClient = getIotClient();
    answerDeviceService(
        callkitContext.sessionId,
        callkitContext.callerId,
        callkitContext.calleeId,
        iotClient.inventDeviceName,
        1,
        iotClient.accessToken,
    ).then(() => {
        if (currentState === CALLKIT_STATE_TALKING) {
            eventBus.emit(PEER_HANGUP_EVENT, callkitContext);
        }
        clearCallkitContext();
    });
}

function processAwsMessage(jsonState) {
    log.i('processAwsMessage Invoked');
    if (!jsonState.callStatus) {
        log.i('no field: callStatus');
        return;
    }

    const targetState = jsonState.callStatus || -1;
    const reason = jsonState.reason || REASON_NONE;

    switch (targetState) {
    case CALLKIT_STATE_IDLE: { // APP切换到空闲状态
        if (reason === REASON_LOCAL_HANGUP) {
            if (currentState === CALLKIT_STATE_DIALING) { // 主叫过程中，本地主动挂断
                log.i('local hangup during dialing');
                currentState = CALLKIT_STATE_IDLE; // 结束通话
                localHangupAction(); // 本地挂断事件处理
            } else if (currentState === CALLKIT_STATE_INCOMING) { // 来电过程中，本地挂断拒绝
                log.i('local hangup during incoming');
                currentState = CALLKIT_STATE_IDLE; // 结束通话
                localHangupAction(); // 本地挂断事件处理
            } else if (currentState === CALLKIT_STATE_TALKING) { // 通话过程中，本地挂断通话
                log.i('local hangup during talking');
                currentState = CALLKIT_STATE_IDLE; // 结束通话
                localHangupAction(); // 本地挂断事件处理
            } else {
                log.i('INVALID STATE', `remote state: [${targetState}, ${reason}]`, `local state: [${currentState}]`, jsonState);
            }
        } else if (reason === REASON_PEER_HANGUP) {
            if (currentState === CALLKIT_STATE_DIALING) { // 主叫过程中，对端挂断拒绝
                log.i('peer hangup during dialing');
                currentState = CALLKIT_STATE_IDLE; // 结束通话
                peerHangupAction(); // 对端挂断事件处理
            } else if (currentState === CALLKIT_STATE_INCOMING) { // 来电过程中，对端挂断拨号
                log.i('peer hangup during incoming');
                currentState = CALLKIT_STATE_IDLE; // 结束通话
                peerHangupAction(); // 对端挂断事件处理
            } else if (currentState === CALLKIT_STATE_TALKING) { // 通话过程中，对端挂断通话
                log.i('peer hangup during talking');
                currentState = CALLKIT_STATE_IDLE; // 结束通话
                peerHangupAction(); // 对端挂断事件处理
            } else {
                log.i('INVALID STATE', `remote state: [${targetState}, ${reason}]`, `local state: [${currentState}]`, jsonState);
            }
        } else if (reason === REASON_PEER_CALL_TIMEOUT) {
            if (currentState === CALLKIT_STATE_DIALING) { // 主叫过程中，对端超时无响应
                log.i('call timeout during dialing');
                currentState = CALLKIT_STATE_IDLE; // 结束通话
                peerBusyAction(); // 对端无响应事件处理
            } else if (currentState === CALLKIT_STATE_INCOMING) { // 被叫过程中，被叫无响应
                log.i('call timeout during incoming');
                currentState = CALLKIT_STATE_IDLE; // 结束通话
                localBusyAction(); // 本地无响应事件处理
            } else {
                log.i('INVALID STATE', `remote state: [${targetState}, ${reason}]`, `local state: [${currentState}]`, jsonState);
            }
        } else if (reason === REASON_LOCAL_CALL_TIMEOUT) {
            if (currentState === CALLKIT_STATE_INCOMING) { // 被叫过程中，被叫无响应
                log.i('call timeout during incoming');
                currentState = CALLKIT_STATE_IDLE; // 结束通话
                localBusyAction(); // 本地无响应事件处理
            } else {
                log.i('INVALID STATE', `remote state: [${targetState}, ${reason}]`, `local state: [${currentState}]`, jsonState);
            }
        } else {
            log.i('INVALID STATE', `remote state: [${targetState}, ${reason}]`, `local state: [${currentState}]`, jsonState);
        }
    } break;

    case CALLKIT_STATE_DIALING: { // APP切换到主叫状态
        if (currentState === CALLKIT_STATE_IDLE) { // 只有本地发送 呼叫的HTTP请求，才会进入该状态
            log.i('local dialing success.');
            currentState = CALLKIT_STATE_DIALING; // 切换到呼叫
            setCallkitContext(jsonState);
            localCallingAction(); // 本地呼叫事件处理
        } else {
            log.i('INVALID STATE', `remote state: [${targetState}, ${reason}]`, `local state: [${currentState}]`, jsonState);
        }
    } break;

    case CALLKIT_STATE_INCOMING: { // APP切换到被叫状态
        if (currentState === CALLKIT_STATE_IDLE) { // 只有对端发送呼叫的HTTP请求，才会进入该状态
            log.i('peer incoming call...');
            currentState = CALLKIT_STATE_INCOMING; // 切换到来电
            setCallkitContext(jsonState);
            peerCallingAction(); // 对端呼叫事件处理
        } else {
            log.i('INVALID STATE', `remote state: [${targetState}, ${reason}]`, `local state: [${currentState}]`, jsonState);
        }
    } break;

    case CALLKIT_STATE_TALKING: { // APP切换到通话状态
        if (reason === REASON_PEER_ANSWER) {
            if (currentState === CALLKIT_STATE_DIALING) { // 主叫过程中，对端接听
                log.i('enter talk during dialing');
                currentState = CALLKIT_STATE_TALKING; // 切换到通话
                peerAcceptAction(); // 对端接听事件处理
            } else if (currentState === CALLKIT_STATE_IDLE) {
                log.e('shadow stuck in talking state, force to hangup');
                setCallkitContext(jsonState);
                forceHangupAction(); // 从空闲跳到通话状态，可能影子状态卡在通话中，需要强制中断
            } else {
                log.i('INVALID STATE', `remote state: [${targetState}, ${reason}]`, `local state: [${currentState}]`, jsonState);
            }
        } else if (reason === REASON_LOCAL_ANSWER) {
            if (currentState === CALLKIT_STATE_INCOMING) { // 被叫过程中，本地接听
                log.i('enter talk during incoming');
                currentState = CALLKIT_STATE_TALKING; // 切换到通话
                localAcceptAction(); // 本地接听事件处理
            } else if (currentState === CALLKIT_STATE_IDLE) {
                log.e('shadow stuck in talking state, force to hangup');
                setCallkitContext(jsonState);
                forceHangupAction(); // 从空闲跳到通话状态，可能影子状态卡在通话中，需要强制中断
            } else {
                log.i('INVALID STATE', `remote state: [${targetState}, ${reason}]`, `local state: [${currentState}]`, jsonState);
            }
        } else {
            log.i('INVALID STATE', `remote state: [${targetState}, ${reason}]`, `local state: [${currentState}]`, jsonState);
        }
    } break;
    }
}

function handleMqttMessage(topic, payload) {
    log.i('handleMqttMessage Invoked');
    const iotClient = getIotClient();
    if (topic.includes('/device/connect')) {
        // 设备上下线
        // const deviceMac = topic.split('/')[1];
        // const deviceStatus = payload.connect;
        // updateDeviceStatus()
    } else if (topic.includes('/shadow/get/accepted')) {
        // 只关注设备端上报的当前状态
        // const desiredObject = payload.state.reported;
        // 去除topic前后内容，获取设备唯一标志
        // let thingsName = topic.replaceAll('$aws/things/', '');
        // thingsName = thingsName.replaceAll('/shadow/get/accepted', '');
        // 通知收到设备状态更新事件
        // awsListener.onReceiveShadow(thingsName, desiredObject);
    } else if (topic.includes('/shadow/name/rtc/update/accepted')) {
        // 只关注APP端影子的期望值
        if (payload.state.desired) {
            const desiredObject = payload.state.desired;
            // 去除topic前后内容，获取设备唯一标志
            let thingsName = topic.replaceAll('$aws/things/', '');
            thingsName = thingsName.replaceAll('/shadow/name/rtc/update/accepted', '');
            // 通知收到APP端控制事件
            if (thingsName === iotClient.inventDeviceName) {
                processAwsMessage(desiredObject);
            }
        }
    } else if (topic.includes('/shadow/name/rtc/get/accepted')) {
        // 只关注APP端影子的期望值
        if (payload.state.desired) {
            const desiredObject = payload.state.desired;
            // 去除topic前后内容，获取设备唯一标志
            let thingsName = topic.replaceAll('$aws/things/', '');
            thingsName = thingsName.replaceAll('/shadow/name/rtc/get/accepted', '');
            // 通知收到APP端控制事件
            if (thingsName === iotClient.inventDeviceName) {
                processAwsMessage(desiredObject);
            }
        }
    } else {
        // 未知的消息
    }
}

function getCalleeId(deviceId, productKey) {
    return base32Encode(`${productKey}-${deviceId}`, false);
}

async function callDevice(deviceId, msg) {
    try {
        if (currentState !== CALLKIT_STATE_IDLE) {
            log.e('状态错误，可能在通话中');
            throw new Error('In call, cannot call again.');
        }
        if (!deviceId) {
            log.e('请提供 deviceId');
            throw new Error('Please provide deviceId.');
        }

        const iotClient = getIotClient();
        const { inventDeviceName, accessToken, productKey } = iotClient;
        const calleeId = getCalleeId(deviceId, productKey);

        const callRes = await callDeviceService(inventDeviceName, calleeId, msg, accessToken);
        const newContext = { ...callRes, callerId: inventDeviceName, calleeId };
        setCallkitContext(newContext);
        return newContext;
    } catch (err) {
        throw err;
    }
}

async function answerDevice() {
    try {
        if (currentState !== CALLKIT_STATE_INCOMING) {
            log.e('状态无效');
            throw new Error('Invalid state.');
        }

        const iotClient = getIotClient();
        const { inventDeviceName, accessToken } = iotClient;

        return await answerDeviceService(
            callkitContext.sessionId,
            callkitContext.callerId,
            callkitContext.calleeId,
            inventDeviceName,
            0,
            accessToken,
        );
    } catch (err) {
        throw err;
    }
}

async function hangupDevice() {
    try {
        if (currentState === CALLKIT_STATE_IDLE) {
            log.e('状态无效');
            throw new Error('Invalid state.');
        }

        const iotClient = getIotClient();
        const { inventDeviceName, accessToken } = iotClient;

        return await answerDeviceService(
            callkitContext.sessionId,
            callkitContext.callerId,
            callkitContext.calleeId,
            inventDeviceName,
            1,
            accessToken,
        );
    } catch (err) {
        throw err;
    }
}

function muteLocalHelper(target, isMuted) {
    muteLocal(target, isMuted);
}

function muteRemoteHelper(target, isMuted) {
    const { uid } = callkitContext;
    muteRemote(uid, target, isMuted);
}

function setAudioCodecHelper(audioCodec) {
    setAudioCodec(audioCodec);
}

function getAudioCodecHelper() {
    return getAudioCodec();
}

async function initSdk(config, username, password) {
    try {
        if (!config.APPID) {
            throw new Error('请提供 App ID');
        }
        if (!config.PRODUCT_KEY) {
            throw new Error('请提供 Prodcut Key');
        }
        if (!config.PROJECT_ID) {
            throw new Error('请提供 Project ID');
        }
        if (!username) {
            throw new Error('用户名不能为空');
        }
        if (typeof username !== 'string') {
            throw new Error('用户名类型需要是字符串');
        }
        if (username.length < 6) {
            throw new Error('用户名需要至少6位');
        }
        if (!password) {
            throw new Error('密码不能为空');
        }

        const authRes = await authThirdPartyLogin(username, password);
        return await initIot(config, username, authRes.gyToken, authRes.lsToken, handleMqttMessage);
    } catch (err) {
        log.e('initSdk failed', err);
        throw err;
    }
}

function destroySdk() {
    destroyRtc();
    destroyMqtt();
    currentState = CALLKIT_STATE_IDLE;
}

function getUserData() {
    const iotClient = getIotClient();
    const { username, inventDeviceName } = iotClient;
    const clientId = inventDeviceName.split('-')[1];

    return {
        username,
        clientId,
    };
}

/*
    Event Handlers
*/
function peerStreamAddedEventCallback(callback) {
    const eventId = eventBus.on(PEER_STREAM_ADDED_EVENT, (url) => {
        callback(url);
    });

    return function unsubscriber() {
        eventBus.remove(PEER_STREAM_ADDED_EVENT, eventId);
    };
}

function peerHangupEventCallback(callback) {
    const eventId = eventBus.on(PEER_HANGUP_EVENT, (event) => {
        callback(event);
    });

    return function unsubscriber() {
        eventBus.remove(PEER_HANGUP_EVENT, eventId);
    };
}

function peerBusyEventCallback(callback) {
    const eventId = eventBus.on(PEER_BUSY_EVENT, (event) => {
        callback(event);
    });

    return function unsubscriber() {
        eventBus.remove(PEER_BUSY_EVENT, eventId);
    };
}

function peerAnswerEventCallback(callback) {
    const eventId = eventBus.on(PEER_ANSWER_EVENT, (event) => {
        callback(event);
    });

    return function unsubscriber() {
        eventBus.remove(PEER_ANSWER_EVENT, eventId);
    };
}

function peerRequestEventCallback(callback) {
    const eventId = eventBus.on(PEER_REQUEST_EVENT, (event) => {
        callback(event);
    });

    return function unsubscriber() {
        eventBus.remove(PEER_REQUEST_EVENT, eventId);
    };
}

function userSessionEndEventCallback(callback) {
    const eventId = eventBus.on(USER_SESSION_END_EVENT, (event) => {
        callback(event);
    });

    return function unsubscriber() {
        eventBus.remove(USER_SESSION_END_EVENT, eventId);
    };
}

function mqttReconnectedEvent(callback) {
    const eventId = eventBus.on(MQTT_RECONNECTED, (event) => {
        callback(event);
    });

    return function unsubscriber() {
        eventBus.remove(MQTT_RECONNECTED, eventId);
    };
}

function mqttDisconnectedEvent(callback) {
    const eventId = eventBus.on(MQTT_DISCONNECTED, (event) => {
        callback(event);
    });

    return function unsubscriber() {
        eventBus.remove(MQTT_DISCONNECTED, eventId);
    };
}

class AccountManager {
    initSdk = initSdk;

    destroySdk = destroySdk;

    registerAccount = authThirdPartyRegister;

    getUserData = getUserData;

    userSessionEndEventCallback = userSessionEndEventCallback;
}

export function getAccountManager() {
    if (!accountManager) {
        accountManager = new AccountManager();
    }

    return accountManager;
}

class CallkitManager {
    userPublishStream = userPublishStream;

    callDevice = callDevice;

    answerDevice = answerDevice;

    hangupDevice = hangupDevice;

    muteLocal = muteLocalHelper;

    muteRemote = muteRemoteHelper;

    setAudioCodec = setAudioCodecHelper;

    getAudioCodec = getAudioCodecHelper;

    peerStreamAddedEventCallback = peerStreamAddedEventCallback;

    peerHangupEventCallback = peerHangupEventCallback;

    peerBusyEventCallback = peerBusyEventCallback;

    peerAnswerEventCallback = peerAnswerEventCallback;

    peerRequestEventCallback = peerRequestEventCallback;

    mqttReconnectedEvent = mqttReconnectedEvent;

    mqttDisconnectedEvent = mqttDisconnectedEvent;
}

export function getCallkitManager() {
    if (!callkitManager) {
        callkitManager = new CallkitManager();
    }

    return callkitManager;
}
