/**
 * Retry Assert
 *
 * Copyright 2023 Nathan Jones
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

/**
  * Create a new RetryBuilder.
  *
  * Example - waiting until a state change occurs:
  *
  *      retry()
  *        .fn(() => httpClient.get('/deleted-resource'))
  *        .until(response => expect(response).toHaveProperty('status', 404))
  *
  * Example - ensuring a state change never occurs:
  *
  *      retry()
  *        .fn(() => httpClient.get('/deleted-resource'))
  *        .ensure(response => expect(response).toHaveProperty('status', 404))
  */
declare function retry<T>(fn?: () => T): RetryBuilder<T>;

declare namespace retry {

  /**
   * Default RetryBuilder retry delay milliseconds (default 200). Modifying only
   * affects future RetryBuilder instances.
   */
  export var defaultTimeout: number;

  /**
   * Default RetryBuilder timeout milliseconds (default 1000). Modifying only
   * affects future RetryBuilder instances.
   */
  export var defaultRetryDelay: number;
}

/**
 * A RetryBuilder allows chaining of the retry configuration. It should have
 * any number of "chainable" configuration methods called followed by a single
 * "terminal" method invocation. The terminal methods all return a promise
 * resolving the latest return value of the retried function.
 */
interface RetryBuilder<T> {

  /**
   * Set the number of milliseconds before timing out (default 1000).
   *
   * This value is use to determine when to stop retrying; it is not used to timeout
   * individual invocations of the retried function. The retried function needs to
   * be responsible for timing out long running operations such as via http client
   * configuration etc.
   *
   * The amount of time passed before timing out is only guaranteed to be *at least*
   * this long. This value is used to approximate the number of retries up-front
   * without considering the length of time each retry takes. If retries are
   * long-running then the time until timeout occurs may be significantly longer
   * than this value.
   */
  withTimeout (timeout: number): RetryBuilder<T>;

  /**
   * Set the number of milliseconds between retries (default 200).
   */
  withRetryDelay (delay: number): RetryBuilder<T>;

  /**
   * Set the function to be retried. The given function may return a Promise. The
   * result of the final invocation of the given function will be resolved by the
   * promise returned by this builder's terminal operation.
   */
  fn<U>(fn: () => U): RetryBuilder<U>;

  /**
   * Set the assertion function to apply to the result of each invocation of the
   * retried function and begin retrying until the assertion passes or the timeout
   * is reached.
   *
   * Example:
   *
   *     retry(() => client.getUser(id))
   *       .until(user => expect(user).toHaveProperty('active', true))
   *
   * Any assertion library can be used as long as a failed assertion throws an
   * exception.
   *
   * The returned Promise will resolve the last result of the retried function. If
   * retrying timed out then the Promise will be rejected.
   *
   */
  until (assertion: (t: T) => void): Promise<T>;

  /**
   * Set the predicate function to apply to the result of each invocation of the
   * retried function and begin retrying until the predicate is truthy or the
   * timeout is reached. The predicate defaults to identity (x=>x).
   *
   * Example:
   *
   *     retry(() => client.getUser(id))
   *       .untilTruthy(user => user.active)
   *
   * The returned Promise will resolve the last result of the retried function. If
   * retrying timed out then the Promise will be rejected.
   */
  untilTruthy (predicate?: (t: T) => any): Promise<T>;

  /**
   * Set the assertion function to apply to the result of each invocation of the
   * retried function and begin retrying until the timeout is reached or until
   * assertion fails.
   *
   * Example:
   *
   *     retry(() => client.getUser(id))
   *       .ensure(user => expect(user).toHaveProperty('active', false))
   *
   * Any assertion library can be used as long as a failed assertion throws an
   * exception.
   *
   * The returned Promise will resolve the last result of the retried function. If
   * an assertion failed then the Promise will be rejected.
   */
  ensure (assertion: (t: T) => void): Promise<T>;

  /**
   * Set the predicate function to apply to the result of each invocation of the
   * retried function and begin retrying until the timeout is reached or until
   * the predicate is falsy. The predicate defaults to identity (x=>x).
   *
   * Example:
   *
   *     retry(() => client.getUser(id))
   *       .ensureTruthy(user => user.active)
   *
   * The returned Promise will resolve the last result of the retried function. If
   * a predicate was falsy then the Promise will be rejected.
   *
   */
  ensureTruthy (predicate?: (t: T) => any): Promise<T>;
}

declare module 'retry-assert';

export default retry;
