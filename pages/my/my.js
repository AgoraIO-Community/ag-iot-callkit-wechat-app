const CallKitSDK = require('../../callkit/index');

Page({
    onLoginOut() {
        // 登出用户，释放rtc和连接资源
        CallKitSDK.getAccountManager().destroySdk();
        wx.redirectTo({
            url: '/pages/login/login',
        });
    },
});
