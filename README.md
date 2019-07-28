# jSmith

A pure JS template engine.

## Implementation and use

**jSmith** uses web components. There are a few autonomous custom elements for specific use-cases, and a customized built-in element provided for every tag listed in `jSmith/config.js`. Any tag may be added. Creation of a customized extension happens automatically based on this list. The customized extensions have the same name, only prefixed with `j-` or any other prefix provided in the config. Both automonous and customized built-in elements provided by **jSmith** are `instanceof` `JElem`, which is a "mixin", that `extends` `HTMLElement` by default, but any other constructor may be provided:

```JS
class extends JElem(HTMLImageElement) // is used for j-img
class extends JElem(HTMLElement)      // is used for autonomous elements
class extends JElem()                 // HTMLElement is the default superclass
```

All necessary methods and properties are implemented as symbol properties*, so no conflicts should arise from extending more complicated elements. Most of the functions used on these elements are implemented as methods of `JElemWrap` which is a wrapper around any element, that provides special functionality to those that are `instanceof JElem` and some minor additions for other elements as well:

_*) TODO: Some sort of custom symbol registry instead of using `Symbol.for`, which could still theoretically cause collisions._

```JS
new JElemWrap(elem) // constructing the wrap
jWrap(elem)         // shorthand function
jWrap(elem).load()  // example use
```

If the tag is listed in `config.js` it may be extended directly in HTML as usual:

```HTML
<img is="j-img">
```

**jSmith** then operates mostly on elements that are `instanceof JElem` and ignores others. This way, there is no overhead in loading of elements and parts of the document, that do not use the `JElem` extension. `JElem` children load is defered until their connection and their `JElem` parent's context load* and may wait for any user-provided data, that is a `Promise`.

_*) TODO: Currently it is defered until full load, which is unnesessary._

`JElem` elements support special `data-` attributes, that perform all the templating functionality.

### Context

All the following `data-` attributes accept plain JS as their value, which is evaluated in the element's context. `JElem` elements may have their own context provided with the `data-context` attribute. Any JS `object` (or a `Promise`) is expected. `JElem` elements also inherit contexts of their `JElem` parents. Nested element's context potentially shadows their parent's contexts. The default context is the global scope*, so any `window` properties or globally defined (in non-module mode) variables may be used in `JElem` element's special `data-` attributes right away, including the `data-context` attribute. Once the `data-context` attribute is set, the given context is added to all the previous contexts of the element and any other special `data-` attribute now accepts names in the resulting contexts.

_*) TODO: Some sort of "sandbox" for this evaluation istead of just using the global context._

```JS
const pageData = {
    title: 'jSmith test',
    color: '#faee32'
}
```

```HTML
<head is="j-head" data-context="pageData">
    <title is="j-title" data-text="title"></title>
    <meta is="j-meta" name="theme-color" data-attr-content="color">
</head>
```

`pageData` is set globally, so it may be used in the `data-context` attribute to set the context of `j-head`. `j-title` then inherits this context and accepts `title` from `pageData` in its `data-text` attribute. Same goes for the `j-meta` element.

### Text & attributes

Two basic HTML manipulation tools are currently implemented: `data-text` and `data-attr-`. `data-text` accepts any JS expression, that is then evaluated in the current context and its value is set as the `innerText` of the element. `data-attr-` is a (potentially infinitie) set of attributes, that serve as setters for any other attribute. `data-attr-some-attribute` evaluates its value in the current context and sets it as a value of `some-attribute` attribute of the element.

```HTML
<head is="j-head" data-context="pageData">
    <title is="j-title" data-text="title"></title>
    <meta is="j-meta" name="theme-color" data-attr-content="color">
</head>
```

The example above results in:

```HTML
<head is="j-head" data-context="pageData">
    <title is="j-title" data-text="title">jSmith test</title>
    <meta is="j-meta" name="theme-color" data-attr-content="color" content="#faee32">
</head>
```

TODO: Some sort of "clean-up" mode that removes all the special `data-` attributes afterwards. However it is sometimes important to keep these attributes as they carry information that might be used later, for example when the whole element is moved elsewhere and is expected to be reloaded in the new context. In the following examples, some of the special `data-` attributes will be removed in the "result examples" just for the sake of visual simpliity.

### Conditions

The first "built-in"* structure processing is the `data-if` condition. When its value is evaluated as falsey, the whole element's loading process is aborted and the element is immediately deleted. Since the loading process is aborted, a `jLoad` event is never triggered. This is an event, that the children are waiting for, before they can start their own loading process. The children of such element are therefore never loaded.

_*) Additional processing may be defined in special callbacks, that are called at particular time during the "built-in" loading process. This will be demonstrated later._

### Loops

The second "built-in" structure processing is looping which is expressed with the `data-loop` attribute. Its `value` is evaluated and possibly reset to `[]`, if it's not an iterable `object`. The whole element is then coppied `for (const item of value)` and the individual coppies are assigned an internal context of `item`. The internal context is the same context, that is set by `data-context`, but set internally without the use of `data-context`. It usually doesn't refer to any named `object` specified in the whole context chain, but rather to some `object` created "on the fly" with no name associated with it. So the `object` has no name, that might be used in the `data-context` attribute. To keep the internal implementation and the "visble" state of the HTML document in sync, any `data-context` attribute is removed when setting the internal context, and replaced by `data-internal-context` attribute with no value.

The original element is then removed and its loading process is aborted, the `jElem` event is never triggered, and its children are never loaded.

So the loop iterates over values of the given object. To iterate over keys or the whole entries, an additional helper function must be used, that may be used right in the `data-loop` attribute value, as all the special `data-` attributes accept any JS expression, that can be evaluated in the current context. For example:

```JS
window.pageData = {
  articles: [
    {
      title: 'Article Title',
      thumbnail: 'thumbnail.jpg',
      content: [
        ['h3', 'Some Title'],
        ['p', 'text...'],
        ['p', 'another text...'],
        ['h3', 'Other Title'],
        ['p', 'yet another text...'],
        ['img', 'pic.jpg']
      ]
    }
    // etc ...
  ],
  fn: {
    labelKeyval: (obj, k, v) => Object.entries(obj).map(([key, val]) => ({ [k]: key, [v]: val })),
    labelList: (arr, ...labels) => arr.map(list => [...zip(labels, list)].reduce((acc, [label, item]) => (acc[label] = item, acc), {}))
  }
}
```

```HTML
<body is="j-body" data-context="pageData">
    <article is="j-article" data-loop="articles">
        <j-tmp data-loop="fn.labelList(content, 'tag', 'val')">
            <img
                is="j-img"
                data-case="tag == 'img'"
                data-attr-src="val">
        </j-tmp>
    </article>
</body>
```

In the example above, the `j-article` element is looped over `pageData.articles` and becomes:

```HTML
<body is="j-body" data-context="pageData">
    <article is="j-article" data-internal-context>
        <j-tmp data-loop="fn.labelList(content, 'tag', 'val')">
            <img
                is="j-img"
                data-if="tag == 'img'"
                data-attr-src="val">
        </j-tmp>
    </article>
    <!-- etc... -->
</body>
```

The internal context of the first `j-article` is `pageData.articles[0]`. `content` in the following `data-loop` refers to `pageData.articles[0].content` now. The `fn.labelList` function transforms it into the following format:

```JS
[
  {
    tag: 'h3',
    val: 'Some Tite'
  },
  {
    tag: 'p',
    val: 'text...'
  }
  // etc...
]
```

The `j-tmp` element is then looped over this `object`, and the individual items `{tag: '...', val: '...'}` are set as internal contexts of the individual coppies of the looped `j-tmp` element. As a result, `tag` and `val` are valid names to be used inside the loop. The `j-img` element then demonstrates the use of `data-if` and `data-attr-` attributes.

This will choose only the `img` tags in the given data and will result in:

```HTML
<body is="j-body" data-context="pageData">
    <article is="j-article" data-internal-context>
        <img is="j-img" src="pic.jpg">
    </article>
    <!-- etc... -->
</body>
```

(The temporary wrapping functionality of `j-tmp` will be explained later.)

### Switch

`j-switch` is an autonomous custom element, that is built on top of the internal ("built-in") loading process of `JElem` elements. During the loading proccess of `JElem` elements, a few callbacks are called on the element at different stages:

* `[Symbol.for('customPreLoad')]` is called after checking whether the element is to be removed based on `data-if`.
* `[Symbol.for('customLoad')]` is called after checking whether the element is to be looped vased on `data-loop`.
* `[Symbol.for('customPostLoad')]` is called after `innerText` and attributes have been set based on `data-text` and `data-attr-`.

So `customPreLoad` is never called on `data-if` removed elements and `customLoad` (and `customPostLoad`) is never called on `data-loop` looped elements (only on their copies).

These callbacks may be used to build on top of the existing process as do the autonomous custom elements provided by **jSmith**.

`j-switch` is a temporary wrapper element, that introduces a few special `data-` attributes for its direct children. `j-switch` checks its children's `data-case` attributes and selects the first one with a truthy value of this attribute. It then keeps only this element, inserts it at the original position of the `j-switch` element and removes itself along with all the other children. The default case may be provided with `data-case="true"` or a `data-default-case` shorthand. This is not an exact replica of the standard `switch` in JS and other languages. `j-switch` only chooses the first element with truthy `data-case` value, so the "default case" (even when using the `data-case-default` shorthand) must always be the last one.

### Tmp

Another autonomous custom element providing the temporary wrapping functionality (and the temporary wrapping functionality only) is `j-tmp`. `j-tmp` may have its own context (as any other `JElem` element) that is inherited by its children. However, this context is assigned as internal context of the children along with their previous context. The same idea of shadowing is applied even here, so the result is the same, as if the children simply inherited the context. It then inserts its children at the original position of the `j-tmp` element and removes itself. Unlike `j-switch` which keeps and then "unwraps" only the one child, `j-tmp` keeps all of its `childNodes`, including text and comments.

### Tag casting

The idea of type casting is incorporated into **jSmith** as tag casting. **jSmith** provides an autonomous custom element `j-any`, that may be "casted" to any tag at "run time" - it may be converted to a tag, the name of which is known only after evaluating some expressions in some contexts provided in the special `data-` attributes. The resulting tag to cast to is specified in the `data-cast` attribute.

Based on the previous example:

```HTML
<j-tmp data-loop="fn.labelList(content, 'tag', 'val')">
    <j-switch>
        <img
            is="j-img"
            data-case="tag == 'img'"
            data-attr-src="val">
        <j-any
            data-cast="tag"
            data-default-case
            data-text="val"></j-any>
    </j-switch>
</j-tmp>
```

The `j-tmp` element is looped over the modified array of `{tag: '...', val: '...'}` `object`s. The children of `j-switch` then use the `tag` variable to decide whether they're the right tags for the current item and the `val` variable to set some kind of value based on the tag type. If `tag == 'img'`, the `j-img` element is chosen and it then sets its `src` attribute to `val`. Otherwise, the `j-any` element is chosen and it is then casted to a `<${tag} is="j-${tag}">` element, which then sets its `innerText` to `val`.

## Promises

Often the page data must be aquired from some kind of server-side API. These requests to the server take some time and are usually implemented in JS with the fetch API, that works with `Promise`s. **jSmith** accepts data for the contexts as `Promise`s. The loading of the `JElem` elements is divided into a few stages. The first one is synchronous and calles the next one as an asynchronous function. The following stages are performed asynchronously and may at some point wait for some data from the contexts to resolve. Any data may be provided as a `Promise`, it is then automatically recognized as a `Promise`, the loading process halts and waits for it to be resolved, then uses the resolved value.

TODO: There is no need to wait with the `jLoad` event once the most imporant data (such the context itself and maybe conditions and loops) is resolved.

For example, the `articles` from the example above may be aquired by some `async function fetchArticles`, that returns a promise:

```JS
const pageData = {
  color: '#faee32',
  title: 'jSmith test',
  articles: fetchArticles()
}
```
