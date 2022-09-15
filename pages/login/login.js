const CallKitSDK = require('../../callkit/index');
const { log } = require('../../utils/index');
// 引入 callkit config 文件，在 init 项目的时候传入config文件
const config = require('../../callkit.config.js');

Page({
    data: {
        username: '',
    },
    onLoad() {
    },
    onUnload() {
    },
    onSubmit(event) {
        const username = event.detail.value.username.trim();
        if (username === '') {
            wx.showToast({
                title: '请输入用户名',
                icon: 'none',
            });
            return;
        }

        wx.showLoading({
            title: '正在登陆中',
            mask: false,
        });

        // 用户登陆，并且建立mqtt连接
        CallKitSDK.getAccountManager().initAndLogin(config, username)
            .then(this.onUserLoginSuccess)
            .catch(this.onLoginFail);
    },

    onUserLoginSuccess() {
        wx.hideLoading();
        wx.switchTab({ url: '/pages/device/device' });
    },

    onLoginFail(err) {
        log.e(err);
        const title = err.errMsg || err.message || '登录失败！'
        wx.showToast({
            title,
            icon: 'none',
        });
    },
});
