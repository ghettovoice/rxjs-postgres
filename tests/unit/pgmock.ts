import { PgClient, PgQuery, PgQueryResult, PgPool } from "../../src/pg";
import { Query, ResultSet, ClientConstructor } from "pg";
import * as assert from "assert";
import Pool = require("pg-pool");
/**
 * node-postgres mocks
 */

export class ClientMock implements PgClient {
    public connected : boolean = false;
    public queries : any[] = [];
    public released : boolean = false;
    public destroyed : boolean = false;
    public listeners : any = {};
    release? : (err? : Error) => void = () => {};

    constructor(config? : any) {

    }

    connect(callback? : (err? : Error, res? : PgClient) => void) : void {
        assert(!this.destroyed, 'Client not destroyed');

        if (this.connected) {
            return;
        }

        setTimeout(() => {
            this.connected = true;
            typeof callback === 'function' && callback(undefined, this);
        }, 100);
    }

    end(callback? : () => void) : void {
        setTimeout(() => {
            this.queries = [];
            this.connected = false;
            this.destroyed = true;

            typeof callback === 'function' && callback();
            this.emit('end');
        }, 100);
    }

    query(queryText : string, values : any[], callback? : (err? : Error, res? : PgQueryResult | ResultSet) => void) : PgQuery | Query {
        assert(this.connected, 'Client connected');
        assert(!this.destroyed, 'Client not destroyed');

        this.queries.push({
            query: queryText,
            args: values
        });

        setTimeout(() => {
            if (typeof callback === 'function') {
                callback(undefined, {
                    rows: [],
                });
            }
        }, 100);

        return new QueryMock({
            text: queryText
        });
    }

    addListener(event : string, listener : (...args : any[]) => void) : void {
        this.listeners[event] || (this.listeners[event] = []);
        this.listeners[event].push(listener);
    }

    removeListener(event : string, listener : (...args : any[]) => void) : void {
        const index = this.listeners[event].indexOf(listener);

        if (index !== -1) {
            this.listeners[event].splice(index, 1);
        }
    }

    emit(event : string, ...args : any[]) : void {
        if (this.listeners[event]) {
            this.listeners[event].forEach((listener : (...args : any[]) => void) => listener(...args));
        }
    }
}

export class QueryMock implements PgQuery {
    text : string;

    constructor(config : any = {}) {
        this.text = config.text;
    }
}

export class PoolMock implements PgPool {
    public Client : Function = ClientMock;
    public pool : ClientMock[] = [];

    constructor(options? : Pool.PoolOptions, Client? : ClientConstructor) {
        this.Client = ClientMock;
    }

    connect(callback? : (err? : Error, client? : PgClient) => void) : Promise<PgClient> {
        return new Promise<PgClient>((resolve : Function, reject? : Function) => {
            setTimeout(() => {
                const client = new ClientMock();
                const self = this;

                // todo test releasing and auto disposing
                (<any>client).release = function (err? : Error) {
                    let i = self.pool.indexOf(client);

                    if (i > -1) {
                        self.pool.splice(i, 1);
                        client.released = true;
                        client.end();
                    }
                };

                this.pool.push(client);

                client.connect((err? : Error, client? : PgClient) => {
                    if (err) {
                        typeof callback === 'function' && callback(err);
                        reject(err);

                        return;
                    }

                    typeof callback === 'function' && callback(undefined, client);
                    resolve(client);
                });
            }, 100);
        });
    }

    take(callback? : (err? : Error, client? : PgClient) => void) : Promise<PgClient> {
        return this.connect();
    }

    query(queryText : string, values : any[], callback? : (err? : Error, res? : PgQueryResult) => void) : Promise<PgQueryResult> {
        return this.connect().then<PgQueryResult>((client : PgClient) => new Promise((resolve? : Function, reject? : Function) => {
            client.query(queryText, values, (err? : Error, res? : any) => {
                client.release(err);

                if (err) {
                    return reject(err);
                }

                // for debug and test
                res.client = client;

                typeof callback === 'function' && callback(undefined, res);
                resolve(res);
            });
        }));
    }

    end(callback? : (err? : Error)=>void) : Promise<void> {
        return Promise.all<void[]>(
            this.pool.map((client : ClientMock, i : number) => new Promise((resolve? : Function, reject? : Function) => {
                client.end((err? : Error) => {
                    if (err) {
                        return reject(err);
                    }

                    this.pool.splice(i, 1);
                    resolve();
                });
            }))
        ).then<void>(() => {
            this.pool = [];
            typeof callback === 'function' && callback();
        });
    }
}
