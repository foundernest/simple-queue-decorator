2.1.0 / 2021-01-13
==================

* License changed to MIT
* Dependencies updated

2.0.0 / 2019-11-07
==================

* InitService and closeService are now init and close respectively
* MessageConcurrency option renamed to concurrency

1.3.0 / 2019-10-12
==================

* RegisterQueue now support an array of queues
* Minor code improvements
* Dependencies updated
* Typescript set as a devDependency
* Tests removed from build

1.2.0 / 2019-07-31
==================

* Added connectionRetryDelay option
* Max retry attempts error will be thrown before next retry
* Fixed wrong warning log that was being shown on successfull connections

1.1.0 / 2019-07-29
==================

* SendToQueue will now resolve after rabbitmq acked
* Max Reconnection Retries option
* Logs improved

1.0.0 / 2019-07-26
==================

* Priority option added to sendMessage

0.1.3 / 2019-07-24
==================

* Minor fix in CI tests

0.1.2 / 2019-07-24
==================

* Dev dependencies updated
* Removed package-lock from repository

0.1.1 / 2019-07-09
==================

* Added retry option

0.1.0 / 2019-06-08
==================

* First Release
* OnQueue decorator
* Main RabbitMQ service
