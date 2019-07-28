import { symbols } from '../tools.js'

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

export class Tmp extends JElem(HTMLElement) {
  constructor () {
    super()
  }

  async [Symbol.for('customLoad')] () {
    if (this.parentNode == null) return true

    logger.debug(1, 'custom load', this)

    while (this.firstChild != null) {
      jWrap(this.firstChild).internalContext = jWrap(this).context
      const inserted = this.parentNode.insertBefore(this.firstChild, this)
      logger.debug(1, 'tmp context', jWrap(inserted).context)
    }
    jWrap(this).remove()
    return false
  }
}

export class Any extends JElem(HTMLElement) {
  [Symbol.for('tagCast')] = null;

  constructor () {
    super()
  }

  async [Symbol.for('customPreLoad')] () {
    await this._setTagCast()
    if (symbols(this).tagCast != null)
      this._cast()
    return true
  }

  async _setTagCast (tagCast = null) {
    if (this.parentElement == null) {
      symbols(this).tagCast = null
      return
    }

    if (tagCast != null)
      symbols(this).tagCast = tagCast
    else if (dataset(this).cast != null) {
      symbols(this).tagCast = await jWrap(this).evaluate(dataset(this).cast)
    }
  }

  _cast () {
    if (symbols(this).tagCast == null) return

    const clone = document.createElement(symbols(this).tagCast, {is: `${config.prefix}-${symbols(this).tagCast}`})
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