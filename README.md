# jSmith

A pure JS template engine.

## Implementation and use

**jSmith** uses web components. There are a few autonomous custom elements for specific use-cases, and a customized built-in element provided for every tag listed in `jSmith/config.js`. Any tag may be added, creation of a customized extension happens automatically based on this list. The customized extensions have the same name, only prefixed with `j-` or any other prefix provided in the config. Both automonous and customized built-in elements provided by **jSmith** are `instanceof` `JElem`, which is a "mixin", that `extends` `HTMLElement` by default, but any other constructor may be provided:

```JS
class extends JElem(HTMLImageElement) // is used for j-img
class extends JElem(HTMLElement)      // is used for autonomous elements
class extends JElem()                 // HTMLElement is the default superclass
```

All necessary methods and properties are implemented as symbol properties, so no conflicts should arise from extending more complicated elements. Most of the functions used on these elements are implemented as methods of `JElemWrap` which is a wrapper around any element, that provides special functionality to those that are `instanceof JElem` and some minor additions for other elements as well:

```JS
new JElemWrap(elem) // constructing the wrap
jWrap(elem)         // shorthand function
jWrap(elem).load()  // example use
```

If the tag is listed in `config.js` it may be extended directly in HTML as usual:

```HTML
<img is="j-img">
```

**jSmith** then operates mostly on elements that are `instanceof JElem` and ignores others. This way, there is no overhead in loading of elements and parts of the document, that do not use the `JElem` extension.


