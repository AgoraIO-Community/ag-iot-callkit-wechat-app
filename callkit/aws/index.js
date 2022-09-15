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

const hmacSHA256 = require('../lib/crypto-js/hmac-sha256');
const sha256 = require('../lib/crypto-js/sha256');

function makeTwoDigits(n) {
    if (n > 9) {
        return n;
    }
    return `0${n}`;
}

function getDateTimeString() {
    const d = new Date();

    //
    // The additional ''s are used to force JavaScript to interpret the
    // '+' operator as string concatenation rather than arithmetic.
    //
    return `${d.getUTCFullYear()}${
        makeTwoDigits(d.getUTCMonth() + 1)}${
        makeTwoDigits(d.getUTCDate())}T${
        makeTwoDigits(d.getUTCHours())}${
        makeTwoDigits(d.getUTCMinutes())}${
        makeTwoDigits(d.getUTCSeconds())}Z`;
}

function getDateString(dateTimeString) {
    return dateTimeString.substring(0, dateTimeString.indexOf('T'));
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
    const kDate = hmacSHA256(dateStamp, `AWS4${key}`, {
        asBytes: true,
    });
    const kRegion = hmacSHA256(regionName, kDate, {
        asBytes: true,
    });
    const kService = hmacSHA256(serviceName, kRegion, {
        asBytes: true,
    });
    const kSigning = hmacSHA256('aws4_request', kService, {
        asBytes: true,
    });
    return kSigning;
}

function signPath(
    method,
    hostname,
    path,
    queryParams,
    secretKey,
    region,
    serviceName,
    payload,
    today,
    now,
) {
    const signedHeaders = 'host';
    const canonicalHeaders = `host:${hostname.toLowerCase()}\n`;
    const canonicalRequest = `${method}\n${path}\n${queryParams}\n${canonicalHeaders}\n${signedHeaders}\n${
        sha256(payload, {
            asBytes: true,
        })}`;

    const hashedCanonicalRequest = sha256(canonicalRequest, {
        asBytes: true,
    });
    const stringToSign = `AWS4-HMAC-SHA256\n${now}\n${today}/${region}/${serviceName}/aws4_request\n${hashedCanonicalRequest}`;
    const signingKey = getSignatureKey(secretKey, today, region, serviceName);
    const signature = hmacSHA256(stringToSign, signingKey, {
        asBytes: true,
    });

    const finalParams = `${queryParams}&X-Amz-Signature=${signature}`;
    const signedPath = `${path}?${finalParams}`;

    return signedPath;
}

exports.signUrl = function ({
    endpoint, region, accessKeyId, secretAccessKey,
}) {
    const now = getDateTimeString();
    const today = getDateString(now);
    const path = '/mqtt';
    const method = 'GET';
    const awsServiceName = 'iotdevicegateway';
    const queryParams = 'X-Amz-Algorithm=AWS4-HMAC-SHA256'
        + `&X-Amz-Credential=${accessKeyId}%2F${today}%2F${region}%2F${awsServiceName}%2Faws4_request`
        + `&X-Amz-Date=${now}&X-Amz-SignedHeaders=host`;

    return signPath(method, endpoint, path, queryParams, secretAccessKey, region, awsServiceName, '', today, now);
};
