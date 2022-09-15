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

import { getIotClient } from './index';
import { log, myRequest } from '../utils/index';
import {
    agoraBaseUrl,
    agoraBaseAuthUrl,
    CLIENT_ID,
    CLIENT_SECRET,
} from '../utils/config';

export async function anonymousLogin(username) {
    log.i('anonymousLogin Invoked');

    try {
        const url = `${agoraBaseAuthUrl}/anonymous-login?username=${username}`;
        const res = await myRequest({
            url,
            method: 'post',
        });

        if (res.code !== 0) {
            log.e('anonymousLogin ERROR', res);
            throw new Error(res.msg);
        }

        log.i('anonymousLogin SUCCESS', res);
        return res.data;
    } catch (err) {
        throw err;
    }
}

export async function agoraRegister(username) {
    log.i('agoraRegister Invoked');

    try {
        const url = `${agoraBaseAuthUrl}/register`;
        const res = await myRequest({
            url,
            method: 'post',
            data: {
                username,
            },
        });

        if (res.code !== 0) {
            log.e('agoraRegister ERROR', res);
            throw new Error(res.msg);
        }

        log.i('agoraRegister SUCCESS', res);
        return res.data;
    } catch (err) {
        throw err;
    }
}

export async function agoraGetToken(username) {
    log.i('agoraGetToken Invoked');

    try {
        const url = `${agoraBaseAuthUrl}/rest-token`;
        const res = await myRequest({
            url,
            method: 'post',
            data: {
                grant_type: 'password',
                username,
                password: '111111',
                scope: 'read',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            },
        });

        if (res.code !== 0) {
            log.e('agoraGetToken ERROR', res);
            throw new Error(res.msg);
        }

        log.i('agoraGetToken SUCCESS', res);
        return res.data;
    } catch (err) {
        throw err;
    }
}

export async function agoraRefreshToken(refreshToken) {
    log.i('agoraRefreshToken Invoked');

    try {
        const url = `${agoraBaseAuthUrl}/rest-token`;
        const res = await myRequest({
            url,
            method: 'post',
            data: {
                grant_type: 'refresh_token',
                scope: 'read',
                refresh_token: refreshToken,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            },
        });

        if (res.code !== 0) {
            log.e('agoraRefreshToken ERROR', res);
            throw new Error(res.msg);
        }

        log.i('agoraRefreshToken SUCCESS', res);
        return res.data;
    } catch (err) {
        throw err;
    }
}

export async function callDeviceService(inventDeviceName, deviceMac, attachMsg, token) {
    log.i('callDeviceService Invoked');

    try {
        const { appId } = getIotClient();
        const url = `${agoraBaseUrl}/call`;
        const header = {
            traceId: `${appId}-${inventDeviceName}`,
            timestamp: new Date().getTime(),
        };
        const payload = {
            callerId: inventDeviceName,
            calleeIds: [deviceMac],
            attachMsg,
            appId,
        };

        const res = await myRequest({
            url,
            method: 'post',
            header: {
                authorization: `Bearer ${token}`,
            },
            data: {
                header,
                payload,
            },
        });

        if (res.code !== 0) {
            log.e('callDeviceService ERROR', res);
            throw new Error(res.msg);
        }

        log.i('callDeviceService SUCCESS', res);
        return res.data;
    } catch (err) {
        throw err;
    }
}

export async function answerDeviceService(sessionId, callerId, calleeId, localId, isAccept, token) {
    log.i('answerDeviceService Invoked');

    try {
        const url = `${agoraBaseUrl}/answer`;
        const header = {
            traceId: `${sessionId}-${callerId}-${calleeId}`,
            timestamp: new Date().getTime(),
        };
        const payload = {
            callerId,
            calleeId,
            localId,
            sessionId,
            answer: isAccept, // 接听应答。0：接听，1：挂断
        };

        const res = await myRequest({
            url,
            method: 'post',
            header: {
                authorization: `Bearer ${token}`,
            },
            data: {
                header,
                payload,
            },
        });

        if (res.code !== 0) {
            log.e('answerDeviceService ERROR', res);
            throw new Error(res.msg);
        }

        log.i('answerDeviceService SUCCESS', res);
        return res.data;
    } catch (err) {
        throw err;
    }
}
