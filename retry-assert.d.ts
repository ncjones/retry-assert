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

declare function retry<T>(fn?: () => T): RetryBuilder<T>;

declare namespace retry {
  export var defaultTimeout: number;
  export var defaultRetryDelay: number;
}

export default retry;

interface RetryBuilder<T> {
  withTimeout (timeout: number): RetryBuilder<T>;
  withRetryDelay (delay: number): RetryBuilder<T>;
  fn<U>(fn: () => U): RetryBuilder<U>;
  until (assertion: (t: T) => void): Promise<T>;
  untilTruthy (predicate?: (t: T) => any): Promise<T>;
  ensure (assertion: (t: T) => void): Promise<T>;
  ensureTruthy (predicate?: (t: T) => any): Promise<T>;
}

declare module 'retry-assert';

