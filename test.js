import { Subscriber } from 'rxjs'
import { ClientMock } from './tests/pgmock'
import { RxClient, config } from './src'

config.DEBUG = true

const client = new ClientMock()
const rxClient = new RxClient(client)

class LogSubscriber extends Subscriber {
  constructor (tag) {
    super(
      x => console.log('NEXT', tag, x),
      err => console.error('ERROR', tag, err.message),
      () => console.log('COMPLETE', tag)
    )
  }
}

// let insertsSource = Observable.of(
//     [ 123, 'name1' ],
//     [ 321, 'name2' ],
//     [ 777, 'name3' ]
// ).flatMap(
//     queryArgs => rxClient.begin()
//         .flatMapTo(
//             rxClient.query(
//                 'insert into some_table (key, title) values ($1, $2) returning *',
//                 queryArgs
//             )
//         )
//         .flatMapTo(rxClient.commit(), result => result)
//         .catch(() => rxClient.rollback())
// );
//
// Observable.merge(
//     rxClient.begin(),
//     insertsSource,
//     rxClient.commit()
// ).catch(() => rxClient.rollback())
//     .subscribe(new LogSubscriber(1));

/**************************************
 Checked, add to tests
 ***************************************/
// let source = rxClient.connect()
//   .delay(500)
//   .concat(rxClient.end())
//
// source.subscribe(new LogSubscriber(1))
// setTimeout(() => source.subscribe(new LogSubscriber(2)), 500)

// // RxClient#txLevel = 0
// // begin new transaction
// rxClient.begin() // RxClient#txLevel = 1
//   .concat(rxClient.queryRow(
//     'insert into main (name) values ($1) returning *',
//     [ 'qwerty' ]
//   ))
//   // work with inserted record
//   .mergeMap(
//     record => Observable.concat(
//       rxClient.begin(), // RxClient#txLevel = 2
//       rxClient.queryRow(
//         'update main set (id, name) = ($1, $2) where id = $3 returning *',
//         [ 1, 'qwerty new name', record.id ]
//       ),
//       rxClient.commit() // RxClient#txLevel = 1
//     ).catch(() => rxClient.rollback(record)) // rollback to the last savepoint if query failed
//   )
//   // commit the top level transaction
//   .mergeMap(record => rxClient.commit(record, true)) // RxClient#txLevel = 0
//   .subscribe(new LogSubscriber(1))
