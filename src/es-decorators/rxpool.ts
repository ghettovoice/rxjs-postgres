/**
 * Reactive ES Decorator for `pg.Client`.
 */
export default function RxPool(options? : Object) : ClassDecorator {
    return function (Pool : Function) : Function {
        return Pool;
    };
}
