Retry Assert
============

[![Build Status](https://travis-ci.org/ncjones/retry-assert.svg?branch=master)](https://travis-ci.org/ncjones/retry-assert)

Retry a function, either until or while an assertion passes, seamlessly
integrating with Promise-aware test runners such as Mocha, Jest and Cucumber
JS, producing better failure messages than other similar libraries. Inspired by
[RSpec-Wait][] and [TryTryAgain][].


Installation
------------

    npm install retry-assert


Usage
-----

**Retry until**: retry a function until it's returned value passes an
assertion:

```javascript
const retry = require('retry-assert')
const expect = require('expect')

async function getUser (id) {
  console.log('get user')
  return { id, active: Date.now() % 10 === 0 }
}

(async function () {
  // call the asynchronous "getUser" method until user is active:
  const activeUser = await retry()
    .fn(() => getUser(1))
    .until(user => expect(user).toHaveProperty('active', true))
  console.log(activeUser)
})()
```


**Retry ensure**: retry a function until timeout, failing immediately when an
assertion fails:

```javascript
const retry = require('retry-assert')
const expect = require('expect')

async function getUser (id) {
  console.log('get user')
  return { id, active: Date.now() % 10 === 0 }
}

(async function () {
  // call the asynchronous "getUser" function repeatedly for 2 seconds,
  // ensuring user is not active:
  const inactiveUser = await retry()
    .fn(() => getUser(2))
    .withTimeout(2000)
    .ensure(user => expect(user).toHaveProperty('active', false))
  console.log(inactiveUser)
})()
```

Motivation
----------

Testing asynchronous state changes requires waiting for the state change to
occur. Waiting a fixed amount of time (using `setTimeout` or equivalent) makes
the test suite slow and fails to communicate the reason for waiting. UI test
frameworks often have retry capabilities built in but when testing outside of
the browser some other utility is required to reliably wait for asynchronous
state changes.


Features
--------

There are many libraries that already solve this problem. This one is unique
because it offers all of the following features:

 * **Async** - Retried function can be async.
 * **Config** - Configurable retry timeout.
 * **Fluent** - Retry behavior is configured with fluent builder syntax.
 * **Yields** - Result of retried function is yielded when predicate passes.
 * **Assert** - Retry condition/assertion defined independently of retried function.
 * **Ensure** - Supports negative test cases (ensuring no state change).

As of the time of writing, the following table describes the feature sets of
similar retry libraries:

| Library                | Async | Config | Yields | Fluent | Assert | Ensure | Notes / Syntax                       |
| ---------------------- | ----- | ------ | ------ | ------ | ------ | ------ | ------------------------------------ |
| [Retry-Assert](./)     | Yes   | Yes    | Yes    | Yes    | Yes    | Yes    | `retry(fn).until(() => assertion)`         |
| [RSpec-Wait][]         |       | Yes    | Yes    | Yes    | Yes    |        | Ruby                                 |
| [TryTryAgain][]        | Yes   | Yes    | Yes    |        |        | Yes    | `retry(fn, options)`                 |
| [Async-Wait-Until][]   | Yes   | Yes    | Yes    |        |        |        | `waitUntil(fn, timeout, delay)`      |
| [Retry-As-Promised][]  | Yes   | Yes    | Yes    |        |        |        | `retry(fn, options)`                 |
| [Wait-Until][]         |       | Yes    | Yes    | Yes    |        |        | `waitUntil().times(5).condition(fn)` |
| [Wait-Until-Promise][] |       | Yes    | Yes    |        |        |        | `waitUntil(fn, timeout, delay)`      |
| [P-Wait-For][]         | Yes   | Yes    |        |        |        |        | `pWaitFor(condition, options)`       |
| [Mocha-Retry][]        | Yes   | Yes    |        |        |        |        | Retries entire test                  |
| [Wait-For-Stuff][]     | Yes   |        |        |        |        |        | `wait.for.predicate(fn)`             |


API
---

### Module

The retry-assert module exports a single function. The following describes its usage
assuming it is imported as "retry".

#### retry()

Create a new RetryBuilder.

Returns: RetryBuilder

#### retry(fn)

Shorthand for `retry().fn(fn)`.

Retuns: RetryBuilder

#### retry.defaultRetryDelay

Default RetryBuilder retry delay milliseconds (default 200). Modifying only
affects future RetryBuilder instances.

#### retry.defaultTimeout

Default RetryBuilder timeout milliseconds (default 1000). Modifying only
affects future RetryBuilder instances.

### RetryBuilder

A RetryBuilder allows chaining of the retry configuration. It should have
any number of "chainable" configuration methods called followed by a single
"terminal" method invocation. The terminal methods all return a promise
resolving the latest return value of the retried function.

#### .fn(fn)

*chainable*

Set the function to be retried. The given function may return a Promise. The
result of the final invocation of the given function will be resolved by the
promise returned by this builder's terminal operation.

Returns: RetryBuilder

Example:

    retry()
      .fn(() => httpClient.get('/deleted-resource'))
      .until(response => expect(response).toHaveProperty('status', 404))

#### .until(fn)

*terminal*

Set the assertion function to apply to the result of each invocation of the
retried function and begin retrying until the assertion passes or the timeout
is reached.

Any assertion library can be used as long as a failed assertion throws an
exception.

Retuns: Promise

The returned Promise will resolve the last result of the retried function. If
retrying timed out then the Promise will be rejected.

Example:

    retry(() => client.getUser(id))
      .until(user => expect(user).toHaveProperty('active', true))

#### .ensure(fn)

*terminal*

Set the assertion function to apply to the result of each invocation of the
retried function and begin retrying until the timeout is reached or until
assertion fails.

Any assertion library can be used as long as a failed assertion throws an
exception.

Retuns: Promise

The returned Promise will resolve the last result of the retried function. If
an assertion failed then the Promise will be rejected.

Example:

    retry(() => client.getUser(id))
      .ensure(user => expect(user).toHaveProperty('active', false))

#### .untilTruthy()

*terminal*

Shorthand for `.untilTruthy(x => x)`.

Retuns: Promise

#### .untilTruthy(fn)

*terminal*

Set the predicate function to apply to the result of each invocation of the
retried function and begin retrying until the predicate is truthy or the
timeout is reached.

Retuns: Promise

The returned Promise will resolve the last result of the retried function. If
retrying timed out then the Promise will be rejected.

Example:

    retry(() => client.getUser(id))
      .untilTruthy(user => user.active)

#### .ensureTruthy()

*terminal*

Shorthand for `.ensureTruthy(x => x)`.

Retuns: Promise

#### .ensureTruthy(fn)

*terminal*

Set the predicate function to apply to the result of each invocation of the
retried function and begin retrying until the timeout is reached or until
the predicate is falsy.

Retuns: Promise

The returned Promise will resolve the last result of the retried function. If
a predicate was falsy then the Promise will be rejected.

Example:

    retry(() => client.getUser(id))
      .ensureTruthy(user => user.active)


#### .withRetryDelay(n)

*chainable*

Set the number of milliseconds between retries (default 200).

Returns: RetryBuilder


#### .withTimeout(n)

*chainable*

Set the number of milliseconds before timing out (default 1000).

This value is use to determine when to stop retrying; it is not used to timeout
individual invocations of the retried function. The retried function needs to
be responsible for timing out long running operations such as via http client
configuration etc.

The amount of time passed before timing out is only guaranteed to be *at least*
this long. This value is used to approximate the number of retries up-front
without considering the length of time each retry takes. If retries are
long-running then the time until timeout occurs may be significantly longer
than this value.

Returns: RetryBuilder


Legal
-----

Copyright 2018 Practiv Ltd. Licensed under the Apache License, Version 2.0.


[Mocha-Retry]: https://www.npmjs.com/package/mocha-retry
[Async-Wait-Until]: https://www.npmjs.com/package/async-wait-until
[Wait-For-Stuff]: https://www.npmjs.com/package/wait-for-stuff
[P-Wait-For]: https://www.npmjs.com/package/p-wait-for
[Retry-As-Promised]: https://www.npmjs.com/package/retry-as-promised
[TryTryAgain]: https://www.npmjs.com/package/trytryagain
[Wait-Until-Promise]: https://www.npmjs.com/package/wait-until-promise
[Wait-Until]: https://www.npmjs.com/package/wait-until
[RSpec-Wait]: https://github.com/laserlemon/rspec-wait
