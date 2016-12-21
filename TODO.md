## TODO

- [x] Handle client connection events (error, end) 
- [x] Write tests on error handling (sql errors, disconnects & etc)
- [ ] RxPool: finally release client ( using `finally` operator )
- [x] Transaction helpers in RxClient 
- [ ] Transaction helpers in RxPool 
- [ ] Decorators (share code base of `connect`, `query`, `end` ... methods with adapters)
- [ ] Cover code with comments and generate API documentation
- [ ] todo Try to use rxjs Subject as single source of values, subscribe it to each async operation
      and manually emit results for it's observers, manually complete after closing connection etc...
