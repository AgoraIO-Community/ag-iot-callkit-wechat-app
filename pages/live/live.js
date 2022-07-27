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
            mask: true,
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
    
    statechange(event) {
        log.i('live-pusher :', event);
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        // 当用户退出当前界面，相当于挂断动作
        this.onHangup();
        // 释放监听事件
        this.peerStreamAddedEventCallbackUnsubscribe();
        this.peerHangupEventCallbackUnsubscribe();
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    },
});
