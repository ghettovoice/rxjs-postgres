import { setTimeout } from "timers";
import { ResultSet } from "pg";
/**
 * node-postgres mocks
 */

export class ClientMock {
    public connected : boolean = false;
    public queries : any[] = [];

    constructor(config? : any) {

    }

    connect(callback? : (err? : Error, inst? : ClientMock) => void) : void {
        if (this.connected) {
            callback(undefined, this);
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

    query(query : string, values? : any[]) : Promise<ResultSet> {
        return new Promise<ResultSet>((resolve: Function, reject: Function) => {
            if (!this.connected) {
                return reject(new Error('Not connected'));
            }

            const res = <ResultSet>{
                command: query,
                rowCount: 0,
                oid: 1,
                rows: [],
            };

            this.queries.push({
                query,
                values,
                res
            });

            resolve(res);
        });
    }
}
