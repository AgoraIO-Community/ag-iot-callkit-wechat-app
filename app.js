const CallKitSDK = require('./callkit/index')
const log = require('./utils/index').log

App({
  onLaunch() {
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })

    CallKitSDK.getAccountManager().userSessionEndEventCallback((user) => {
        log.i('userSessionEndEventCallback Invoked. User session end and connection closed')

        wx.showToast({
            title: "登陆超时",
            icon: 'error',
        })
        
        wx.redirectTo({
            url: '/pages/login/login',
        })
    })

    CallKitSDK.getCallkitManager().mqttReconnectedEvent(() => {
        log.i('mqtt reconnected event')
    })

    CallKitSDK.getCallkitManager().mqttDisconnectedEvent(() => {
        log.i('mqtt disconnected event')
    })
  },

  globalData: {
    userInfo: null
  }
})
