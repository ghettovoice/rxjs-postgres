import { PgClient, PgQuery, PgResult } from "../../src/pg";
/**
 * node-postgres mocks
 */

export class ClientMock implements PgClient {
    public connected : boolean = false;
    public queries : any[] = [];

    constructor(config? : any) {

    }

    connect(callback? : (err? : Error, res? : PgClient) => void) : void {
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
            callback();
        }, 100);
    }

    query(queryText : string, values : any[], callback? : (err? : Error, res? : PgResult) => void) : PgQuery {
        if (!this.connected) {
            throw new Error('Not connected');
        }

        setTimeout(() => {
            const res : any = {
                rows: [],
            };

            this.queries.push({
                queryText,
                values,
                res
            });

            callback(undefined, res);
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
