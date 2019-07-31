import { config } from '../config.js'

import { logger } from '../logger.js'

import {
  dataset,
  attributes,
  allAtributes
} from '../domtools.js'

import {
  JElem,
  jWrap
} from './jelem.js'

import { jSymbols } from '../symbols.js'

export class Tmp extends JElem(HTMLElement) {
  constructor () {
    super()
  }

  async [jSymbols.customLoad] () {
    if (this.parentNode == null) return true

    logger.debug(1, 'custom load', this)

    while (this.firstChild != null) {
      //jWrap(this.firstChild).internalContext = jWrap(this).context
      jWrap(this.firstChild).internalContext = Object.assign(jWrap(this.firstChild).context, jWrap(this).context)
      const inserted = this.parentNode.insertBefore(this.firstChild, this)
      logger.debug(1, 'tmp context', jWrap(inserted).context)
    }
    jWrap(this).remove()
    return false
  }
}

export class Any extends JElem(HTMLElement) {
  [jSymbols.tagCast] = null

  constructor () {
    super()
  }

  async [jSymbols.customPreLoad] () {
    await this._setTagCast()
    if (jSymbols(this).tagCast != null)
      this._cast()
    return true
  }

  async _setTagCast (tagCast = null) {
    if (this.parentElement == null) {
      jSymbols(this).tagCast = null
      return
    }

    if (tagCast != null)
      jSymbols(this).tagCast = tagCast
    else if (dataset(this).cast != null) {
      jSymbols(this).tagCast = await jWrap(this).evaluate(dataset(this).cast)
    }
  }

  _cast () {
    if (jSymbols(this).tagCast == null) return

    const clone = document.createElement(jSymbols(this).tagCast, {is: `${config.prefix}-${jSymbols(this).tagCast}`})
    for (const [attr, val] of Object.entries(allAtributes(this)))
      attributes(clone)[attr] = val
    for (const child of this.childNodes)
      clone.appendChild(child)
    jWrap(clone).internalContext = jWrap(this).context

    this.replaceWith(clone)
  }
}

export class Wrap extends JElem(HTMLElement) {
  constructor () {
    super()
  }
}

/*

Current state:

<img is="j-img"> loads two times. once correctly and is disabled, once incorrectly with no parent and stays enabled.
<j-any> loads two times. same story here. in addition, the casted <h2> doesn't get the contexts and is disabled incorrectly.

*/