import { dataset } from '../domtools.js'

import { logger } from '../logger.js'

import {
  JElem,
  jWrap
} from './jelem.js'

export class Switch extends JElem(HTMLElement) {
  constructor () {
    super()
  }

  async [Symbol.for('customLoad')] () {
    if (this.parentNode == null) return true

    logger.debug(1, 'custom load', this)

    //while (this.firstChild != null) {
    for (const child of this.children) {
      const childWrap = jWrap(child)
      childWrap.setFirstJParent()
      await childWrap.setContexts()
      if (dataset(child)['default-case'] != null || await childWrap.evaluate(dataset(child).case) == true) {
        childWrap.internalContext = jWrap(this).context
        this.parentNode.insertBefore(child, this)
        break
      }
    }
    jWrap(this).remove()
    return false
  }
}