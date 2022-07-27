module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        'airbnb-base',
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    "ignorePatterns": [
        "event-bus.js",
        "callkit/lib/**"
    ],
    rules: {
        "indent": ["error", 4],
        "quotes": ["error", "single"],
        "no-use-before-define": ["error", {"functions": false, "classes": false}]
    },
    globals: {
        wx: true,
        my: true,
        App: true,
        Page: true,
        getCurrentPages: true,
        getApp: true,
        Component: true,
        requirePlugin: true,
        requireMiniProgram: true,
    },
};
