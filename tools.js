export const zipWith = f => function* (...iters) {
  for (let i = 0; i < iters.length; ++i)
    if (Array.isArray(iters[i]))
      iters[i] = iters[i][Symbol.iterator]()
    else if (iters[i].length != null)
      iters[i] = Object.values(iters[i])[Symbol.iterator]()
  for (let results = iters.map(it => it.next()); !results.map(it => it.done).includes(true); results = iters.map(it => it.next()))
    yield f(...results.map(it => it.value))
}
export const zip = zipWith((...args) => args)

export function wait(time, units = 'ms') {
  if (units == 's')
    time = time * 1000
  return new Promise(resolve => { setTimeout(() => { resolve() }, time) })
}