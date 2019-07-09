Simple Queue Decorator
======================
_by @foundernest_

[![npm](https://img.shields.io/npm/v/simple-queue-decorator.svg)](https://www.npmjs.com/package/simple-queue-decorator)
[![Build Status](https://img.shields.io/travis/foundernest/simple-queue-decorator/master.svg?label=build)](https://travis-ci.org/foundernest/simple-queue-decorator)

Simple decorator-based wrapper for easy RabbitMQ queuing.

## Features

* Built-in connection recovery to queue.
* Decorator to register queue listeners.
* Send/Receive messages through the same connection.
* Ack and messages retries already set.
* Automatic creation of queues.
* JSON serialization/deserialization of messages.
* Concurrency control.
* Full Typescript support.

## How To
Both JavaScript and Typescript can be used, however, this library takes advantage of Typescript decorators. `OnQueue` decorator is only available using Typescript.

> A running instance of RabbitMQ is needed, a docker-compose file is provided to use along with this library in a dev env (`docker-compose up -d rabbitmq`). **Do not use** the given image in production

Init the service:

```ts
import * as SimpleQueueDecorator from 'simple-queue-decorator'

await SimpleQueueDecorator.initService({
    url: "127.0.0.1",
    user: "guest",
    password: "guest"
})

await SimpleQueueDecorator.closeService(); // Closes the service
```


Consume Messages (this can be done before `initService`):
```ts
import { OnQueue } from 'simple-queue-decorator'

class MyConsumer {

    @OnQueue('my-queue')
    public static async onMessageReceived(msg: any) {
        console.log("Message Received", msg.foo)
        await doSomethingWithMyMsg(msg) // If this returns a rejected promise, message will be re-queued once
    }
}
```

> It is recommended to use static methods with queue decorator

Send Messages (Service must be initiated beforehand):

```ts
import * as SimpleQueueDecorator from 'simple-queue-decorator'

SimpleQueueDecorator.sendMessage('my-queue', {foo: "my message name"})

```

Messages can also be listened without using the decorator:

```ts
import * as SimpleQueueDecorator from 'simple-queue-decorator'


SimpleQueueDecorator.registerQueue("my-queue", async (msg) => {
    console.log("Message Received", msg.foo)
    await doSomethingWithMyMsg(msg)
})
```

This is preferable if using JavaScript or using dynamic dependencies (e.g. injectables) in the queue callback.


The following options can be passed to `initService`:

* **url**: The plain url (no protocol) of rabbitMQ.
* **user**: RabbitMQ user.
* **password**: RabbitMQ password.
* **log**: If true, will log internal queue errors, defaults to true.
* **messageConcurrency**: The number of messages to be consumed at the same time, defaults to 1.
* **retry**: If true, 1 retry per message will be made if the callback returns a rejected promise, defaults to true.

### Development steps
node and npm required, either docker or a running instance of rabbitmq required.

1. `npm install`
2. `npm run tsc` to compile
3. (optional) `docker-compose up -d rabbitmq` to launch rabbitmq
4. `npm test` to compile and execute tests

### Important Notes

This library makes several assumptions on how the messages are going to be consumed, as such, if your needs are different, we recommend directly using [amqplib](https://www.npmjs.com/package/amqplib).

* A single retry will be done before completely dropping a message.
* Only one listener is attached to each queue.
* A single connection to be shared between all consumers.
* Queues are created with persistence.
* Messages are JSON formatted.
* By default, messages are consumed 1 at a time.
