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

import { getIotClient } from '../iotapaas/action';
import { log } from '../common/utils';
import * as AgoraMiniappSDK from '../lib/rtc/Agora_Miniapp_SDK_for_WeChat';
import eventBus from '../common/event-bus';
import { PEER_STREAM_ADDED_EVENT } from '../common/const';

let rtcClient;

export function initRtc(localHangup) {
    log.i('initRtc Invoked');
    return new Promise((resolve, reject) => {
        if (rtcClient) {
            rtcClient.destroy();
        }
        rtcClient = new AgoraMiniappSDK.Client({
            servers: ['wss://miniapp.agoraio.cn/101-64-176-204/api'],
        });

        const { appId } = getIotClient();
        rtcClient.init(appId, () => {
            log.i('RTC init success');
            resolve();
        }, (err) => {
            log.e('RTC init failed', err);
            reject(err);
        });

        rtcClient.on('stream-added', (event) => {
            log.i('RTC stream-added', event);
            rtcClient.subscribe(event.uid, (url) => {
                log.i('RTC subscribe succcess');
                sendEventHelper(PEER_STREAM_ADDED_EVENT, url);
            }, (err) => {
                log.e('RTC subscribe err', err);
            });
        });

        rtcClient.on('stream-removed', (event) => {
            log.i('RTC stream removed', event);
            // if peer leave channel, local hangup
            localHangup();
        });
    });
}

// sometimes live view is not ready and event listener is not ready
// calling eventBus.emit before eventBus.on will make play url lost
// use helper to periodically probe event listener is ready
function sendEventHelper(eventName, content) {
    const event = eventBus.find(eventName);
    if (event && event.executes.length !== 0) {
        eventBus.emit(eventName, content);
    } else {
        setTimeout(() => {
            sendEventHelper(eventName, content);
        }, 100);
    }
}

export function joinChannel(token, channel, agoraUid) {
    log.i('joinChannel Invoked');
    return new Promise((resolve, reject) => {
        rtcClient.join(token, channel, agoraUid, () => {
            log.i('RTC client join channel success');
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
            log.i('RTC client destroy success ');
            rtcClient = null;
        }, (err) => {
            log.e('RTC client destroy fail ', err);
        });
    }
}

// 启动/停止发送本地音频流
export function muteLocalVideo(mute) {
    if (!rtcClient) return;
    log.i('muteLocalVideo Invoked', mute);

    if (mute) {
        rtcClient.muteLocal('video');
    } else {
        rtcClient.unmuteLocal('video');
    }
}

// 启动/停止发送本地视频流
export function muteLocalAudio(mute) {
    if (!rtcClient) return;
    log.i('muteLocalAudio Invoked', mute);

    if (mute) {
        rtcClient.muteLocal('audio');
    } else {
        rtcClient.unmuteLocal('audio');
    }
}

// 启动/停止接收远端视频流
export function mutePeerVideo(uid, mute) {
    if (!rtcClient) return;
    if (!uid) return;
    log.i('mutePeerVideo Invoked', uid, mute);

    const parsedInt = parseInt(uid, 10);
    if (mute) {
        rtcClient.mute(parsedInt, 'video');
    } else {
        rtcClient.unmute(parsedInt, 'video');
    }
}

// 启动/停止接收远端音频流
export function mutePeerAudio(uid, mute) {
    if (!rtcClient) return;
    if (!uid) return;
    log.i('mutePeerAudio Invoked', uid, mute);

    const parsedInt = parseInt(uid, 10);
    if (mute) {
        rtcClient.mute(parsedInt, 'audio');
    } else {
        rtcClient.unmute(parsedInt, 'audio');
    }
}
