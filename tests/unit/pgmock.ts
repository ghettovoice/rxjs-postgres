import { PgClient, PgQuery, PgQueryResult } from "../../src/pg";
import { Query } from "pg";
import { ResultSet } from "pg";
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

    query(queryText : string, values : any[], callback? : (err? : Error, res? : PgQueryResult | ResultSet) => void) : PgQuery | Query {
        if (!this.connected) {
            throw new Error('Not connected');
        }

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
