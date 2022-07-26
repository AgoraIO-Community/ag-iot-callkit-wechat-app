const CallKitSDK = require('../../callkit/index');
const { log } = require('../../utils/index');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        playUrl: '',
        pushUrl: '',
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        wx.showLoading({
            title: '正在拉取流',
            mask: false,
        });

        // peer加入频道，获得播放地址
        this.peerStreamAddedEventCallbackUnsubscribe = CallKitSDK.getCallkitManager().peerStreamAddedEventCallback((playUrl) => {
            log.i('peerStreamAddedEventCallback invoked');
            wx.hideLoading();
            this.setData({
                playUrl,
            });

            // 获得推流地址，开始推流
            CallKitSDK.getCallkitManager().userPublishStream().then((pushUrl) => {
                this.setData({
                    pushUrl,
                });
            }).catch((err) => {
                log.e(err);
                wx.switchTab({ url: '/pages/device/device' });
            });
        });

        // 如果peer挂断呼叫，本地则返回主界面
        this.peerHangupEventCallbackUnsubscribe = CallKitSDK.getCallkitManager().peerHangupEventCallback((event) => {
            log.i('peerHangupEventCallback invoked');
            wx.showToast({
                title: '对方已挂断',
                duration: 1500,
            });
            setTimeout(() => {
                wx.switchTab({ url: '/pages/device/device' });
            }, 1500);
        });

        // peer 正在忙事件
        this.peerBusyEventCallbackUnsubscribe = CallKitSDK.getCallkitManager().peerBusyEventCallback((event) => {
            log.i('peerBusyEventCallback invoked');
            wx.showToast({
                title: '对方正忙',
                duration: 1500,
            });
            setTimeout(() => {
                wx.switchTab({ url: '/pages/device/device' });
            }, 1500);
        });
    },

    // 挂断
    onHangup() {
        CallKitSDK.getCallkitManager().hangupDevice()
            .then((res) => {
                wx.switchTab({ url: '/pages/device/device' });
            }).catch((err) => {
                log.e(err);
                wx.switchTab({ url: '/pages/device/device' });
            });
    },

    muteLocal() {
        CallKitSDK.getCallkitManager().muteLocal('video', true);
    },

    unmuteLocal() {
        CallKitSDK.getCallkitManager().muteLocal('video', false);
    },

    // playerStateChange(e) {
    //     CallKitSDK.getCallkitManager().reportPlayerStateChange(e);
    // },

    // playerNetStatus(e) {
    //     CallKitSDK.getCallkitManager().reportPlayerNetStatus(e);
    // },

    // pusherStateChange(e) {
    //     CallKitSDK.getCallkitManager().reportPusherStateChange(e);
    // },

    // pusherNetStatus(e) {
    //     CallKitSDK.getCallkitManager().reportPusherNetStatus(e);
    // },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        // 当用户退出当前界面，相当于挂断动作
        this.onHangup();
        // 释放监听事件
        this.peerStreamAddedEventCallbackUnsubscribe();
        this.peerHangupEventCallbackUnsubscribe();
        this.peerBusyEventCallbackUnsubscribe();
    },
});
