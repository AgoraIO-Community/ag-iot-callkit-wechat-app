# Agora CallKit SDK for Miniapp

Agora Callkit for Miniapp - https://docs.agora.io/cn/iot-apaas/app_miniapp_api?platform=%e5%be%ae%e4%bf%a1%e5%b0%8f%e7%a8%8b%e5%ba%8f

Agora Calkkit for Miniapp API - https://docs.agora.io/cn/iot-apaas/app_miniapp_api?platform=%E5%BE%AE%E4%BF%A1%E5%B0%8F%E7%A8%8B%E5%BA%8F

Agora RTC - https://docs.agora.io/cn/Video/landing-page?platform=%E5%BE%AE%E4%BF%A1%E5%B0%8F%E7%A8%8B%E5%BA%8F

MqttJS - https://github.com/mqttjs/MQTT.js

## 准备工作

1. 获取小程序组件权限

在[微信公众平台](https://mp.weixin.qq.com/)的小程序开发选项中，切换到接口设置页签，打开实时播放音视频流和实时录制音视频流的开关。

2. 配置服务器域名

在小程序的开发设置里，将如下域名配到服务器域名里，其中 request 合法域名区域填入以 https 开头的域名；socket 合法域名区域点入以 wss 开头的域名。

```
wss://miniapp.agoraio.cn;
wss://a1g2ouvmztk85d.ats.iot.cn-north-1.amazonaws.com.cn;
https://uap-ap-web-1.agora.io;
https://uap-ap-web-2.agoraio.cn;
https://uap-ap-web-3.agora.io;
https://uap-ap-web-4.agoraio.cn;
https://report-ad.agoralab.co;
https://rest-argus-ad.agoralab.co;
https://uni-webcollector.agora.io;
https://api.agora.io;
https://app.agoralink-iot-cn.sd-rtn.com;

```

3. 开通声网小程序服务

    第一次使用微信小程序时，需要参考如下步骤开通服务：

    1. 登录 Agora [控制台](https://console.agora.io/)，点击左侧导航栏的用量图标 ，进入用量页面。

    2. 点击页面左上角聚合用量旁的箭头 ，在下拉框中选择需要开通小程序支持的项目名称。

    3. 在指定项目页面，点击小程序下的分钟数，点击开启小程序服务，然后点击应用。

    4. 开通声网灵隼服务

详见[开通声网灵隼功能](https://docs-preprod.agora.io/cn/iot-apaas/enable_agora_link)。

## 如何开始

1. 下载和安装微信开发者工具 https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

2. yarn

3. 点击开发者工具中的菜单栏：工具 --> 构建 npm

4. 在project根目录创建 callkit.config.js 文件，

```js
module.exports = {
    DEBUG: true,
    APPID: 'YOUR_APPID',
    PRODUCT_KEY: 'YOUR_PRODUCT_KEY',
    PROJECT_ID: 'YOUR_PROJECT_ID',
}
```

App ID：声网的 App ID。

Project ID：声网的项目 ID。

Product Key：声网灵隼产品 ID。

5. 初始化 SDK 和用户登录。

```js
const CallKitSDK = require('../../callkit/index');
const config = require('../../callkit.config.js');

const username = 'username123'

CallKitSDK.getAccountManager().initAndLogin(config, username)
    .then(this.onUserLoginSuccess)
    .catch(this.onLoginFail);
```

username 需要至少6位的字符串，无特殊字符限制。

## 如何构建 callkit sdk

```
npm run rollup
```

or 

```
npm run webpack
```

## 检查代码风格

```
npm run lint
```
