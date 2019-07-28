export const logger = {
  level: 0,

  log:   console.log,
  warn:  console.warn,
  error: console.error,

  debug (level, msg, item) {
    /*const copy = typeof item == 'object'
      ? Object.assign({}, item)
      : item*/
    if (level <= this.level) {
      if (item != null && item.objId != null)
        this.log(`%c[🐞] ${msg}`, `color: orange`, item || '', item.objId)
      else
        this.log(`%c[🐞] ${msg}`, `color: orange`, item || '')
    }
  },

  colored (color, log, ...messages) {
    if (window.chrome)
      log(...messages.map(msg => typeof msg == 'string' ? '%c' + msg : msg), 'color: ' + color)
    else
      log(...messages)
    // TODO: Other browsers
  }
}