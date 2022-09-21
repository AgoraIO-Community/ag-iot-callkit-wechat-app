const CallKitSDK = require('../../callkit/index');
const { log } = require('../../utils/index');
// 引入 callkit config 文件，在 init 项目的时候传入config文件
const config = require('../../callkit.config.js');

Page({
    data: {
        username: '',
        password: '',
    },
    onSubmit(event) {
        if (event.detail.target.id === 'register') {
            this.onRegister(event);
        } else if (event.detail.target.id === 'login') {
            this.onLogin(event);
        }
    },

    onRegister(event) {
        const username = event.detail.value.username.trim();
        const password = event.detail.value.password.trim();
        if (username === '') {
            wx.showToast({
                title: '请输入用户名',
                icon: 'none',
            });
            return;
        }
        if (password === '') {
            wx.showToast({
                title: '请输入密码',
                icon: 'none',
            });
            return;
        }

        wx.showLoading({
            title: '正在注册中',
            mask: false,
        });

        CallKitSDK.getAccountManager().registerAccount(username, password)
            .then(() => {
                wx.hideLoading();
                wx.showToast({
                    title: '注册成功',
                    icon: 'none',
                });
            })
            .catch((err) => {
                log.e(err);
                const title = err.errMsg || err.message || '注册失败！';
                wx.showToast({
                    title,
                    icon: 'none',
                });
            });
    },

    onLogin(event) {
        const username = event.detail.value.username.trim();
        const password = event.detail.value.password.trim();
        if (username === '') {
            wx.showToast({
                title: '请输入用户名',
                icon: 'none',
            });
            return;
        }
        if (password === '') {
            wx.showToast({
                title: '请输入密码',
                icon: 'none',
            });
            return;
        }

        wx.showLoading({
            title: '正在登陆中',
            mask: false,
        });

        // 用户登陆，并且建立mqtt连接
        CallKitSDK.getAccountManager().initSdk(config, username, password)
            .then(() => {
                wx.hideLoading();
                wx.switchTab({ url: '/pages/device/device' });
            })
            .catch((err) => {
                log.e(err);
                const title = err.errMsg || err.message || '登录失败！';
                wx.showToast({
                    title,
                    icon: 'none',
                });
            });
    },
});
