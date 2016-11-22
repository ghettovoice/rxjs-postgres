# rxjs-postgres

> RxJs adapters and decorators for node-postgres

[![Build Status](https://travis-ci.org/ghettovoice/rxjs-postgres.svg?branch=master)](https://travis-ci.org/ghettovoice/rxjs-postgres)
[![Coverage Status](https://coveralls.io/repos/github/ghettovoice/rxjs-postgres/badge.svg?branch=master)](https://coveralls.io/github/ghettovoice/rxjs-postgres?branch=master)

## System requirements

* PostgreSQL ver. >= 9.1

## Installation

```bash
npm install --save rxjs-postgres
```

## Test

```bash
# Only tests
npm run test

# Tests with coverage
npm run test:cover
```

## TODO

- [ ] Implement custom Observable class with operators (connect / open, end, query & etc.) 
- [ ] Write tests on error handling (sql errors, disconnects & etc)
- [ ] Implement auto releasing of the acquired client from the pool (client as disposable resource)
- [ ] Transaction helpers in RxClient and RxPool (tlevel handling on errors, disconnect & etc)
- [ ] ES7 decorators to reactify `node-postgres`
