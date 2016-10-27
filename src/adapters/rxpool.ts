import Pool = require("pg-pool");
import * as assert from "assert";
import { Client, ResultSet } from "pg";
import * as Rx from "rx";
import RxClient from "./rxclient";
import { PgPool } from "../pg";

/**
 * Standalone RxJs adapter for `pg.Pool`.
 */
export default class RxPool {
    private _pool : PgPool;
    private _tclient : RxClient;

    /**
     * @param {Pool} pool
     */
    constructor(pool : Pool | PgPool) {
        /* istanbul ignore if */
        if (!(this instanceof RxPool)) {
            return new RxPool(pool);
        }

        this._pool = pool;
    }

    get pool() : Pool | PgPool {
        return this._pool;
    }

    get tclient() : RxClient {
        return this._tclient;
    }

    /**
     * @return {Rx.Observable<RxClient>}
     */
    connect() : Rx.Observable<RxClient> {
        const connect : () => Rx.Observable<Client> = Rx.Observable.fromNodeCallback<Client>(this._pool.connect, this._pool);

        return connect().map<RxClient>((client : Client) => new RxClient(client));
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
        const end : () => Rx.Observable<Client> = Rx.Observable.fromNodeCallback<Client>(this._pool.end, this._pool);

        return end().map<RxPool>(() => this);
    }

    /**
     * @param {string} queryText
     * @param {Array} [values]
     * @return {Rx.Observable<ResultSet>}
     */
    query(queryText : string, values? : any[]) : Rx.Observable<ResultSet> {
        const query : (queryText : string, values? : any[]) => Rx.Observable<ResultSet> = Rx.Observable.fromNodeCallback<ResultSet>(this._pool.query, this._pool);

        return query(queryText, values);
    }

    /**
     * @return {Rx.Observable<RxClient>}
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
