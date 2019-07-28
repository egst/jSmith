import {
  events,
  observeMutations
} from '../domtools.js'

import { jWrap } from '../components/jelem.js'

/*events(document).DOMContentLoaded = () => {
  observeMutations(document.body, {
    childList (mutation) {
      for (const child of mutation.addedNodes)
        jWrap(child).load()
    }
  }, 'subtree')
}*/