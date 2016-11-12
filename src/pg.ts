import { Stream } from "stream";
/**
 * Internal `node-postgres` interfaces for.
 * Used for mocking.
 *
 * @package rxjs-postgres
 * @author Vladimir Vershinin
 * @license MIT
 * @copyright (c) 2016, Vladimir Vershinin
 */


export declare interface PgQuery {
    text : string;
}

export declare interface PgQueryResult {
    rows : any[];
}

export declare interface PgClient {
    connection: { stream : { readyState : string } };
    release? : (err? : Error) => void;

    query(queryText : string, values : any[], callback? : (err? : Error, res? : PgQueryResult) => void) : PgQuery;
    connect(callback? : (err? : Error, res? : PgClient) => void) : void;
    end(callback? : () => void) : void;
}

export declare interface PgPool {
    connect(callback?: (err? : Error, client? : PgClient) => void): Promise<PgClient>;
    take(callback?: (err? : Error, client? : PgClient) => void): Promise<PgClient>;
    query(queryText : string, values : any[], callback? : (err? : Error, res? : PgQueryResult) => void): Promise<PgQueryResult>;
    end(callback?: (err? : Error) => void): Promise<void>;
}
