import {
  zip,
  wait
} from './tools.js'

import {
  word,
  sentence,
  paragraph,
  text
} from './iaerhy.js'

// for the iaerhy generator:
const maxRoots = 4
const h = () => sentence(4)(maxRoots)
const p = () => paragraph(10)(6)(maxRoots)

// Async data example:
// This function simply waits for 500ms, but it demonstrates,
// how data could be fetched from some server-side API and used in jSmith.
async function fetchArticles() {
  await wait(500, 'ms')
  return [
    {
      title: h(),
      thumbnail: 'http://placekitten.com/100/100',
      content: [
        ['h3', h()], // [['tag', 'h'], ['val', 'Elhe']] ... {tag: 'h3', val: 'Elhe'}
        ['p', p()],
        ['p', p()],
        ['h3', h()],
        ['p', p()],
        ['img', 'http://placekitten.com/50/50']
      ]
    },
    {
      title: h(),
      thumbnail: 'http://placekitten.com/150/100',
      content: [
        ['h3', h()],
        ['p', p()],
        ['p', p()]
      ]
    }
  ]
}

// Example data:
window.pageData = {
  color: '#faee32',
  title: 'jSmith test',
  pages: {
    home: {},
    newsfeed: {
      articles: fetchArticles()
    }
  },
  fn: {
    labelKeyval: (obj, k, v) => Object.entries(obj).map(([key, val]) => ({ [k]: key, [v]: val })),
    labelList: (arr, ...labels) => arr.map(list => [...zip(labels, list)].reduce((acc, [label, item]) => (acc[label] = item, acc), {}))
  }
}