!function(e,t){"object"==typeof exports?module.exports=exports=t(require("./core")):"function"==typeof define&&define.amd?define(["./core"],t):t(e.CryptoJS)}(this,function(e){var t,a;t=e.lib.Base,a=e.enc.Utf8,e.algo.HMAC=t.extend({init:function(e,t){e=this._hasher=new e.init,"string"==typeof t&&(t=a.parse(t));var i=e.blockSize,n=4*i;(t=t.sigBytes>n?e.finalize(t):t).clamp();for(var e=this._oKey=t.clone(),t=this._iKey=t.clone(),s=e.words,r=t.words,o=0;o<i;o++)s[o]^=1549556828,r[o]^=909522486;e.sigBytes=t.sigBytes=n,this.reset()},reset:function(){var e=this._hasher;e.reset(),e.update(this._iKey)},update:function(e){return this._hasher.update(e),this},finalize:function(e){var t=this._hasher,e=t.finalize(e);return t.reset(),t.finalize(this._oKey.clone().concat(e))}})});