const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    entry: {
        index: './callkit/index.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'agora_callkit_wechat_sdk.js',
        library: {
            name: 'agoraCallkitSdk',
            type: 'umd',
        },
    },
    devtool: 'source-map',
    mode: 'production',
    optimization: {
        usedExports: true,
    },
    plugins: [
        new BundleAnalyzerPlugin(),
    ],
}