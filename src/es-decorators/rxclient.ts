/**
 * Reactive ES decorator for `pg.Client`.
 */
export default function RxClient(options? : Object) : ClassDecorator {
    return function (Client : Function) : Function {
        return Client;
    };
}
