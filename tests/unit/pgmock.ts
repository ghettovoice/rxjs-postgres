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
            callback(undefined, this);
        }, 100);
    }

    end(callback? : () => void) : void {
        setTimeout(() => {
            this.queries = [];
            this.connected = false;
            this.destroyed = true;
            callback();
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
            callback(undefined, {
                rows: [],
            });
        }, 100);

        return new QueryMock({
            text: queryText
        });
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
                (<any>client).release = function () {
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
        return this.connect().then<PgQueryResult>((client) => new Promise((resolve? : Function, reject? : Function) => {
            client.query(queryText, values, (err? : Error, res? : ResultSet) => {
                if (err) {
                    return reject(err);
                }

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
