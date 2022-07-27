const CallKitSDK = require('../../callkit/index');
const { log } = require('../../utils/index');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        name: '',
        attachMsg: '',
        playUrl: '',
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        this.setData({
            name: options.name || '',
            attachMsg: options.attachMsg || '',
        });

        // peer挂断事件，返回主界面
        this.peerHangupEventCallbackUnsubscribe = CallKitSDK.getCallkitManager().peerHangupEventCallback((event) => {
            log.i('peerHangupEventCallback invoked');
            wx.showToast({
                title: '对方已挂断',
                icon: 'error',
                duration: 2000,
            });
            setTimeout(() => {
                wx.switchTab({ url: '/pages/device/device' });
            }, 2000);
        });

        // 待接听时，可以显示peer的预览画面
        this.peerStreamAddedEventCallbackUnsubscribe = CallKitSDK.getCallkitManager().peerStreamAddedEventCallback((playUrl) => {
            log.i('peerStreamAddedEventCallback invoked');
            this.setData({
                playUrl,
            });
        });
    },

    onAccept() {
        CallKitSDK.getCallkitManager().answerDevice()
            .then((res) => {
                wx.navigateTo({
                    url: '/pages/live/live',
                });
            }).catch((err) => {
                wx.switchTab({ url: '/pages/device/device' });
            });
    },

    onHangup() {
        CallKitSDK.getCallkitManager().hangupDevice()
            .then((res) => {
                wx.switchTab({ url: '/pages/device/device' });
            }).catch((err) => {
                wx.switchTab({ url: '/pages/device/device' });
            });
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
