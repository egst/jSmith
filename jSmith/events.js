import { jSymbols } from './symbols.js'

// addEventListener proxy:
export const events = elem =>
  new Proxy({}, {
    set (target, prop, val) {
      elem.addEventListener(prop, val)
      return true
    }
  })
export const jEvents =
  new Proxy(() => {}, {
    get: (_, name) => new CustomEvent(name, {detail: {[jSymbols.event]: null}}),
    apply: (_, __, [obj]) =>
      new Proxy({}, {
        set: (_, name, f) => {
          obj.addEventListener(name, e => {
            if (typeof e.detail == 'object' && jSymbols.event in e.detail)
              f()
          })
          return true
        }
      })
  })