export const symbols = obj =>
  new Proxy({}, {
    get (target, prop) {
      return obj[Symbol.for(prop)]
    },
    set (target, prop, val) {
      obj[Symbol.for(prop)] = val
      return true
    }
  })