// Generated by typings
// Source: https://raw.githubusercontent.com/typed-typings/npm-es6-promise/fb04188767acfec1defd054fc8024fafa5cd4de7/dist/es6-promise.d.ts
declare module '~pg~pg-pool~es6-promise' {
export interface Thenable <R> {
  then <U> (onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => U | Thenable<U>): Thenable<U>;
  then <U> (onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => void): Thenable<U>;
}

export class Promise <R> implements Thenable <R> {
  /**
   * If you call resolve in the body of the callback passed to the constructor,
   * your promise is fulfilled with result object passed to resolve.
   * If you call reject your promise is rejected with the object passed to resolve.
   * For consistency and debugging (eg stack traces), obj should be an instanceof Error.
   * Any errors thrown in the constructor callback will be implicitly passed to reject().
   */
  constructor (callback: (resolve : (value?: R | Thenable<R>) => void, reject: (error?: any) => void) => void);

  /**
   * onFulfilled is called when/if "promise" resolves. onRejected is called when/if "promise" rejects.
   * Both are optional, if either/both are omitted the next onFulfilled/onRejected in the chain is called.
   * Both callbacks have a single parameter , the fulfillment value or rejection reason.
   * "then" returns a new promise equivalent to the value you return from onFulfilled/onRejected after being passed through Promise.resolve.
   * If an error is thrown in the callback, the returned promise rejects with that error.
   *
   * @param onFulfilled called when/if "promise" resolves
   * @param onRejected called when/if "promise" rejects
   */
  then <U> (onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => U | Thenable<U>): Promise<U>;
  then <U> (onFulfilled?: (value: R) => U | Thenable<U>, onRejected?: (error: any) => void): Promise<U>;

  /**
   * Sugar for promise.then(undefined, onRejected)
   *
   * @param onRejected called when/if "promise" rejects
   */
  catch <U> (onRejected?: (error: any) => U | Thenable<U>): Promise<U>;

  /**
   * Make a new promise from the thenable.
   * A thenable is promise-like in as far as it has a "then" method.
   */
  static resolve (): Promise<void>;
  static resolve <R> (value: R | Thenable<R>): Promise<R>;

  /**
   * Make a promise that rejects to obj. For consistency and debugging (eg stack traces), obj should be an instanceof Error
   */
  static reject <R> (error: any): Promise<R>;

  /**
   * Make a promise that fulfills when every item in the array fulfills, and rejects if (and when) any item rejects.
   * the array passed to all can be a mixture of promise-like objects and other objects.
   * The fulfillment value is an array (in order) of fulfillment values. The rejection value is the first rejection value.
   */
  static all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(values: [T1 | Thenable<T1>, T2 | Thenable<T2>, T3 | Thenable<T3>, T4 | Thenable <T4>, T5 | Thenable<T5>, T6 | Thenable<T6>, T7 | Thenable<T7>, T8 | Thenable<T8>, T9 | Thenable<T9>, T10 | Thenable<T10>]): Promise<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;
  static all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(values: [T1 | Thenable<T1>, T2 | Thenable<T2>, T3 | Thenable<T3>, T4 | Thenable <T4>, T5 | Thenable<T5>, T6 | Thenable<T6>, T7 | Thenable<T7>, T8 | Thenable<T8>, T9 | Thenable<T9>]): Promise<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;
  static all<T1, T2, T3, T4, T5, T6, T7, T8>(values: [T1 | Thenable<T1>, T2 | Thenable<T2>, T3 | Thenable<T3>, T4 | Thenable <T4>, T5 | Thenable<T5>, T6 | Thenable<T6>, T7 | Thenable<T7>, T8 | Thenable<T8>]): Promise<[T1, T2, T3, T4, T5, T6, T7, T8]>;
  static all<T1, T2, T3, T4, T5, T6, T7>(values: [T1 | Thenable<T1>, T2 | Thenable<T2>, T3 | Thenable<T3>, T4 | Thenable <T4>, T5 | Thenable<T5>, T6 | Thenable<T6>, T7 | Thenable<T7>]): Promise<[T1, T2, T3, T4, T5, T6, T7]>;
  static all<T1, T2, T3, T4, T5, T6>(values: [T1 | Thenable<T1>, T2 | Thenable<T2>, T3 | Thenable<T3>, T4 | Thenable <T4>, T5 | Thenable<T5>, T6 | Thenable<T6>]): Promise<[T1, T2, T3, T4, T5, T6]>;
  static all<T1, T2, T3, T4, T5>(values: [T1 | Thenable<T1>, T2 | Thenable<T2>, T3 | Thenable<T3>, T4 | Thenable <T4>, T5 | Thenable<T5>]): Promise<[T1, T2, T3, T4, T5]>;
  static all<T1, T2, T3, T4>(values: [T1 | Thenable<T1>, T2 | Thenable<T2>, T3 | Thenable<T3>, T4 | Thenable <T4>]): Promise<[T1, T2, T3, T4]>;
  static all<T1, T2, T3>(values: [T1 | Thenable<T1>, T2 | Thenable<T2>, T3 | Thenable<T3>]): Promise<[T1, T2, T3]>;
  static all<T1, T2>(values: [T1 | Thenable<T1>, T2 | Thenable<T2>]): Promise<[T1, T2]>;
  static all<T1>(values: [T1 | Thenable<T1>]): Promise<[T1]>;
  static all<TAll>(values: Array<TAll | Thenable<TAll>>): Promise<TAll[]>;

  /**
   * Make a Promise that fulfills when any item fulfills, and rejects if any item rejects.
   */
  static race <R> (promises: (R | Thenable<R>)[]): Promise<R>;
}

/**
 * The polyfill method will patch the global environment (in this case to the Promise name) when called.
 */
export function polyfill (): void;
}

// Generated by typings
// Source: https://raw.githubusercontent.com/types/npm-pg-pool/8b9c7eeea62ffaad8419ec9f4e12e11f9c443756/index.d.ts
declare module '~pg~pg-pool' {
import { EventEmitter } from 'events';
import { Promise } from '~pg~pg-pool~es6-promise';
import * as pg from 'pg';

class Pool extends EventEmitter {
  constructor(options: Pool.PoolOptions, Client?: pg.ClientConstructor);
  connect(cb?: pg.ConnectCallback): Promise<pg.Client>;
  take(cb?: pg.ConnectCallback): Promise<pg.Client>;
  query(query: pg.QueryConfig, callback?: pg.QueryCallback): Promise<pg.ResultSet>;
  query(text: string, callback?: pg.QueryCallback): Promise<pg.ResultSet>;
  query(text: string, values: any[], callback?: pg.QueryCallback): Promise<pg.ResultSet>;
  end(cb: pg.DoneCallback): Promise<void>;

  on(event: "connect", listener: (client: pg.Client) => void): this;
  on(event: "acquire", listener: (client: pg.Client) => void): this;
  on(event: "error", listener: (err: Error) => void): this;
  on(event: string, listener: Function): this;
}

namespace Pool {

  export interface PoolOptions {
    host?: string;
    user?: string;
    database?: string;
    password?: string;
    port?: number;
    min?: number;
    max?: number;
    idleTimeoutMillis?: number;
  }
}

export = Pool;
}

// Generated by typings
// Source: https://raw.githubusercontent.com/types/typed-pg/70cf49ddcca2119aaf95981b2350e4653aa66cc4/index.d.ts
declare module 'pg' {
import { EventEmitter } from 'events';
import { TlsOptions } from 'tls';
import Pool = require('~pg~pg-pool');

export type ClientConstructor = new (connection: string | Config) => Client;
export type QueryCallback = (err: Error, result: ResultSet) => void;
export type ClientConnectCallback = (err: Error, client: Client) => void;
export type ConnectCallback = (err: Error, client: Client, done: DoneCallback) => void;
export type DoneCallback = () => void;

export interface ResultSet {
  rows: any[];
}

export interface QueryConfig {
  name?: string;
  text: string;
  values?: any[];
}

export interface Config {
  host?: string;
  user?: string;
  database?: string;
  password?: string;
  port?: number;
  poolSize?: number;
  rows?: number;
  binary?: boolean;
  poolIdleTimeout?: number;
  reapIntervalMillis?: number;
  poolLog?: boolean;
  client_encoding?: string;
  ssl?: boolean | TlsOptions;
  application_name?: string;
  fallback_application_name?: string;
  parseInputDatesAsUTC?: boolean;
}

export interface ResultBuilder {
  command: string;
  rowCount: number;
  oid: number;
  rows: any[];
  addRow(row: any): void;
}

export class Query extends EventEmitter {
  text: string;
  rows: { [column: string]: any }[];
  values: any[];

  on(event: 'row', listener: (row: any, result: ResultBuilder) => void): this;
  on(event: 'end', listener: (result: ResultBuilder) => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
  on(event: string, listener: Function): this;
}

export class Client extends EventEmitter {
  constructor(config?: string | Config);

  user: string;
  database: string;
  port: string;
  host: string;
  password: string;
  binary: boolean;
  encoding: string;
  ssl: boolean;

  query(query: QueryConfig, callback?: QueryCallback): Query;
  query(text: string, callback?: QueryCallback): Query;
  query(text: string, values: any[], callback?: QueryCallback): Query;

  connect(callback?: ClientConnectCallback): void;
  end(): void;

  pauseDrain(): void;
  resumeDrain(): void;

  on(event: 'drain', listener: () => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
  on(event: 'notification', listener: (message: any) => void): this;
  on(event: 'notice', listener: (message: any) => void): this;
  on(event: string, listener: Function): this;
}

export { Pool }
export var defaults: Config;

/**
 * The following functions are used to convert a textual or binary
 * representation of a PostgreSQL result value into a JavaScript type.
 *
 * The oid can be obtained via the following sql query:
 *   `SELECT oid FROM pg_type WHERE typname = 'TYPE_NAME_HERE';`
 */
export namespace types {
  type TypeParserText = (value: string) => any;
  type TypeParserBinary = (value: Buffer) => any;

  export function getTypeParser(oid: number, format: 'text' | 'binary'): TypeParserText | TypeParserBinary;
  export function setTypeParser(oid: number, format: 'text' | 'binary', parseFn: TypeParserText | TypeParserBinary): void;

  export function getTypeParser(oid: number, format?: 'text'): TypeParserText;
  export function setTypeParser(oid: number, format: 'text', parseFn: TypeParserText): void;
  export function setTypeParser(oid: number, parseFn: TypeParserText): void;

  export function getTypeParser(oid: number, format: 'binary'): TypeParserBinary;
  export function setTypeParser(oid: number, format: 'binary', parseFn: TypeParserBinary): void;
}
}
