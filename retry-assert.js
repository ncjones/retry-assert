/**
 * Retry Assert
 *
 * Copyright 2018 Practiv Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const identity = x => x

function invoke (fn) {
  try {
    return Promise.resolve(fn())
  } catch (e) {
    return Promise.reject(e)
  }
}

function _until (fn, assertion, retries, retryDelay, resolve, reject) {
  invoke(fn)
    .then(obj => {
      assertion(obj)
      resolve(obj)
    })
    .catch(e => {
      if(retries === 0) {
        reject(e)
      } else {
        setTimeout(_until, retryDelay, fn, assertion, retries - 1, retryDelay, resolve, reject)
      }
    })
}

function _ensure (fn, assertion, retries, retryDelay, resolve, reject) {
  invoke(fn)
    .then(obj => {
      assertion(obj)
      if(retries === 0) {
        resolve(obj)
      } else {
        setTimeout(_ensure, retryDelay, fn, assertion, retries - 1, retryDelay, resolve, reject)
      }
    })
    .catch(reject)
}

function doRetry (builder) {
  if (typeof builder._fn !== 'function') {
    throw new Error('retry function undefined or not a function')
  }
  if (typeof builder._assertion !== 'function') {
    throw new Error('assertion function undefined or not a function')
  }
  const retries = Math.ceil(builder._timeout / builder._delay)
  return new Promise(function(resolve, reject) {
    builder._retry(builder._fn, builder._assertion, retries, builder._delay, resolve, reject)
  })
}

function toAssertion (predicate) {
  if (typeof predicate !== 'function') {
    throw new Error('predicate function undefined or not a function')
  }
  function predicateAssertion (obj) {
    if (!predicate(obj)) {
      throw new Error('predicate did not match')
    }
  }
  return predicateAssertion
}

function retry (fn) {
  return new RetryBuilder().fn(fn)
}

retry.defaultTimeout = 1000

retry.defaultRetryDelay = 200

class RetryBuilder {
  constructor () {
    this._timeout = retry.defaultTimeout
    this._delay = retry.defaultRetryDelay
  }

  withTimeout (timeout) {
    this._timeout = timeout
    return this
  }

  withRetryDelay (delay) {
    this._delay = delay
    return this
  }

  fn (fn) {
    this._fn = fn
    return this
  }

  until (assertion) {
    this._assertion = assertion
    this._retry = _until
    return doRetry(this)
  }

  untilTruthy (predicate=identity) {
    return this.until(toAssertion(predicate))
  }

  ensure (assertion) {
    this._assertion = assertion
    this._retry = _ensure
    return doRetry(this)
  }

  ensureTruthy (predicate=identity) {
    return this.ensure(toAssertion(predicate))
  }

}

module.exports = retry
