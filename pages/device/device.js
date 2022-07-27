const CallKitSDK = require('../../callkit/index');
const { log } = require('../../utils/index');

const order = ['demo1', 'demo2', 'demo3'];

Page({
    data: {
        userData: {},
        deviceId: '',
    },

    onShow() {
        // 获取当前用户信息，显示用户信息
        this.setData({
            userData: CallKitSDK.getAccountManager().getUserData(),
        });
    },

    onLoad() {
        // peer 呼叫请求事件
        this.peerRequestEventCallbackUnsubscribe = CallKitSDK.getCallkitManager().peerRequestEventCallback((event) => {
            log.i('peerRequestEventCallback invoked');
            const attachMsg = event.attachMsg || '';
            // 调转到待接听界面
            wx.navigateTo({
                url: `/pages/answer/answer?attachMsg=${attachMsg}`,
            });
        });

        // peer 正在忙事件
        this.peerBusyEventCallbackUnsubscribe = CallKitSDK.getCallkitManager().peerBusyEventCallback((event) => {
            log.i('peerBusyEventCallback invoked');
            wx.showToast({
                title: '对方正忙',
                icon: 'error',
                mask: true,
            });
        });

        // peer 接听事件
        this.peerAnswerEventCallbackUnsubscribe = CallKitSDK.getCallkitManager().peerAnswerEventCallback((event) => {
            log.i('peerAnswerEventCallback invoked');
            wx.hideLoading();
            // peer 接听后跳转到 live 界面
            wx.navigateTo({
                url: '/pages/live/live',
            });
        });

        // peer 挂断事件
        this.peerHangupEventCallbackUnsubscribe = CallKitSDK.getCallkitManager().peerHangupEventCallback((event) => {
            log.i('peerHangupEventCallback invoked');
            wx.showToast({
                title: '对方挂断',
                icon: 'error',
                mask: true,
            });
        });
    },

    onUnload() {
        // 退出界面时解除所有事件的绑定
        this.peerRequestEventCallbackUnsubscribe();
        this.peerBusyEventCallbackUnsubscribe();
        this.peerAnswerEventCallbackUnsubscribe();
        this.peerHangupEventCallbackUnsubscribe();
    },

    deviceIdInput(e) {
        this.setData({
            deviceId: e.detail.value,
        });
    },

    callOnClick(event) {
        const { deviceId } = this.data;
        const attachMsg = 'Hello world from wechat.';

        if (!deviceId) {
            wx.showToast({
                title: '输入设备ID',
                icon: 'error',
            });
            return;
        }

        wx.showLoading({
            title: '正在呼叫',
            mask: true,
        });

        CallKitSDK.getCallkitManager().callDevice(deviceId, attachMsg)
            .then((res) => {
            // wx.hideLoading() // DO NOT hide loading here, we still waiting for peer response
            // wx.showModal({
            //     title: '正在呼叫...',
            //     showCancel: false,
            //     confirmText: '取消呼叫',
            //     success: (res) => {
            //         if (res.confirm) {
            //             this.onHangup()
            //         }
            //     }
            // })
            }).catch((err) => {
                log.e(err);
                wx.showToast({
                    title: '呼叫设备失败',
                    icon: 'error',
                });
            });
    },

    onHangup() {
        CallKitSDK.getCallkitManager().hangupDevice()
            .then((res) => {
                wx.hideLoading();
            }).catch((err) => {
                wx.hideLoading();
            });
    },
});
