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

export default class IoTClient {
    constructor(data) {
        this.appId = data.appId;
        this.productKey = data.productKey;
        this.projectId = data.projectId;
        this.username = data.username;
        this.account = data.account;
        this.granwinToken = data.granwinToken;
        this.granwinTokenExpiration = data.granwinTokenExpiration;
        this.sessionToken = data.sessionToken;
        this.sessionExpiration = data.sessionExpiration;
        this.accessKeyId = data.accessKeyId;
        this.secretKey = data.secretKey;
        this.endpoint = data.endpoint;
        this.region = data.region;
        this.clientId = data.clientId;
        this.inventDeviceName = data.inventDeviceName;
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.tokenExpiresIn = data.tokenExpiresIn;
    }

    updateClient(data) {
        if (data.appId) this.appId = data.appId;
        if (data.productKey) this.productKey = data.productKey;
        if (data.projectId) this.projectId = data.projectId;
        if (data.username) this.username = data.username;
        if (data.account) this.account = data.account;
        if (data.granwinToken) this.granwinToken = data.granwinToken;
        if (data.granwinTokenExpiration) this.granwinTokenExpiration = data.granwinTokenExpiration;
        if (data.sessionToken) this.sessionToken = data.sessionToken;
        if (data.sessionExpiration) this.sessionExpiration = data.sessionExpiration;
        if (data.accessKeyId) this.accessKeyId = data.accessKeyId;
        if (data.secretKey) this.secretKey = data.secretKey;
        if (data.endpoint) this.endpoint = data.endpoint;
        if (data.region) this.region = data.region;
        if (data.clientId) this.clientId = data.clientId;
        if (data.inventDeviceName) this.inventDeviceName = data.inventDeviceName;
        if (data.accessToken) this.accessToken = data.accessToken;
        if (data.refreshToken) this.refreshToken = data.refreshToken;
        if (data.tokenExpiresIn) this.tokenExpiresIn = data.tokenExpiresIn;
    }

    isGranwinTokenExpired() {
        return new Date().getTime() >= (this.granwinTokenExpiration - 10000);
    }

    isSessionTokenExpired() {
        return new Date().getTime() >= (this.sessionExpiration - 10000);
    }

    isAgoraTokenExpired() {
        return new Date().getTime() >= (this.tokenExpiresIn - 10000);
    }
}
