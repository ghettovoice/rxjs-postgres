import * as assert from "assert";
import { Pool } from "pg-pool";
import { Client, QueryResult } from "pg";
import * as Rx from "rx";
import RxClient from "./rxclient";
import { RxPoolError } from "../errors";

/**
 * Standalone RxJs adapter for `pg.Pool`.
 */
export default class RxPool implements Rx.Disposable {
    private _pool : Pool;
    private _tclient : RxClient;
    private _disposed : boolean;

    /**
     * @param {Pool} pool
     */
    constructor(pool : Pool) {
        if (!(this instanceof RxPool)) {
            return new RxPool(pool);
        }

        if (typeof pool.query !== 'function') {
            throw new RxPoolError('First argument should be instance of Pool type from "pg-pool" package');
        }

        this._pool = pool;
        this._disposed = false;
    }

    get pool() : Pool {
        return this._pool;
    }

    get tclient() : RxClient {
        return this._tclient;
    }

    get isDisposed() : boolean {
        return this._disposed;
    }

    dispose() : void {
        if (!this._disposed) {
            // TODO Implement ! Where to nullify tclient?
            this._disposed = true;
        }
    }

    /**
     * @return {Rx.Observable<RxClient>}
     */
    connect() : Rx.Observable<RxClient> {
        return Rx.Observable.fromPromise<Client>(this._pool.connect())
            .map<RxClient>((client : Client) => new RxClient(client));
    }

    /**
     * @return {Rx.Observable<RxClient>}
     */
    take() : Rx.Observable<RxClient> {
        return this.connect();
    }

    /**
     * @return {Rx.Observable<RxPool>}
     */
    end() : Rx.Observable<RxPool> {
        return Rx.Observable.fromPromise<void>(this._pool.end())
            .map<RxPool>(() => this);
    }

    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<QueryResult>}
     */
    query(queryText : string, values? : any[]) : Rx.Observable<QueryResult> {
        return this.connect()
            .flatMap<QueryResult>((client : RxClient) => client.query(queryText, values));
    }

    /**
     * @return {Observable<RxClient>}
     */
    begin() : Rx.Observable<RxClient> {
        const observable = this._tclient ?
                           Rx.Observable.return(this._tclient) :
                           this.connect();

        return observable.flatMap<RxClient>((client : RxClient) => {
                this._tclient = client;

                return client.begin();
            });
    }

    /**
     * @param {boolean} [force] Commit transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    commit(force? : boolean) : Rx.Observable<RxClient> {
        assert(this._tclient, 'Transaction client exists');

        return this._tclient.commit(force);
    }

    /**
     * @param {boolean} [force] Rollback transaction with all savepoints.
     * @return {Rx.Observable<RxClient>}
     * @throws {AssertionError}
     */
    rollback(force? : boolean) : Rx.Observable<RxClient> {
        assert(this._tclient, 'Transaction client exists');

        return this._tclient.rollback(force);
    }
}
