/**
 * node-postgres mocks
 */

export class ClientMock {
    public connectionString : string;

    constructor(connectionString : string) {
        this.connectionString = connectionString;
    }

    connect(callback? : (err : Error) => void) : void {
        return;
    }

    end() : void {
        return;
    }

    release() : void {
        return;
    }

    query(queryText : string, values? : any[]) : Promise<{}> {
        return Promise.resolve({});
    }
}

export class PoolMock {
    constructor() {}

    connect() : Promise<ClientMock> {
        return Promise.resolve(new ClientMock('qwerty'));
    }

    end() : Promise<void> {
        return Promise.resolve(undefined);
    }

    query(queryText : string, values? : any[]) : Promise<{}> {
        return Promise.resolve({});
    }
}
