const Debug = true

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

export const log = {
    ASSERT: 1, ERROR: 2, WARN: 3, INFO: 4, DEBUG: 5, VERBOSE: 6,
    set level(level) {
        if (level >= this.ASSERT) this.a = console.assert.bind(console);
        else this.a = function () { };
        if (level >= this.ERROR) this.e = console.error.bind(console);
        else this.e = function () { };
        if (level >= this.WARN) this.w = console.warn.bind(console);
        else this.w = function () { };
        if (level >= this.INFO) this.i = console.info.bind(console);
        else this.i = function () { };
        if (level >= this.DEBUG) this.d = console.debug.bind(console);
        else this.d = function () { };
        if (level >= this.VERBOSE) this.v = console.log.bind(console);
        else this.v = function () { };
        this.loggingLevel = level;
    },
    get level() { return this.loggingLevel; }
};
log.level = log.DEBUG

module.exports = {
  formatTime,
  log
}
