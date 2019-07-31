export const symbols = obj =>
  new Proxy({}, {
    get: (_, prop) => obj[Symbol.for(prop)],
    set: (_, prop, val) => (obj[Symbol.for(prop)] = val, true)
  })

export const jSymbols =
  new Proxy(() => {}, {
    get: (_, name) => name in window.jSymbolRegistry
      ? window.jSymbolRegistry[name]
      : window.jSymbolRegistry[name] = Symbol(name),
    apply: (_, __, [obj]) =>
      new Proxy({}, {
        get: (_, prop) => obj[jSymbols[prop]],
        set: (_, prop, val) => (obj[jSymbols[prop]] = val, true),
      })
  })