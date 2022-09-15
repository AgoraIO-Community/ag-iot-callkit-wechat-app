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

import { connect } from '../lib/mqtt/mqtt@4.1.0.min';
import { getInventDeviceNameService } from './granwinService';
import IoTClient from './IoTClient';
import aws4Sign from '../aws/index';
import { destroyRtc } from '../rtc/index';
import { log } from '../utils/index';
import eventBus from '../utils/event-bus';
import {
    USER_SESSION_END_EVENT,
    MQTT_DISCONNECTED,
    MQTT_RECONNECTED,
} from '../utils/const';

let mqttClient;
let iotClient;
let connectionStatus = 'disconnected';

/*
*    Mqtt initial timeout in 15 seconds. Call promise reject if connection status
*    is still connected
*/
function initMqttTimeout(reject) {
    setTimeout(() => {
        if (connectionStatus !== 'connected') {
            reject('Mqtt initial timeout.');
            destroyMqtt();
        }
    }, 15000);
}

/*
*    Get RTC shadow status. Call when app start to initial shadow status.
*/
function getRtcStatus() {
    log.i('getRtcStatus Invoked');
    const { inventDeviceName } = iotClient;
    const topic = `$aws/things/${inventDeviceName}/shadow/name/rtc/get`;

    const options = {
        qos: 1,
    };
    mqttClient.publish(topic, '', options);
}

/*
* Update RTC shadow status. Call when app start to initial shadow shadow status
*/
function updateRtcStatus() {
    log.i('updateRtcStatus Invoked');
    const { inventDeviceName, appId } = iotClient;
    const topic = `$aws/things/${inventDeviceName}/shadow/name/rtc/update`;

    const reportedValue = {
        appId,
        channelName: '',
        rtcToken: '',
        uid: '',
        sessionId: '',
        callerId: '',
        calleeId: '',
        deviceAlias: iotClient.account,
        callStatus: 1,
        reason: 0,
        cloudRcdStatus: 0,
    };

    const stateValue = {
        reported: reportedValue,
    };
    const messageValue = {
        state: stateValue,
    };
    const options = {
        qos: 1,
    };
    mqttClient.publish(topic, JSON.stringify(messageValue), options);
}

function subscribeTopic(topic, qos) {
    return new Promise((resolve, reject) => {
        const options = {
            qos,
        };
        mqttClient.subscribe(topic, options, (err) => {
            if (err) {
                log.e('MQTT subscribe error', err);
                reject(err);
                return;
            }
            log.i('MQTT subscribe success');
            resolve();
        });
    });
}

function subscribe() {
    return new Promise((resolve, reject) => {
        const topic = '+/+/device/connect'; // 设备上下线通知
        const topic2 = '$aws/things/+/shadow/get/+'; // 获取设备影子内容
        const topic3 = `$aws/things/${iotClient.inventDeviceName}/shadow/name/rtc/update/accepted`; // APP影子更新通知
        const topic4 = `$aws/things/${iotClient.inventDeviceName}/shadow/name/rtc/get/accepted`; // APP影子当前影子内容

        const topics = [
            // 订阅设备在线状态通知topic
            subscribeTopic(topic, 0),
            // 订阅设备影子更新通知topic
            subscribeTopic(topic2, 0),
            // 订阅设备影子更新通知topic
            subscribeTopic(topic3, 1),
            // 订阅设备影子内容topic
            subscribeTopic(topic4, 1),
        ];

        Promise.allSettled(topics)
            .then((res) => {
                resolve(res);
            })
            .catch((err) => {
                reject(err);
            });
    });
}

function getSignedPath({
    endpoint, region, accessKeyId, secretAccessKey, sessionToken,
}) {
    const signed = aws4Sign.signUrl({
        endpoint, region, accessKeyId, secretAccessKey,
    });
    const signedUrl = `${signed}${`&X-Amz-Security-Token=${encodeURIComponent(sessionToken)}`}`;
    return signedUrl;
}

function getSignedUrl(url, opts, client) {
    log.i('getSignedUrl Invoked');
    let protocol = 'wxs'; // default
    if (url && opts && client) protocol = 'wss'; // called by mqtt.js reconnection
    const signedPath = getSignedPath({
        endpoint: iotClient.endpoint,
        region: iotClient.region,
        accessKeyId: iotClient.accessKeyId,
        secretAccessKey: iotClient.secretKey,
        sessionToken: iotClient.sessionToken,
    });

    return `${protocol}://${iotClient.endpoint}${signedPath}`;
}

function initMqttClient(handleMqttMessage) {
    log.i('initMqttClient Invoked');
    return new Promise((resolve, reject) => {
        connectionStatus = 'connecting';
        initMqttTimeout(reject);
        const signedUrl = getSignedUrl();

        const mqttOptions = {
            keepalive: 10,
            reconnectPeriod: 1000,
            clientId: iotClient.clientId,
            clean: true,
            connectTimeout: 5000, // reconnect every 5 sec
            username: '?SDK=BrowserJSv2&Version=1.12.1',
            password: undefined,
            transformWsUrl: getSignedUrl,
        };

        mqttClient = connect(signedUrl, mqttOptions);
        mqttClient.on('connect', (sessionPresent) => {
            log.i('MQTT Connection completed.', sessionPresent);
            connectionStatus = 'connected';

            // 订阅topics
            subscribe()
                .then((res) => {
                    // 初始化 RTC 影子
                    setTimeout(() => {
                        updateRtcStatus();
                        getRtcStatus();
                    }, 0);
                    resolve(res);
                })
                .catch((err) => {
                    reject(err);
                });
        });

        mqttClient.on('message', (topic, message) => {
            // message is Buffer
            const payload = message.toString();
            const parsedPayload = JSON.parse(payload);
            log.i('MQTT Message:', topic, parsedPayload);
            handleMqttMessage(topic, parsedPayload);
        });

        mqttClient.on('interrupt', (err) => {
            log.i(`MQTT Connection interrupted: error=${err}`);
        });

        mqttClient.on('resume', (returnCode, sessionPresent) => {
            log.i(`MQTT Resumed: rc: ${returnCode} existing session: ${sessionPresent}`);
        });

        mqttClient.on('reconnect', () => {
            log.i('MQTT Reconnected');
            eventBus.emit(MQTT_RECONNECTED, null);
            // todo, test reconnect and 403
            if (iotClient.isSessionTokenExpired()) {
                log.e('Session token expired when reconnecting');
                destroyRtc();
                destroyMqtt();
                eventBus.emit(USER_SESSION_END_EVENT, null);
            }
        });

        mqttClient.on('close', () => {
            log.i('MQTT Closed');
            connectionStatus = 'disconnected';
        });

        mqttClient.on('disconnect', () => {
            log.i('MQTT Disconnected');
            connectionStatus = 'disconnected';
            eventBus.emit(MQTT_DISCONNECTED, null);
        });

        mqttClient.on('offline', () => {
            log.i('MQTT Offline');
            eventBus.emit(MQTT_DISCONNECTED, null);
            connectionStatus = 'disconnected';
        });

        mqttClient.on('error', (err) => {
            log.e('MQTT Error', err);
        });

        // log.i(mqttClient.stream);

        mqttClient.stream.on('error', (error) => {
            // This does trigger when the URL is invalid, write after end error
            // token expired, other user login, network changed, or bad connection
            log.e('MQTT stream error', error);
        });

        mqttClient.stream.on('close', (error) => {
            log.i('MQTT stream close', error);
        });

        mqttClient.stream.on('end', (error) => {
            log.i('MQTT stream end', error);
        });
    });
}

async function initIotClient(config, username, userSession, agoraSession) {
    log.i('initIotClient Invoked');

    try {
        const inventDeviceName = await getInventDeviceNameService(userSession.granwin_token);
        iotClient = new IoTClient({
            appId: config.APPID,
            productKey: config.PRODUCT_KEY,
            projectId: config.PROJECT_ID,
            username,
            account: userSession.account,
            granwinToken: userSession.granwin_token,
            granwinTokenExpiration: new Date().getTime() + userSession.expiration * 1000,
            sessionToken: userSession.proof.sessionToken,
            sessionExpiration: userSession.proof.sessionExpiration,
            accessKeyId: userSession.proof.accessKeyId,
            secretKey: userSession.proof.secretKey,
            endpoint: userSession.endpoint,
            region: userSession.region,
            clientId: userSession.pool.identityId,
            inventDeviceName,
            accessToken: agoraSession.access_token,
            refreshToken: agoraSession.refresh_token,
            tokenExpiresIn: new Date().getTime() + agoraSession.expires_in * 1000,
        });
    } catch (err) {
        throw err;
    }
}

export async function initIot(config, username, userSession, agoraSession, handleMqttMessage) {
    try {
        await initIotClient(config, username, userSession, agoraSession);
        await initMqttClient(handleMqttMessage);
    } catch (err) {
        throw err;
    }
}

export function getIotClient() {
    return iotClient;
}

export function getMqttClient() {
    return mqttClient;
}

export function destroyMqtt() {
    mqttClient.end(true);
    mqttClient = null;
    iotClient = null;
    connectionStatus = 'disconnected';
}
