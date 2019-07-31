// DOM attributes proxy:
export const prefixedAttributes = prefix => elem => {
  const prefixed = attr => prefix == null ? attr : `${prefix}-${attr}`
  return new Proxy({}, {
    set (target, prop, val) {
      elem.setAttribute(prefixed(prop), val)
      return true
    },
    get (target, prop) {
      const val = elem.getAttribute(prefixed(prop))
      return (val == null && elem.hasAttribute(prefixed(prop))
        ? ''
        : val)
    },
    deleteProperty (target, prop) {
      elem.removeAttribute(prefixed(prop))
      return true
    }
  })
}

export const attributes = prefixedAttributes()
export const dataset = prefixedAttributes('data')
export const attributeSetters = prefixedAttributes('data-attr')
export const awaitSetters = prefixedAttributes('data-await')

export const allPrefixedAttributes = prefix => elem => {
  let attributes = [...elem.attributes]
  if (prefix != null)
    attributes = attributes.filter(attr => attr.nodeName.startsWith(`${prefix}-`))
  const begin = prefix == null ? 0 : prefix.length + 1
  return attributes.reduce((acc, cur) => (acc[cur.nodeName.slice(begin)] = cur.nodeValue, acc), {})
}
// TODO: Iterable Proxy

export const allAtributes = allPrefixedAttributes()
export const allAttributeSetters = allPrefixedAttributes('data-attr')
export const allAwaitSetters = allPrefixedAttributes('data-await')

export const observeMutations = (elem, callbacks, ...observations) => {
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      const callback = callbacks[mutation.type]
      if (typeof callback == 'function')
        callback(mutation)
    }
  })
  const options = {}
  for (const callbackName of Object.keys(callbacks))
    options[callbackName] = true
  for (const callbackName of observations)
    options[callbackName] = true
  observer.observe(elem, options)
}

// Get constructor (class) from tag name:
export const tagCtor = tag => document.createElement(tag).constructor