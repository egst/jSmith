import {
  events,
  attributes,
  dataset,
  allAttributeSetters,
  allAwaitSetters,
  allAtributes,
  allPrefixedAttributes,
  awaitSetters
} from '../domtools.js'

import { config } from '../config.js'

import {
  empty,
  iterable
} from '../itertools.js'

import { mixin } from '../mixin.js'

import { logger } from '../logger.js'

import { symbols } from '../tools.js'

if (window.objId == null)
  window.objId = 0

// jSmith element mixin:
export const JElem = mixin(symbol => (s = HTMLElement) => class extends s {
  [symbol]                       = null;
  
  [Symbol.for('context')]        = {};
  [Symbol.for('contexts')]       = [];
  
  [Symbol.for('isLoaded')]       = false;
  [Symbol.for('isDeleted')]      = false;
  
  [Symbol.for('loopOver')]       = null;
  [Symbol.for('condition')]      = true;
  
  /*[Symbol.for('customPreLoad')]  = null;
  [Symbol.for('customLoad')]     = null;
  [Symbol.for('customPostLoad')] = null;*/
  
  // TODO: Own symbol registry

  constructor () {
    super()

    this.objId = ++window.objId

    //logger.debug(3, 'construct', this)

    events(this).jLoad = () => { symbols(this).isLoaded = true }
    events(this).connect = () => { logger.debug(1, 'connection load', this); jWrap(this).load() }
    
    logger.debug(1, 'construction load', this.elem)
    jWrap(this).load()
  }

  connectedCallback () {
    // TODO: call super
    //logger.debug(3, 'connect', this)
    //this[Symbol.for('isConnected')] = true
    this.dispatchEvent(new Event('connect'))
  }
})

// JElem(HTMLElement) or JElem() for autonomous custom elements.
// JElem(HTML[SomeSpecific]Element) for customized built-in elements.
// Both are instanceof JElem and HTMLElement.
// Customized built-in elements are instanceof the provided constructor as well.

// All methods are static so that they do not shadow the inherited ones.

export class JElemWrap {
  constructor (elem) {
    this.elem = elem
  }

  get context  ()    { return symbols(this.elem).context || {}  }
  set context  (val) { symbols(this.elem).context = val         }
  get contexts ()    { return symbols(this.elem).contexts || [] }
  set contexts (val) { symbols(this.elem).contexts = val        }

  async evaluate (str) {
    const evaluated = window.evaluator(...this.contexts)(str)
    if (evaluated instanceof Promise)
      return await evaluated
    else
      return evaluated
  }

  get isLoaded () { return symbols(this.elem).isLoaded }
  set jLoad (val) { events(this.elem).jLoad = val }

  //get isConnected () { return this.elem[Symbol.for('isConnected')] }
  get isConnected () { return this.elem.isConnected }
  get isRoot      () { return this.isConnected && this.parent == null } // Works only after setFirstJParent!

  delete () { symbols(this.elem).isDeleted = true }
  get isDeleted () { return symbols(this.elem).isDeleted }

  remove () { this.elem.remove(); this.delete() }
  
  copy () {
    const copy = this.elem.cloneNode()
    //jWrap(copy).
  }

  //get children () { return this.getFirstJChildren() }

  loadOrJChildren (context = null) {
    if (this.elem instanceof JElem) {
      logger.debug(1, 'direct load', this.elem)
      this.load(context)
    } else for (const child of this.getFirstJChildren()) {
      logger.debug(1, 'child load', this.elem)
      jWrap(child).load(context)
    }
  }

  load (context = null) {
    if (!this.elem instanceof JElem) return
    if (this.isDeleted) {
      logger.debug(1, 'deleted', this.elem)
      return
    }

    if (!window.upgrade) { // Wait until all elements upgraded.
      //logger.debug(2, 'defer until upgrade')
      events(window).upgrade = () => { logger.debug(1, 'upgrade load', this.elem); this.load(context) }
      return
    }

    logger.debug(1, 'load', this.elem)
    this.setFirstJParent()
    logger.debug(1, 'parent', this.parent)
    if (!this.isConnected) {
      logger.debug(1, 'defer until connection')
      
    } else if (this.parent != null && !jWrap(this.parent).isLoaded) { // Wait until parent element loaded.
      logger.debug(1, 'defer until parent load')
      events(this.parent).jLoad = () => { logger.debug(1, 'parent load c.a. load', this.elem); this.contextAwareLoad(context) }
    } else
      this.contextAwareLoad(context)
  }

  get customPreLoad  ()    { return this.elem[Symbol.for('customPreLoad')]        }
  set customPreLoad  (val) { return this.elem[Symbol.for('customPreLoad')] = val  }
  get customLoad     ()    { return this.elem[Symbol.for('customLoad')]           }
  set customLoad     (val) { return this.elem[Symbol.for('customLoad')] = val     }
  get customPostLoad ()    { return this.elem[Symbol.for('customPostLoad')]       }
  set customPostLoad (val) { return this.elem[Symbol.for('customPostLoad')] = val }

  async contextAwareLoad (context = null) {
    logger.debug(1, 'context aware load', this.elem)

    /*if (awaitSetters(this.elem).context != null) {
      const result = await this.evaluate(dataset(this.elem).context)
      this.evaluate(`${dataset(this.elem).context} = ${result}`) // Temporary solution
    }*/
    
    await this.setContexts(context)

    /*for (const attr of Object.keys(allAwaitSetters(this.elem))) {
      if (attr == 'context')
        continue
      console.log('wait', attr)
      const result = await this.evaluate(dataset(this.elem)[attr])
      console.log('result', result)
      console.log('eval', `${dataset(this.elem)[attr]} = ${result}`)
      console.log('current', this.evaluate(dataset(this.elem)[attr]))
      this.evaluate(`${dataset(this.elem)[attr]} = ${result}`) // Temporary solution
      console.log('assigned', this.evaluate(dataset(this.elem)[attr]))
      console.log('articles', this.evaluate('articles'))
    }*/

    await this.setCondition()
    if (this.isDisabled) {
      this.disable()
      return
    }

    if (this.customPreLoad != null && !await this.customPreLoad.call(this.elem)) {
      logger.debug(1, 'load aborted at custom pre-load', this.elem)
      return
    }

    await this.setLoop()
    if (this.isLoop) {
      this.loop()
      return
    }

    await this.fullLoad()
  }

  async fullLoad () {
    logger.debug(1, 'full load', this.elem)

    if (this.customLoad != null && !await this.customLoad.call(this.elem)) {
      logger.debug(1, 'load aborted at custom load', this.elem)
      return
    }
    
    await this.loadAttributes()
    await this.loadText()

    if (this.customPostLoad != null && !await this.customPostLoad.call(this.elem)) {
      logger.debug(1, 'load aborted at custom post-load', this.elem)
      return
    }

    this.elem.dispatchEvent(new Event('jLoad'))
    logger.debug(1, 'loaded', this.elem)
  }

  async loadText () {
    if (!(this.elem instanceof JElem)) return
    if (dataset(this.elem).text == null) return
    this.elem.innerText = await this.evaluate(dataset(this.elem).text) || ''
  }

  async loadAttributes () {
    //for (const [attr, val] of Object.entries(allAttributeSetters(this.elem)))
    Object.entries(allAttributeSetters(this.elem)).forEach(async ([attr, val]) =>
      attributes(this.elem)[attr] = await this.evaluate(val) || '')
  }

  getFirstJChildren (prev = []) {
    const children = this.elem.children
    if (iterable(children) && !empty(children)) for (const child of children) {
      if (child instanceof JElem)
        prev.push(child)
      else
        jWrap(child).getFirstJChildren(prev)
    }
    return prev
  }

  setFirstJParent () {
    for (let parent = this.elem.parentElement; parent != null; parent = parent.parentElement)
      if (parent instanceof JElem) {
        this.parent = parent
        break
      }
  }

  get parentContexts () {
    return this.parent != null ? jWrap(this.parent).contexts : []
  }

  runOnJChildren = f => (...args) => {
    const children = this.elem.children
    if (!empty(children)) for (const child of children) {
      if (child instanceof JElem)
        f(this.elem, ...args)
      jWrap(child).runOnJChildren(f)(...args)
    }
  }
  
  runMethodOnJChildren = f => this.runOnJChildren(f.bind(this.elem))

  get hasInternalContext () { return dataset(this.elem)['internal-context'] != null && this.context != null }
  set internalContext (context) {
    if (!(this.elem instanceof JElem)) return
    logger.debug(1, 'internal', this.elem)
    delete dataset(this.elem).context
    dataset(this.elem)['internal-context'] = ''
    this.context = context
    logger.debug(1, 'internal context', context)
  }

  async setContexts () {
    if (!(this.elem instanceof JElem)) return
    logger.debug(1, 'set contexts', this.context)

    this.contexts = [...this.parentContexts]
    
    if (!this.hasInternalContext)
      this.context = await this.evaluate(dataset(this.elem).context) || {}
    
    logger.debug(1, 'set contexts', this.context)

    if (!empty(this.context))
      this.contexts.push(this.context)
  }

  setChildContexts = this.runMethodOnJChildren(this.setContexts)

  loadChildren = this.runMethodOnJChildren(this.load)

  get loopOver ()    { return this.elem[Symbol.for('loopOver')] }
  set loopOver (val) { this.elem[Symbol.for('loopOver')] = val  }

  get isLoop () { return this.loopOver != null }

  async setLoop (loopOver = null) {
    if (!(this.elem instanceof JElem)) return
    if (this.elem.parentElement == null) {
      this.loopOver = null
      return
    }

    if (loopOver != null)
      this.loopOver = loopOver
    else if (dataset(this.elem).loop != null) {
      const evaluated = await this.evaluate(dataset(this.elem).loop)
      this.loopOver = iterable(evaluated) ? evaluated : []
    }
  }
  
  loop () {
    if (!this.isLoop) return

    const parent = this.elem.parentElement
    if (parent == null) return

    for (const context of this.loopOver) {
      const clone = this.elem.cloneNode(true) // TODO: Events are not cloned
      delete dataset(clone)['loop']
      /*delete dataset(clone)['context']
      dataset(clone)['internal-context'] = ''
      jWrap(clone).context = context*/
      jWrap(clone).internalContext = context
      parent.appendChild(clone)
    }
    this.remove()
  }

  get condition ()    { return this.elem[Symbol.for('condition')] }
  set condition (val) { this.elem[Symbol.for('condition')] = val  }

  get isDisabled () { return !this.condition }

  async setCondition (condition = null) {
    if (!(this.elem instanceof JElem)) return
    
    if (this.elem.parentElement == null) {
      this.condition = true
      return
    }

    if (condition != null)
      this.condition = Boolean(condition)
    else if (dataset(this.elem).if != null) {
      this.condition = Boolean(await this.evaluate(dataset(this.elem).if))
    }
  }

  disable () {
    if (!this.isDisabled) return
    logger.debug(1, 'contexts', this.contexts)
    logger.debug(1, 'disable', this.elem)
    this.remove()
  }
}

export const jWrap = elem => new JElemWrap(elem)