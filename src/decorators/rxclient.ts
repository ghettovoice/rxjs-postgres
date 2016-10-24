import * as assert from "assert";
import { Client, QueryResult } from "pg";
import * as Rx from "rx";
import { RxClientError } from "../errors";
import * as util from "../util";

const connect : () => Rx.Observable<Client> = Rx.Observable.fromNodeCallback<Client>(Client.prototype.connect);
const end : () => Rx.Observable<Client> = Rx.Observable.fromNodeCallback<Client>(Client.prototype.end);

/**
 * Standalone RxJs decorator for `pg.Client`.
 */
export default class RxClient implements Rx.Disposable {
    private _client : Client;
    private _tlevel : number;
    private _disposed : boolean;

    /**
     * @param {Client} client
     */
    constructor(client : Client) {
        if (!(this instanceof RxClient)) {
            return new RxClient(client);
        }

        this._client = client;
        this._tlevel = 0;
        this._disposed = false;
    }

    get client() : Client {
        return this._client;
    }

    get tlevel() : number {
        return this._tlevel;
    }

    get disposed() : boolean {
        return this._disposed;
    }

    release() : void {
        this._client.release();
    }

    dispose() {
        if (!this._disposed) {
            this.release();
            this._disposed = true;
        }
    }

    /**
     * @return {Observable<RxClient>}
     */
    connect() : Rx.Observable<RxClient> {
        return util.call<Rx.Observable<Client>>(connect, this._client)
            .map<RxClient>(() => this);
    }

    /**
     * @return {Observable<RxClient>}
     */
    end() : Rx.Observable<RxClient> {
        return util.call<Rx.Observable<Client>>(end, this._client)
            .map<RxClient>(() => this);
    }

    /**
     * @param {string} query
     * @param {Array} [values]
     * @return {Rx.Observable<QueryResult>}
     */
    query(query : string, values? : any[]) : Rx.Observable<QueryResult> {
        return Rx.Observable.fromPromise<QueryResult>(this._client.query(query, values));
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
        } else if (this._tlevel > 1) {
            query = `savepoint point_${this._tlevel}`;
        }

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
            return this.query('commit')
                .map<RxClient>(() => (this._tlevel = 0, this));
        }

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
            return this.query('rollback')
                .map<RxClient>(() => (this._tlevel = 0, this));
        }

        return this.query(`rollback to savepoint point_${this._tlevel - 1}`)
            .map<RxClient>(() => (--this._tlevel, this));
    }
}