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

export class PoolMock extends Pool implements PgPool {
    public Client : Function = ClientMock;
    // public pool : ClientMock[];

    constructor(options : Pool.PoolOptions, Client? : ClientConstructor) {
        super(options, Client);
        this.Client = ClientMock;
    }

    // connect(cb? : (err? : Error, client? : PgClient) => void) : Promise<PgClient> {
    //     return new Promise((resolve : Function) => {
    //         setTimeout(() => {
    //             const client = new ClientMock();
    //             const self = this;
    //
    //             client.release = function () {
    //                 let i = self.pool.indexOf(client);
    //
    //                 if (i > -1) {
    //                     self.pool.splice(i, 1);
    //                     client.released = true;
    //                     client.end();
    //                 }
    //             };
    //
    //             this.pool.push(client);
    //             resolve(client);
    //         });
    //     });
    // }
    //
    // take(cb? : (err? : Error, client? : PgClient) => void) : Promise<PgClient> {
    //     return undefined;
    // }
    //
    // query(queryText : string, values : any[], callback? : (err? : Error, res? : PgQueryResult) => void) : Promise<PgQueryResult> {
    //     return undefined;
    // }
    //
    // end(cb? : (err? : Error)=>void) : Promise<void> {
    //     return undefined;
    // }
}
