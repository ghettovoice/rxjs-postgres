///<reference path="../node_modules/rx/ts/rx.all.d.ts"/>

// correct definition for pg-pool package, without 'export default'
declare module "pg-pool" {
    import { Pool} from "pg";

    export = Pool;
}
