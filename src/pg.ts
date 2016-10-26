export declare interface PgQuery {
    text : string;
}

export declare interface PgQueryResult {
    rows : any[];
}

export declare interface PgClient {
    release? : (err? : Error) => void;

    query(queryText : string, values : any[], callback? : (err? : Error, res? : PgQueryResult) => void) : PgQuery;
    connect(callback? : (err? : Error, res? : PgClient) => void) : void;
    end(callback? : () => void) : void;
}
