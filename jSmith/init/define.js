import { config } from '../config.js'

import {
  tagCtor,
} from '../domtools.js'

import {
  events,
  jEvents
} from '../events.js'

import { jSymbols } from '../symbols.js'

import { JElem } from '../components/jelem.js'

import { Page } from '../components/page.js'

import {
  Tmp,
  Any,
  Wrap
} from '../components/utilities.js'

import {
  Switch
} from '../components/control.js'

const prefixedTag = tag => `${config.prefix}-${tag}`

// Custom elements extending the supported built-in ones:
export const extendedElems = config.supportedTags.reduce((acc, cur) => (acc[cur] = JElem(tagCtor(cur)), acc), {})

window.upgrade = false

// Built-in elements:
/*for (const [tag, ExtendedElem] of Object.entries(extendedElems))
  customElements.define(prefixedTag(tag), ExtendedElem, {extends: tag})*/
Object.entries(extendedElems).forEach(([tag, ExtendedElem]) => {
  customElements.define(prefixedTag(tag), ExtendedElem, {extends: tag})
}) // forEach can be paralelized

// Specific components:
customElements.define('j-page',   Page)
customElements.define('j-tmp',    Tmp)
customElements.define('j-any',    Any)
customElements.define('j-wrap',   Wrap)
customElements.define('j-switch', Switch)

events(document).DOMContentLoaded = async () => {
  // Wait until all elements are upgraded upon the first page load:
  await Promise.all([...document.querySelectorAll(':not(:defined)')].map(e => customElements.whenDefined(e.localName)))
  jSymbols(window).upgrade = true
  window.dispatchEvent(jEvents.upgrade)
  //window.addEventListener('upgrade', () => console.log('yee'))
  //jEvents(window).upgrade = () => console.log('yee')
  //window.dispatchEvent(new Event('upgrade'))
  //console.log('upgrade')
}