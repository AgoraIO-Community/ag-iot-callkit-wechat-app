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

import { DEBUG } from './config';

export function myRequest(req) {
    return new Promise((resolve, reject) => {
        if (!req.method) {
            req.method = 'get';
        }

        const options = {
            url: req.url,
            method: req.method,
            timeout: 30000,
            success: (res) => {
                resolve(res.data);
            },
            fail: (err) => {
                reject(err);
            },
        };

        if (req.header) {
            options.header = req.header;
        }

        if (req.data) {
            options.data = req.data;
        }

        wx.request(options);
    });
}

export function queryString(data) {
    return Object.keys(data)
        .map((key) => `${key}=${data[key]}`)
        .join('&');
}

export function isLettersAndNumbersOnly(str) {
    if (!str) return false;
    return /^[A-Za-z0-9]*$/.test(str);
}

export function hashCode(str) {
    let hash = 0; let i; let
        chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i += 1) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash;
}

export function base32Encode(s, padding) {
    const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const pad = '=';
    const len = s.length;
    let o = '';
    let w; let c; let r = 0; let
        sh = 0; // word, character, remainder, shift
    for (let i = 0; i < len; i += 5) {
        // mask top 5 bits
        c = s.charCodeAt(i);
        w = 0xf8 & c;
        o += a.charAt(w >> 3);
        r = 0x07 & c;
        sh = 2;

        if ((i + 1) < len) {
            c = s.charCodeAt(i + 1);
            // mask top 2 bits
            w = 0xc0 & c;
            o += a.charAt((r << 2) + (w >> 6));
            o += a.charAt((0x3e & c) >> 1);
            r = c & 0x01;
            sh = 4;
        }

        if ((i + 2) < len) {
            c = s.charCodeAt(i + 2);
            // mask top 4 bits
            w = 0xf0 & c;
            o += a.charAt((r << 4) + (w >> 4));
            r = 0x0f & c;
            sh = 1;
        }

        if ((i + 3) < len) {
            c = s.charCodeAt(i + 3);
            // mask top 1 bit
            w = 0x80 & c;
            o += a.charAt((r << 1) + (w >> 7));
            o += a.charAt((0x7c & c) >> 2);
            r = 0x03 & c;
            sh = 3;
        }

        if ((i + 4) < len) {
            c = s.charCodeAt(i + 4);
            // mask top 3 bits
            w = 0xe0 & c;
            o += a.charAt((r << 3) + (w >> 5));
            o += a.charAt(0x1f & c);
            r = 0;
            sh = 0;
        }
    }
    // Encode the final character.
    if (sh !== 0) { o += a.charAt(r << sh); }

    // if disable padding
    if (padding === false) return o;

    // Calculate length of pad by getting the
    // number of words to reach an 8th octet.
    const padlen = 8 - (o.length % 8);
    // modulus
    if (padlen === 8) { return o; }
    if (padlen === 1) { return o + pad; }
    if (padlen === 3) { return o + pad + pad + pad; }
    if (padlen === 4) { return o + pad + pad + pad + pad; }
    if (padlen === 6) { return o + pad + pad + pad + pad + pad + pad; }
}

export function bin2String(array) {
    let result = '';
    for (let i = 0; i < array.length; i += 1) {
        result += (String.fromCharCode(array[i]));
    }
    return result;
}

export function stringToUint8Array(str) {
    const arr = [];
    for (let i = 0, j = str.length; i < j; i += 1) {
        arr.push(str.charCodeAt(i));
    }
    const tmpUint8Array = new Uint8Array(arr);
    return tmpUint8Array;
}

const formatTime = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`;
};

const formatNumber = (n) => {
    n = n.toString();
    return n[1] ? n : `0${n}`;
};

export const log = {
    i: (...msg) => {
        if (!DEBUG) return;
        const time = formatTime(new Date());
        console.log.apply(console, [`[${time}][SDK]`, ...msg]);
    },
    e: (...msg) => {
        if (!DEBUG) return;
        const time = formatTime(new Date());
        console.error.apply(console, [`[${time}][SDK]`, ...msg]);
    },
};
