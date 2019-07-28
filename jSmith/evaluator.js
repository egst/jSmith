// This can't be in strict mode.

// Evaluate string in the given contexts, that possibly shadow each other:
window.evaluator = (...contexts) => str => {
  try {
    // TODO: Maybe a more efficient way to do this without copying the whole objects around?
    with (contexts.reduce((acc, cur) => Object.assign(acc, cur), {}))
      return eval(str) // TODO: Check for allowed subset (prohibit assignment etc.)
  } catch (e) {
    return null
  }
}