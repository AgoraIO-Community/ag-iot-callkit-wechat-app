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

export const DEBUG = true;

// Agora Master Server URL
const CONFIG_MASTER_SERVER_URL = 'https://app.agoralink-iot-cn.sd-rtn.com';
// Agora Slave Server URL
const CONFIG_SLAVE_SERVER_URL = 'https://api.agora.io/agoralink/cn/api';

export const agoraBaseUrl = `${CONFIG_SLAVE_SERVER_URL}/call-service/v1`;
export const agoraBaseAuthUrl = `${CONFIG_SLAVE_SERVER_URL}/oauth`;
export const granwinServiceBase = CONFIG_MASTER_SERVER_URL;
export const CLIENT_ID = '9598156a7d15428f83f828a70f40aad5';
export const CLIENT_SECRET = 'MRbRz1kGau9BZE0gWRh9YMZSYc1Ue06v';
