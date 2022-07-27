// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { uglify } from "rollup-plugin-uglify";

export default {
  input: './callkit/index.js',
  output: {
    file: './dist/agora_callkit_wechat_sdk.js',
    format: 'es'
  },
  plugins: [commonjs(), resolve(), uglify()]
};