// Mixin with instanceof functionality:
export const mixin = f => {
  const symbol = Symbol()
  const m = f(symbol)

  Object.defineProperty(m, Symbol.hasInstance, {
    value: obj => typeof obj == 'object' && symbol in obj
    /*function (obj) {
      while (obj != null) {
        if (obj.hasOwnProperty(symbol))
          return true
        obj = Object.getPrototypeOf(obj)
      }
      return false
    }*/
  })

  return m
}