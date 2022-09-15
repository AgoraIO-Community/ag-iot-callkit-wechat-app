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

export const RESP_CODE_IN_TALKING = 100001; /// <    对端通话中，无法接听
export const RESP_CODE_ANSWER = 100002; /// <    未通话，无法接听
export const RESP_CODE_HANGUP = 100003; /// <    未通话，无法挂断
export const RESP_CODE_ANSWER_TIMEOUT = 100004; /// < 接听等待超时
export const RESP_CODE_CALL = 100005; /// < 呼叫中，无法再次呼叫
export const RESP_CODE_INVALID_ANSWER = 100006; /// < 无效的Answer应答
export const RESP_CODE_PEER_UNREG = 999999; /// < 被叫端未注册

export const PEER_STREAM_ADDED_EVENT = 200001; // 对端加入频道
export const PEER_HANGUP_EVENT = 200002; // 对端挂断
export const PEER_BUSY_EVENT = 200003; // 对端正在忙
export const PEER_ANSWER_EVENT = 200004; // 对端接听
export const PEER_REQUEST_EVENT = 200005; // 对端来电请求
export const USER_SESSION_END_EVENT = 200006; // 用户登陆状态发生改变

export const MQTT_RECONNECTED = 200010; // mqtt reconnected event
export const MQTT_DISCONNECTED = 200011; // mqtt disconnected event

export const GRANWIN_SERVICE_UNAUTH = 10006; // 未登录或登录失效

export const PACKET_TYPE_PCMU = 0;
export const PACKET_TYPE_PCMA = 8;
export const PACKET_TYPE_G722 = 9;
export const PACKET_TYPE_OPUS = 120;
