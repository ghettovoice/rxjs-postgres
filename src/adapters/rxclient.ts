import * as assert from "assert";
import { Client, ResultSet } from "pg";
import * as Rx from "rx";
import { RxClientError } from "../errors";
import { PgClient } from "../pg";

/**
 * Standalone RxJs adapter for `pg.Client`.
 */
export default class RxClient implements Rx.Disposable {
    private _client : PgClient;
    private _tlevel : number;
    private _disposed : boolean;

    /**
     * @param {PgClient | Client} client
     */
    constructor(client : PgClient | Client) {
        /* istanbul ignore if */
        if (!(this instanceof RxClient)) {
            return new RxClient(client);
        }

        this._client = client;
        this._tlevel = 0;
        this._disposed = false;
    }

    get client() : Client | PgClient {
        return this._client;
    }

    get tlevel() : number {
        return this._tlevel;
    }

    get isDisposed() : boolean {
        return this._disposed;
    }

    release() : void {
        typeof this._client.release === 'function' && this._client.release();
    }

    dispose() : void {
        if (!this._disposed) {
            this.release();
            this._disposed = true;
        }
    }

    /**
     * @return {Rx.Observable<RxClient>}
     */
    connect() : Rx.Observable<RxClient> {
        const connect : () => Rx.Observable<Client> = Rx.Observable.fromNodeCallback<Client>(this._client.connect, this._client);

        return connect().map((client : Client) => this);
    }

    /**
     * @return {Rx.Observable<RxClient>}
     */
    end() : Rx.Observable<RxClient> {
        const end : () => Rx.Observable<Client> = Rx.Observable.fromNodeCallback<Client>(this._client.end, this._client);

        return end().map<RxClient>(() => this);
    }

    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<ResultSet>}
     */
    query(queryText : string, values? : any[]) : Rx.Observable<ResultSet> {
        const query : (queryText : string, values? : any[]) => Rx.Observable<ResultSet> = Rx.Observable.fromNodeCallback<ResultSet>(this._client.query, this._client);

        return query(queryText, values);
    }

    /**
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    begin() : Rx.Observable<RxClient> {
        assert(this._tlevel >= 0, 'Current transaction level >= 0');

        let query : string;

        if (this._tlevel === 0) {
            query = 'begin';
        } else {
            query = `savepoint point_${this._tlevel}`;
        }

        //noinspection CommaExpressionJS
        return this.query(query)
            .map<RxClient>(() => (++this._tlevel, this));
    }

    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    commit(force? : boolean) : Rx.Observable<RxClient> {
        assert(this._tlevel >= 0, 'Current transaction level >= 0');

        if (this._tlevel === 0) {
            throw new RxClientError('No opened transaction on the client, nothing to commit');
        }

        if (this._tlevel === 1 || force) {
            //noinspection CommaExpressionJS
            return this.query('commit')
                .map<RxClient>(() => (this._tlevel = 0, this));
        }

        //noinspection CommaExpressionJS
        return this.query(`release savepoint point_${this._tlevel - 1}`)
            .map<RxClient>(() => (--this._tlevel, this));
    }

    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    rollback(force? : boolean) : Rx.Observable<RxClient> {
        assert(this._tlevel >= 0, 'Current transaction level >= 0');

        if (this._tlevel === 0) {
            throw new RxClientError('No opened transaction on the client, nothing to rollback');
        }

        if (this._tlevel === 1 || force) {
            //noinspection CommaExpressionJS
            return this.query('rollback')
                .map<RxClient>(() => (this._tlevel = 0, this));
        }

        //noinspection CommaExpressionJS
        return this.query(`rollback to savepoint point_${this._tlevel - 1}`)
            .map<RxClient>(() => (--this._tlevel, this));
    }
}
