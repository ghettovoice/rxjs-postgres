import assert from "assert";
import pg from "pg";

/**
 * node-postgres mocks
 */
export class ClientMock extends pg.Client {
    constructor(...args) {
        super(...args);

        this.connected = false;
        this.queries = [];
        this.released = false;
        this.destroyed = false;
        this.connection = { stream : { readyState : 'closed' } };
    }

    connect(callback) {
        assert(!this.destroyed, 'Client not destroyed');

        if (this.connected) {
            return;
        }

        setTimeout(() => {
            this.connected = true;
            this.connection.stream.readyState = 'open';
            typeof callback === 'function' && callback(undefined, this);
        }, 100);
    }

    end(callback) {
        setTimeout(() => {
            this.queries = [];
            this.connected = false;
            this.destroyed = true;

            typeof callback === 'function' && callback();
            this.emit('end');
        }, 100);
    }

    query(queryText, values, callback) {
        assert(this.connected, 'Client connected');
        assert(!this.destroyed, 'Client not destroyed');

        this.queries.push({
            query: queryText,
            args: values
        });

        setTimeout(() => {
            typeof callback === 'function' && callback(undefined, {
                client: this,
                rows: []
            });
        }, 100);

        return {
            text: queryText
        };
    }
}

export class PoolMock extends pg.Pool {
    constructor(...args) {
        super(...args);

        this.Client = ClientMock;
        this.pool_ = [];
    }

    // connect(callback) {
    //     return new Promise((resolve, reject) => {
    //         setTimeout(() => {
    //             const client = new ClientMock();
    //             const self = this;
    //
    //             // todo test releasing and auto disposing
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
    //
    //             client.connect((err, client) => {
    //                 if (err) {
    //                     typeof callback === 'function' && callback(err);
    //                     reject(err);
    //
    //                     return;
    //                 }
    //
    //                 typeof callback === 'function' && callback(undefined, client);
    //                 resolve(client);
    //             });
    //         }, 100);
    //     });
    // }
    //
    // take(...args) {
    //     return this.connect(...args);
    // }
    //
    // query(queryText, values, callback) {
    //     return this.connect().then(client => new Promise((resolve, reject) => {
    //         client.query(queryText, values, (err, res) => {
    //             client.release(err);
    //
    //             if (err) {
    //                 return reject(err);
    //             }
    //
    //             // for debug and test
    //             res.client = client;
    //
    //             typeof callback === 'function' && callback(undefined, res);
    //             resolve(res);
    //         });
    //     }));
    // }
    //
    // end(callback) {
    //     return Promise.all(
    //         this.pool.map((client, i) => new Promise((resolve, reject) => {
    //             client.end(err => {
    //                 if (err) {
    //                     return reject(err);
    //                 }
    //
    //                 this.pool.splice(i, 1);
    //                 resolve();
    //             });
    //         }))
    //     ).then(() => {
    //         this.pool = [];
    //         typeof callback === 'function' && callback();
    //     });
    // }
}
