import {
  attributes,
  dataset,
  allAttributeSetters,
  allAwaitSetters,
  allAtributes,
  allPrefixedAttributes,
  awaitSetters
} from '../domtools.js'

import {
  events,
  jEvents
} from '../events.js'

import { config } from '../config.js'

import {
  empty,
  iterable
} from '../itertools.js'

import { mixin } from '../mixin.js'

import { logger } from '../logger.js'

import { jSymbols } from '../symbols.js'

if (window.objId == null)
  window.objId = 0

// jSmith element mixin:
export const JElem = mixin(symbol => (s = HTMLElement) => class extends s {
  [symbol]                       = null;
  
  [jSymbols.context]        = {};
  [jSymbols.contexts]       = [];
  
  [jSymbols.isLoaded]       = false;
  [jSymbols.isDeleted]      = false;
  
  [jSymbols.loopOver]       = null;
  [jSymbols.condition]      = true;
  
  /*[jSymbols.customPreLoad]  = null;
  [jSymbols.customLoad]     = null;
  [jSymbols.customPostLoad] = null;*/
  
  // TODO: Own symbol registry

  constructor () {
    super()

    this.objId = ++window.objId

    //logger.debug(3, 'construct', this)

    jEvents(this).load   = () => { jSymbols(this).isLoaded = true }
    events(this).connect = () => { logger.debug(1, 'connection load', this); jWrap(this).load() }

    logger.debug(1, 'construction load', this.elem)
    jWrap(this).load()
  }

  connectedCallback () {
    // TODO: call super
    //logger.debug(3, 'connect', this)
    //this[jSymbols.isConnected] = true
    this.dispatchEvent(jEvents.connect)
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

  // Context:
  get context  ()    { return jSymbols(this.elem).context || {}  }
  set context  (val) { jSymbols(this.elem).context = val         }
  get contexts ()    { return jSymbols(this.elem).contexts || [] }
  set contexts (val) { jSymbols(this.elem).contexts = val        }
  // Parent and its context:
  get parent         ()    { return jSymbols(this.elem).parent }
  set parent         (val) { jSymbols(this.elem).parent = val  }
  get parentContexts ()    { return this.parent != null ? jWrap(this.parent).contexts : [] }
  // Internal context:
  get hasInternalContext () { return dataset(this.elem)['internal-context'] != null && this.context != null }
  set internalContext (context) {
    if (!(this.elem instanceof JElem)) return
    logger.debug(1, 'internal', this.elem)
    delete dataset(this.elem).context
    dataset(this.elem)['internal-context'] = ''
    this.context = context
    logger.debug(1, 'internal context', context)
  }
  // DOM state and position:
  get isLoaded    () { return jSymbols(this.elem).isLoaded            }
  get isConnected () { return this.elem.isConnected                   }
  get isRoot      () { return this.isConnected && this.parent == null } // Works only after setFirstJParent!
  get isDeleted   () { return jSymbols(this.elem).isDeleted           }
  // Custom load callbacks:
  get customPreLoad  ()    { return this.elem[jSymbols.customPreLoad] }
  set customPreLoad  (val) { return this.elem[jSymbols.customPreLoad] = val }
  get customLoad     ()    { return this.elem[jSymbols.customLoad] }
  set customLoad     (val) { return this.elem[jSymbols.customLoad] = val }
  get customPostLoad ()    { return this.elem[jSymbols.customPostLoad] }
  set customPostLoad (val) { return this.elem[jSymbols.customPostLoad] = val }
  // Looping:
  get loopOver ()    { return this.elem[jSymbols.loopOver] }
  set loopOver (val) { this.elem[jSymbols.loopOver] = val  }
  get isLooped ()    { return this.loopOver != null        }
  // Conditional:
  get condition  ()    { return this.elem[jSymbols.condition] }
  set condition  (val) { this.elem[jSymbols.condition] = val  }
  get isDisabled ()    { return !this.condition               }

  // Evaluate the given code in the element's context:
  async evaluate (str) {
    const evaluated = window.evaluator(...this.contexts)(str)
    if (evaluated instanceof Promise)
      return await evaluated
    else
      return evaluated
  }

  // Removal:
  delete () { jSymbols(this.elem).isDeleted = true }
  remove () { this.elem.remove(); this.delete()    }

  // Load JElem or load JElem children if not a JElem:
  loadOrJChildren (context = null) {
    if (this.elem instanceof JElem) {
      logger.debug(1, 'direct load', this.elem)
      this.load(context)
    } else for (const child of this.getFirstJChildren()) {
      logger.debug(1, 'child load', this.elem)
      jWrap(child).load(context)
    }
  }

  // Initial loading stage:
  load () {
    if (!this.elem instanceof JElem) return
    if (this.isDeleted) {
      logger.debug(1, 'deleted', this.elem)
      return
    }

    if (!jSymbols(window).upgrade) { // Wait until all elements upgraded.
      //logger.debug(2, 'defer until upgrade')
      jEvents(window).upgrade = () => { logger.debug(1, 'upgrade load', this.elem); this.load() }
      return
    }

    logger.debug(1, 'load', this.elem)
    this.setFirstJParent()
    logger.debug(1, 'parent', this.parent)
    if (!this.isConnected) {
      logger.debug(1, 'defer until connection')
      
    } else if (this.parent != null && !jWrap(this.parent).isLoaded) { // Wait until parent element loaded.
      logger.debug(1, 'defer until parent load')
      jEvents(this.parent).load = () => { logger.debug(1, 'parent load c.a. load', this.elem); this.contextAwareLoad() }
    } else
      this.contextAwareLoad()
  }

  // Contextual loading stage:
  // Sets contexts.
  // Deals with loops and conditions.
  // Includes customPreLoad.
  async contextAwareLoad () {
    logger.debug(1, 'context aware load', this.elem)
    
    await this.setContexts()

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
    if (this.isLooped) {
      this.loop()
      return
    }

    await this.fullLoad()
  }

  // Final loading stage:
  // Sets attributes and innerText.
  // Includes customLoad and customPostLoad.
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

    this.elem.dispatchEvent(jEvents.load)
    logger.debug(1, 'loaded', this.elem)
  }

  // Load innerText based on context:
  async loadText () {
    if (!(this.elem instanceof JElem)) return
    if (dataset(this.elem).text == null) return
    this.elem.innerText = await this.evaluate(dataset(this.elem).text) || ''
  }

  // Load attributes based on context:
  async loadAttributes () {
    //for (const [attr, val] of Object.entries(allAttributeSetters(this.elem)))
    Object.entries(allAttributeSetters(this.elem)).forEach(async ([attr, val]) =>
      attributes(this.elem)[attr] = await this.evaluate(val) || '')
  }

  // Set first JElem parent:
  // Sets the parent property.
  setFirstJParent () {
    for (let parent = this.elem.parentElement; parent != null; parent = parent.parentElement)
      if (parent instanceof JElem) {
        this.parent = parent
        break
      }
  }

  // Get first JElem children:
  // Doesn't modify 
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

  /*runOnJChildren = f => (...args) => {
    const children = this.elem.children
    if (!empty(children)) for (const child of children) {
      if (child instanceof JElem)
        f(this.elem, ...args)
      jWrap(child).runOnJChildren(f)(...args)
    }
  }
  
  runMethodOnJChildren = f => this.runOnJChildren(f.bind(this.elem))*/

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

  /*setChildContexts = this.runMethodOnJChildren(this.setContexts)
  loadChildren = this.runMethodOnJChildren(this.load)*/

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
    if (!this.isLooped) return

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