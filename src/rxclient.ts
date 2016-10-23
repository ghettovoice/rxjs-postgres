import { Client, QueryResult } from "pg";
import * as Rx from "rx";
import { RxClientError } from "./errors";

/**
 * RxJs decorator for `pg.Client`.
 * todo implement as Rx.Disposable!
 */
export class RxClient {
    private _client : Client;
    private _transactionLevel : number = 0;

    /**
     * @param {Client} client
     */
    constructor(client : Client) {
        this._client = client;
    }

    get client() : Client {
        return this._client;
    }

    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<QueryResult>}
     */
    query(queryText : string, values? : any[]) : Rx.Observable<QueryResult> {
        return Rx.Observable.fromPromise<QueryResult>(this._client.query(queryText, values));
    }

    /**
     * @return {Rx.Observable<RxClient>}
     * @throws {RxClientError}
     */
    begin() : Rx.Observable<RxClient> {
        if (this._transactionLevel < 0) {
            throw new RxClientError('Transaction chain is broken');
        }

        let query : string;

        if (this._transactionLevel === 0) {
            query = 'begin';
        } else if (this._transactionLevel > 1) {
            query = `savepoint point_${this._transactionLevel}`;
        }

        return this.query(query)
            .map(() => (++this._transactionLevel, this));
    }

    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {RxClientError}
     */
    commit(force? : boolean) : Rx.Observable<RxClient> {
        if (this._transactionLevel < 0) {
            throw new RxClientError('Transaction chain is broken');
        }

        if (this._transactionLevel === 1 || force) {
            return this.query('commit')
                .map(() => (this._transactionLevel = 0, this));
        } else if (this._transactionLevel > 1) {
            return this.query(`release savepoint point_${this._transactionLevel}`)
                .map(() => (--this._transactionLevel, this))
        }
    }

    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {RxClientError}
     */
    rollback(force? : boolean) : Rx.Observable<RxClient> {
        if (this._transactionLevel < 0) {
            throw new RxClientError('Transaction chain is broken');
        }

        if (this._transactionLevel === 1 || force) {
            return this.query('rollback')
                .map(() => (this._transactionLevel = 0, this));
        } else if (this._transactionLevel > 1) {
            return this.query(`rollback to savepoint point_${this._transactionLevel}`)
                .map(() => (--this._transactionLevel, this))
        }
    }
}
