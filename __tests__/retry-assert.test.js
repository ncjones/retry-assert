const expect = require('expect')
const retry = require('../retry-assert')

function spy (fn) {
  let invocations = []
  function getCount () {
    return invocations.length
  }
  function counter () {
    invocations.push({
      timestamp: Date.now()
    })
    return fn()
  }
  counter.getCount = getCount
  return counter
}

function incrementer(n=0, fn=x=>x) {
  return () => fn(n++)
}

const originalDefaultRetryDelay = retry.defaultRetryDelay
const originalDefaultTimeout = retry.defaultTimeout

beforeEach(() => {
  retry.defaultRetryDelay = originalDefaultRetryDelay
  retry.defaultTimeout = originalDefaultTimeout
})

describe('until', () => {

  beforeEach(() => {
    retry.defaultRetryDelay = 10
    retry.defaultTimeout = 50
  })

  test('fn invoked until assertion passes', async () => {
    const fn = spy(incrementer())
    const result = await retry(fn)
      .withRetryDelay(10)
      .until(result => expect(result).toEqual(2))
    expect(result).toEqual(2)
    expect(fn.getCount()).toEqual(3)
  })

  test('fn provided via longform', async () => {
    const fn = spy(incrementer())
    const result = await retry()
      .fn(fn)
      .withRetryDelay(10)
      .until(result => expect(result).toEqual(0))
    expect(result).toEqual(0)
    expect(fn.getCount()).toEqual(1)
  })

  test('fn invoked until assertion not throwing exception', async () => {
    const fn = spy(incrementer())
    const result = await retry(fn)
      .withRetryDelay(10)
      .until(result => {
        if (result < 2) {
          throw new Error('too small')
        }
      })
    expect(result).toEqual(2)
    expect(fn.getCount()).toEqual(3)
  })

  test('fn invoked until not throwing exception', async () => {
    const fn = spy(incrementer(0, n => {
      if (n < 2) {
        throw new Error('too small')
      }
      return n
    }))
    const result = await retry(fn)
      .withRetryDelay(10)
      .until(result => expect(result).toEqual(2))
    expect(result).toEqual(2)
    expect(fn.getCount()).toEqual(3)
  })

  test('fn invoked once if assertion passes', async () => {
    const fn = spy(() => 1)
    const result = await retry(fn)
      .until(result => expect(result).toEqual(1))
    expect(result).toEqual(1)
    expect(fn.getCount()).toEqual(1)
  })

  test('fn may return promise', async () => {
    const fn = spy(() => Promise.resolve(1))
    const result = await retry(fn)
      .until(result => expect(result).toEqual(1))
    expect(result).toEqual(1)
    expect(fn.getCount()).toEqual(1)
  })

  test('exception thrown when assertion never passes', async () => {
    const fn = () => 0
    try {
      await retry(fn)
        .withRetryDelay(1)
        .withTimeout(1)
        .until(result => expect(result).toEqual(1))
      expect.fail('expected promise rejection')
    } catch (e) {
      expect(e.message).toContain('Expected value to equal:')
    }
  })

  test('exception thrown function returns rejected promise', async () => {
    const fn = () => Promise.reject('fn failed')
    try {
      await retry(fn)
        .withRetryDelay(1)
        .withTimeout(1)
        .until(result => expect(1).toEqual(1))
      expect.fail('expected promise rejection')
    } catch (e) {
      console.log(e)
      expect(e).toContain('fn failed')
    }
  })

})

describe('untilTruthy', () => {

  beforeEach(() => {
    retry.defaultRetryDelay = 10
    retry.defaultTimeout = 50
  })

  test('fn invoked until predicate matches', async () => {
    const fn = spy(incrementer())
    const result = await retry(fn)
      .withRetryDelay(10)
      .untilTruthy(n => n === 3)
    expect(result).toEqual(3)
    expect(fn.getCount()).toEqual(4)
  })

  test('fn invoked until truthy', async () => {
    const fn = spy(incrementer())
    const result = await retry(fn)
      .withRetryDelay(10)
      .untilTruthy()
    expect(result).toEqual(1)
    expect(fn.getCount()).toEqual(2)
  })

  test('fn invoked once if truthy', async () => {
    const fn = spy(() => 'truthy')
    const result = await retry(fn)
      .untilTruthy()
    expect(result).toEqual('truthy')
    expect(fn.getCount()).toEqual(1)
  })

  test('exception thrown when never truthy', async () => {
    const fn = () => 0
    try {
      await retry(fn)
        .withRetryDelay(1)
        .withTimeout(1)
        .untilTruthy()
      expect.fail('expected promise rejection')
    } catch (e) {
      expect(e.message).toEqual('predicate did not match')
    }
  })

  test('exception thrown when predicate throws', async () => {
    const fn = spy(() => 0)
    try {
      await retry(fn)
        .withRetryDelay(1)
        .withTimeout(1)
        .untilTruthy(x => { throw new Error('predicate failed') })
      expect.fail('expected promise rejection')
    } catch (e) {
      expect(e.message).toEqual('predicate failed')
      expect(fn.getCount()).toEqual(2)
    }
  })

})

describe('ensure', () => {

  beforeEach(() => {
    retry.defaultRetryDelay = 10
    retry.defaultTimeout = 50
  })

  test('fn invoked max times if assertion passes', async () => {
    const fn = spy(() => 1)
    const result = await retry(fn)
      .withRetryDelay(10)
      .withTimeout(50)
      .ensure(result => expect(result).toEqual(1))
    expect(result).toEqual(1)
    expect(fn.getCount()).toEqual(6)
  })

  test('fn may return promise', async () => {
    const fn = spy(() => Promise.resolve(1))
    const result = await retry(fn)
      .withRetryDelay(10)
      .withTimeout(20)
      .ensure(result => expect(result).toEqual(1))
    expect(result).toEqual(1)
    expect(fn.getCount()).toEqual(3)
  })

  test('exception thrown if assertion fails', async () => {
    const fn = spy(() => '')
    try {
      await retry(fn)
        .ensure(result => expect(result).toEqual('x'))
      expect.fail('expected promise rejection')
    } catch(e) {
      expect(e.message).toContain('Expected value to equal:')
      expect(fn.getCount()).toEqual(1)
    }
  })

  test('exception thrown if fn returns rejected promise', async () => {
    const fn = spy(() => Promise.reject('fn failed'))
    try {
      await retry(fn)
        .ensure(result => expect(result).toEqual('x'))
      expect.fail('expected promise rejection')
    } catch(e) {
      expect(e).toContain('fn failed')
      expect(fn.getCount()).toEqual(1)
    }
  })

  test('fn invoked while assertion passes', async () => {
    const fn = spy(incrementer())
    try {
      await retry(fn)
        .withRetryDelay(10)
        .withTimeout(50)
        .ensure(result => expect(result).toBeLessThan(2))
      expect.fail('expected promise rejection')
    } catch (e) {
      expect(fn.getCount()).toEqual(3)
    }
  })

})

describe('ensureTruthy', () => {

  beforeEach(() => {
    retry.defaultRetryDelay = 10
    retry.defaultTimeout = 50
  })

  test('fn invoked max times if truthy', async () => {
    const fn = spy(() => 'truthy')
    const result = await retry(fn)
      .withRetryDelay(10)
      .withTimeout(50)
      .ensureTruthy()
    expect(result).toEqual('truthy')
    expect(fn.getCount()).toEqual(6)
  })

  test('fn invoked once if falsey', async () => {
    const fn = spy(() => '')
    try {
      await retry(fn)
        .ensureTruthy()
      expect.fail('expected promise rejection')
    } catch(e) {
      expect(e.message).toEqual('predicate did not match')
      expect(fn.getCount()).toEqual(1)
    }
  })

  test('fn invoked once if predicate throws', async () => {
    const fn = spy(() => 0)
    try {
      await retry(fn)
        .withRetryDelay(1)
        .withTimeout(1)
        .ensureTruthy(x => { throw new Error('predicate failed') })
      expect.fail('expected promise rejection')
    } catch (e) {
      expect(e.message).toEqual('predicate failed')
      expect(fn.getCount()).toEqual(1)
    }
  })

  test('fn invoked while predicate truthy', async () => {
    const fn = spy(incrementer())
    try {
      await retry(fn)
        .withRetryDelay(10)
        .withTimeout(50)
        .ensureTruthy(result => result < 2)
      expect.fail('expected promise rejection')
    } catch (e) {
      expect(fn.getCount()).toEqual(3)
    }
  })

})

describe('validation', () => {

  test('retry function required', async () => {
    try {
      await retry()
        .untilTruthy()
      expect.fail('expected promise rejection')
    } catch (e) {
      expect(e.message).toEqual('retry function undefined or not a function')
    }
  })

})

describe('defaults', () => {

  test('timeout', async () => {
    expect(retry()._timeout).toEqual(1000)
  })

  test('retryDelay', async () => {
    expect(retry()._delay).toEqual(200)
  })

})
