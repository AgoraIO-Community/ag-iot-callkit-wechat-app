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

import { getIotClient } from '../core/index';
import { log } from '../utils/index';
import * as AgoraMiniappSDK from '../lib/rtc/Agora_Miniapp_SDK_for_WeChat';
import eventBus from '../utils/event-bus';
import {
    PEER_STREAM_ADDED_EVENT,
    PACKET_TYPE_PCMU,
    PACKET_TYPE_G722,
} from '../utils/const';

/*
    1. init rtc

    2. join channel

    3. listen to stream-added and stream-removed events

    4. if peer joined and stream-added event fired, subscribe peer and get play url

    5. send play url to live view

    6. publish stream and get push url

    7. send push url to live view

    8. if we hangup, destroy rtc

    9. if peer unsubscribe or leave, stream-removed fired and we destroy rtc
*/

let rtcClient;
// default codec is g722
let currentAudioCodec = PACKET_TYPE_G722;

export function initRtc(callkitContext) {
    log.i('initRtc Invoked');
    return new Promise((resolve, reject) => {
        if (rtcClient) {
            rtcClient.destroy();
        }

        rtcClient = new AgoraMiniappSDK.Client();

        const { appId } = getIotClient();
        rtcClient.init(appId, () => {
            log.i('RTC init success');

            // set audio codec
            log.i('current audio codec', currentAudioCodec);
            rtcClient.setAudioCodec(currentAudioCodec);

            resolve();
        }, (err) => {
            log.e('RTC init failed', err);
            reject(err);
        });

        rtcClient.on('stream-added', (user) => {
            log.i('RTC stream-added', user);
            // 多呼一的情况下，其他用户加入频道，避免订阅其他用户，纯呼叫只订阅设备端。
            if (user.uid?.toString() === callkitContext.peerUid?.toString()
                || user.uid?.toString() === callkitContext.uid?.toString()) {
                log.i('Device joined channel.');
                rtcClient.subscribe(user.uid, (url) => {
                    log.i('RTC subscribe succcess');
                    sendEventHelper(PEER_STREAM_ADDED_EVENT, url);
                }, (err) => {
                    log.e('RTC subscribe err', err);
                });
            }
        });

        rtcClient.on('stream-removed', (user) => {
            log.i('RTC stream removed', user);
            // peer left channel
        });
    });
}

// sometimes live view is not loaded and the event listener is not ready
// calling eventBus.emit before eventBus.on will make playUrl lost
// use sendEventHelper to periodically probe event until live view loaded and event listener ready
function sendEventHelper(eventName, data) {
    const event = eventBus.find(eventName);
    if (event && event.executes.length !== 0) {
        eventBus.emit(eventName, data);
    } else {
        setTimeout(() => {
            sendEventHelper(eventName, data);
        }, 100);
    }
}

export function joinChannel(token, channel, agoraUid) {
    log.i('joinChannel Invoked');
    log.i('channel', channel);
    log.i('agoraUid', agoraUid);
    log.i('token', token);

    return new Promise((resolve, reject) => {
        rtcClient.join(token, channel, agoraUid, () => {
            log.i('RTC client join channel success');
            // mute local video as default
            muteLocal('video', true);
            resolve();
        }, (err) => {
            log.e(`RTC client join channel failed: ${err.code} ${err.reason}`);
            reject(err);
        });
    });
}

export function userPublishStream() {
    log.i('userPublishStream Invoked');
    return new Promise((resolve, reject) => {
        rtcClient.publish((url) => {
            log.i('RTC user publish stream success');
            resolve(url);
        }, (err) => {
            log.e('RTC user publish stream fail', err);
            reject(err);
        });
    });
}

export function unsubscribe(uid) {
    if (!rtcClient) return;
    log.i('unsubscribe Invoked');
    const parsedInt = parseInt(uid, 10);
    rtcClient.unsubscribe(parsedInt, () => {
        log.i('RTC unsubscribe success');
    }, (err) => {
        log.e('RTC unsubscribe err', err);
    });
}

export function leaveChannel() {
    if (!rtcClient) return;
    log.i('leaveChannel Invoked');
    rtcClient.leave(() => {
        log.i('RTC leave channel success');
    }, (err) => {
        log.e('RTC leave channel fail', err);
    });
}

export function destroyRtc() {
    log.i('destroyRtc Invoked');
    if (rtcClient) {
        rtcClient.destroy(() => {
            log.i('RTC client destroy success');
            rtcClient = null;
        }, (err) => {
            log.e('RTC client destroy fail', err);
        });
    }
}

export function setAudioCodec(audioCode) {
    log.i('RTC setAudioCodec', audioCode);

    if (audioCode === 'g711u') { // g711u/pcmu/0
        currentAudioCodec = PACKET_TYPE_PCMU;
    } else if (audioCode === 'g722') { // g722/9
        currentAudioCodec = PACKET_TYPE_G722;
    } else {
        log.e('RTC audio codec not recognized', audioCode);
    }
}

export function getAudioCodec() {
    log.i('RTC getAudioCodec');

    if (currentAudioCodec === PACKET_TYPE_PCMU) {
        return 'g711u';
    } if (currentAudioCodec === PACKET_TYPE_G722) {
        return 'g722';
    }
    return '';
}

// target could be all, audio or video
// 启动/停止接收远端音视频流
export function muteLocal(target, isMuted) {
    if (!rtcClient) return;
    log.i('muteLocal Invoked', isMuted);

    if (isMuted) {
        rtcClient.muteLocal(target, () => {
            log.i('muteLocal success');
        }, (err) => {
            log.e('muteLocal failed', err);
        });
    } else {
        rtcClient.unmuteLocal(target, () => {
            log.i('unmuteLocal success');
        }, (err) => {
            log.e('unmuteLocal failed', err);
        });
    }
}

// 启动/停止接收远端音视频流
export function muteRemote(uid, target, isMuted) {
    if (!rtcClient) return;
    if (!uid) return;
    log.i('muteRemote Invoked', uid, isMuted);

    const parsedInt = parseInt(uid);
    if (isMuted) {
        rtcClient.mute(parsedInt, target, () => {
            log.i('muteRemote success');
        }, (err) => {
            log.e('muteRemote failed', err);
        });
    } else {
        rtcClient.unmute(parsedInt, target, () => {
            log.i('unmuteRemote success');
        }, (err) => {
            log.e('unmuteRemote failed', err);
        });
    }
}

export function updatePusherNetStatus(e) {
    rtcClient.updatePusherNetStatus(e.detail);
}

export function updatePusherStateChange(e) {
    rtcClient.updatePusherStateChange(e.detail);
}

export function updatePlayerNetStatus(uid, e) {
    rtcClient.updatePlayerNetStatus(uid, e.detail);
}

export function updatePlayerStateChange(uid, e) {
    rtcClient.updatePlayerStateChange(uid, e.detail);
}
