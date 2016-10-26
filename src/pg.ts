export declare interface PgQuery {
    text : string;
}

export declare interface PgResult {
    rows : any[];
}

export declare interface PgClient {
    release? : (err? : Error) => void;

    query(queryText : string, values : any[], callback? : (err? : Error, res? : PgResult) => void) : PgQuery;
    connect(callback? : (err? : Error, res? : PgClient) => void) : void;
    end(callback? : () => void) : void;
}
