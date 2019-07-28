/* Random text generator. Based on the Crehivae conlang. */

const roots = [
  'u',
  'i',
  't',
  'l',
  'eg',
  'ec',
  'ul',
  'ill',
  'egr',
  'ecr',
  'egc',
  'ecg',
  'igc',
  'icg',
  'grhe',
  'crhe',
  'cio',
  'cie',
  'edt',
  'etd'
]

const post = [
  '',
  'u',
  'o',
  'a',
  'i',
  'he',
  'hi',
  'hy',
  'me',
  'mn',
  'tull'
]

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min)
const randElem = arr => arr[rand(0, arr.length - 1)]
const repeatDelim = delim => n => f => (n == 0) ? '' : (n == 1) ? f() : f() + delim + repeatDelim(delim)(n - 1)(f)
const repeat = repeatDelim('')
const capitalize = str => str[0].toUpperCase() + str.slice(1)

export const word = n => repeat(rand(1, n))(() => randElem(roots)) + randElem(post)
export const sentence = m => n => capitalize(word(n)) + ' ' + repeatDelim(' ')(m)(() => word(n)) + '.'
export const paragraph = q => m => n => repeatDelim(' ')(q)(() => sentence(m)(n))
export const text = p => q => m => n => repeatDelim('\n\n')(p)(() => paragraph(q)(m)(n))

export const myText = () => text(4)(10)(8)(4)