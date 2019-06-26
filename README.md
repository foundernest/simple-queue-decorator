Wolpertinger
============

Simple decorator-based wrapper for easy RabbitMQ queuing.

## Features

* Built-in connection recovery to queue.
* Decorator to register queue listeners.
* Send/Receive messages through the same connection.
* Ack and messages retries already set.
* Automatic creation of queues.
* JSON serialization/deserialization of messages.
* Concurrency control

## How To
Both JavaScript and Typescript can be used, however, this library is oriented to Typescript usage. `OnQueue` decorator is only available using Typescript

Init the service:

```ts
import * as Wolpertinger from 'wolpertinger'

await Wolpertinger.initService({
    url: "127.0.0.1",
    user: "guest",
    password: "guest"
})

await Wolpertinger.closeService(); // Closes the service
```


Consume Messages (this can be done before `initService`):
```ts
import { OnQueue } from 'wolpertinger'

class MyConsumer {

    @OnQueue('my-queue')
    public static async onMessageReceived(msg: any) {
        console.log("Message Received", msg.foo)
        await doSomethingWithMyMsg(msg) // If this returns a rejected promise, message will be re-queued once
    }
}
```

Send Messages (Service must be initiated beforehand):

```ts
import * as Wolpertinger from 'wolpertinger'

Wolpertinger.sendMessage('my-queue', {foo: "my message name"})

```

Messages can also be listened without using the decorator:

```ts
import * as Wolpertinger from 'wolpertinger'


Wolpertinger.registerQueue("my-queue", async (msg) => {
    console.log("Message Received", msg.foo)
    await doSomethingWithMyMsg(msg)
})
```


The following options can be passed to `initService`:

* **url**: The plain url (no protocol) of rabbitMQ.
* **user**: RabbitMQ user.
* **password**: RabbitMQ password.
* **log**: If true, will log internal queue errors, defaults to true.
* **messageConcurrency**: The number of messages to be consumed at the same time, defaults to 1.


### Important Notes

This library makes several assumptions on how the messages are going to be consumed, as such, if your needs are different, we recommend directly using [amqplib](https://www.npmjs.com/package/amqplib).

* A single retry will be done before completely dropping a message.
* Only one listener is attached to each queue.
* A single connection to be shared between all consumers.
* Queues are created with persistence.
* Messages are JSON formatted.
