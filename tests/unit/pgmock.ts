import { setTimeout } from "timers";
import { QueryResult } from 'pg';
/**
 * node-postgres mocks
 */

export class ClientMock {
    public user : string;
    public database : string;
    public port : number;
    public host : string;
    public password : string;

    public connected : boolean = false;
    public queries : any[] = [];

    constructor(config : any = {}) {
        this.user = config.user;
        this.database = config.database;
        this.port = config.port;
        this.host = config.host;
        this.password = config.password;
    }

    connect(callback? : (err? : Error, inst? : ClientMock) => void) : void {
        setTimeout(() => {
            this.connected = true;
            callback(null, this);
        }, 100);
    }

    end(callback? : (...args: any[]) => void) : void {
        setTimeout(() => {
            this.queries = [];
            callback();
        }, 100);
    }

    query(queryText : string, values? : any[]) : Promise<QueryResult> {
        return new Promise<QueryResult>((resolve: Function, reject: Function) => {
            if (!this.connected) {
                return reject(new Error('Not connected'));
            }

            const res = <QueryResult>{
                command: queryText,
                rowCount: 0,
                oid: 1,
                rows: [],
            };

            this.queries.push({
                queryText,
                values,
                res
            });

            resolve(res);
        });
    }
}

export class PoolMock {
    constructor(config : any = {}) {

    }

    connect() : Promise<ClientMock> {
        return Promise.resolve(new ClientMock('qwerty@localhost:4632/qwerty'));
    }

    end() : Promise<void> {
        return Promise.resolve(undefined);
    }

    query(queryText : string, values? : any[]) : Promise<{}> {
        return Promise.resolve({});
    }
}
