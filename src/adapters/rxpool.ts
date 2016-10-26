import Pool = require("pg-pool");
import * as assert from "assert";
import { Client, ResultSet } from "pg";
import * as Rx from "rx";
import RxClient from "./rxclient";
import { RxPoolError } from "../errors";
import * as util from '../util';

const connect : () => Rx.Observable<Client> = Rx.Observable.fromNodeCallback<Client>(Pool.prototype.connect);
const query : () => Rx.Observable<ResultSet> = Rx.Observable.fromNodeCallback<ResultSet>(Pool.prototype.query);
const end : () => Rx.Observable<void> = Rx.Observable.fromNodeCallback<void>(Pool.prototype.end);

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
        return util.call<Rx.Observable<Client>>(connect, this._pool)
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
        return util.call<Rx.Observable<void>>(end, this._pool)
            .map<RxPool>(() => this);
    }

    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<ResultSet>}
     */
    query(queryText : string, values? : any[]) : Rx.Observable<ResultSet> {
        return util.call<Rx.Observable<ResultSet>>(query, this._pool, queryText, values);
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
