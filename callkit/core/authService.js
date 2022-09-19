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

import { log, myRequest } from '../utils/index';
import {
    AUTH_THIRD_PARTY_BASE_URL,
} from '../utils/config';

export async function authThirdPartyRegister(username, password) {
    log.i('authThirdPartyRegister Invoked');

    try {
        const url = `${AUTH_THIRD_PARTY_BASE_URL}/third-party/auth/register`;
        const res = await myRequest({
            url,
            method: 'post',
            data: {
                username, // 用户名
                password, // 密码
            },
        });
        if (res.code !== 0) {
            log.e('authThirdPartyRegister ERROR', res);
            throw new Error(res.msg);
        }

        log.i('authThirdPartyRegister SUCCESS', res);
        return res.msg;
    } catch (err) {
        throw err;
    }
}

export async function authThirdPartyLogin(username, password) {
    log.i('authThirdPartyLogin Invoked');

    try {
        const url = `${AUTH_THIRD_PARTY_BASE_URL}/third-party/auth/login`;
        const res = await myRequest({
            url,
            method: 'post',
            data: {
                username, // 用户名
                password, // 密码
            },
        });
        if (res.code !== 0) {
            log.e('authThirdPartyLogin ERROR', res);
            throw new Error(res.msg);
        }

        log.i('authThirdPartyLogin SUCCESS', res);
        return res.data;
    } catch (err) {
        throw err;
    }
}

export async function authThirdPartyGetUid(username) {
    log.i('authThirdPartyGetUid Invoked');

    try {
        const url = `${AUTH_THIRD_PARTY_BASE_URL}/third-party/auth/getUidByUsername`;
        const res = await myRequest({
            url,
            method: 'post',
            data: {
                username, // 第三方用户账号
            },
        });
        if (res.code !== 0) {
            log.e('authThirdPartyGetUid ERROR', res);
            throw new Error(res.msg);
        }

        log.i('authThirdPartyGetUid SUCCESS', res);
        return res.data;
    } catch (err) {
        throw err;
    }
}

export async function authThirdPartyRemoveAccount(username, password) {
    log.i('authThirdPartyRemoveAccount Invoked');

    try {
        const url = `${AUTH_THIRD_PARTY_BASE_URL}/third-party/auth/removeAccount`;
        const res = await myRequest({
            url,
            method: 'post',
            data: {
                username, // 用户名
                password, // 密码
            },
        });
        if (res.code !== 0) {
            log.e('authThirdPartyRemoveAccount ERROR', res);
            throw new Error(res.msg);
        }

        log.i('authThirdPartyRemoveAccount SUCCESS', res);
        return res.msg;
    } catch (err) {
        throw err;
    }
}
