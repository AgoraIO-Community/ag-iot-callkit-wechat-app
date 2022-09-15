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
import { granwinServiceBase } from '../utils/config';

export async function granwinUserLogin(email, password) {
    log.i('granwinUserLogin Invoked');

    try {
        const url = `${granwinServiceBase}/user/login?account=${email}&password=${password}`;
        const res = await myRequest({
            url,
            method: 'post',
        });

        if (res.code !== 0) {
            log.e('granwinUserLogin ERROR', res);
            throw new Error(res.tip);
        }

        log.i('granwinUserLogin SUCCESS', res);
        return res.info;
    } catch (err) {
        log.e('granwinUserLogin ERROR', err);
        throw err;
    }
}

export async function granwinGetEmailCode(email, type) {
    log.i('granwinGetEmailCode Invoked');

    try {
        const merchantId = '100000000000000000';
        const url = `${granwinServiceBase}/email/code/get?merchantId=${merchantId}&email=${email}&type=${type}`;
        const res = await myRequest({
            url,
            method: 'post',
        });

        if (res.code !== 0) {
            log.e('granwinGetEmailCode ERROR', res);
            throw new Error(res.tip);
        }

        log.i('granwinGetEmailCode SUCCESS', res);
        return res.info;
    } catch (err) {
        log.e('granwinGetEmailCode ERROR', err);
        throw err;
    }
}

export async function granwinUserRegister(email, password, code) {
    log.i('granwinUserRegister Invoked');

    try {
        const merchantId = '100000000000000000';
        const url = `${granwinServiceBase}/user/register?merchantId=${merchantId}&account=${email}&email=${email}&password=${password}&code=${code}`;
        const res = await myRequest({
            url,
            method: 'post',
        });

        if (res.code !== 0) {
            log.e('granwinUserRegister ERROR', res);
            throw new Error(res.tip);
        }

        log.i('granwinUserRegister SUCCESS', res);
        return res.info;
    } catch (err) {
        log.e('granwinUserRegister ERROR', err);
        throw err;
    }
}

export async function getInventDeviceNameService(granwinToken) {
    log.i('getInventDeviceNameService Invoked');

    try {
        const url = `${granwinServiceBase}/device/invent/certificate/get`;
        const res = await myRequest({
            url,
            method: 'post',
            header: {
                token: granwinToken,
            },
        });

        if (res.code !== 0) {
            log.e('getInventDeviceNameService ERROR', res);
            throw new Error(res.tip);
        }

        // 解析虚拟设备名称
        log.i('getInventDeviceNameService SUCCESS', res);
        return res.info.thingName;
    } catch (err) {
        log.e('getInventDeviceNameService ERROR', err);
        throw err;
    }
}
