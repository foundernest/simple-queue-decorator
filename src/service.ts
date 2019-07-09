import amqp from 'amqplib'
import { wait } from './utils'
import { AppOptions } from './types'
import Log from './log'

type QueueRegistry = {
  [q: string]: {
    cb: (r: any) => Promise<void>
    connected: boolean
  }
}

export default class RabbitMQService {
  private _options?: AppOptions
  private _channel?: amqp.Channel
  private queueRegistry: QueueRegistry = {}
  private connection?: amqp.Connection
  private connected = false
  private log: Log
  private assertedQueues: Set<string> = new Set() // Avoid duplicated queues
  private connectRetry = true

  constructor(options?: AppOptions) {
    this.log = new Log(true)
    if (options) {
      this.setOptions(options)
    }
  }

  public setOptions(options: AppOptions): void {
    this._options = options
    this.log = new Log(options.log)
  }

  public async sendMessage(queue: string, msg: any): Promise<void> {
    await this.createQueue(queue)
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)), {
      persistent: true,
    })
  }

  public registerQueue(queueName: string, cb: (r: any) => Promise<void>): void {
    if (this.queueRegistry[queueName]) {
      throw new Error(`[RabbitMQService] queue ${queueName} already registered`)
    }
    this.queueRegistry[queueName] = {
      cb,
      connected: false,
    }
    this.consumeQueue(queueName)
  }

  public async connect(): Promise<void> {
    this.disconnect()
    this.connectRetry = true
    while (!this.connected && this.connectRetry) {
      try {
        this.log.log('[RabbitMQ] Connecting')
        this.connection = await amqp.connect(this.url)
        this._channel = await this.connection.createChannel()
        await this.channel.prefetch(this.concurrency) // Number of messages to fetch simultaneously
        this.connection.on('close', () => {
          this.connection = undefined
          this._channel = undefined
          // Unexpected close
          if (this.connected) {
            this.log.warn('[RabbitMQ] Unexpected Close')
            this.connect()
          }
        })
        await Promise.all(
          Object.keys(this.queueRegistry).map(queue => {
            return this.consumeQueue(queue)
          })
        )

        this.connected = true
        this.log.log('[RabbitMQ] Connected')
      } catch (err) {
        this.log.warn('[RabbitMQ] Error Connecting', err)
        await wait(5000)
      }
    }
  }

  public async disconnect(): Promise<void> {
    this.connected = false
    this.connectRetry = false
    for (const q of Object.keys(this.queueRegistry)) {
      this.queueRegistry[q].connected = false
    }
    if (this.connection) {
      await this.connection.close()
    }
    this.connection = undefined
    this._channel = undefined
    this.assertedQueues.clear()
  }

  private get options(): AppOptions {
    if (!this._options) {
      throw new Error('[RabbitMQService] Options not initialized')
    }
    return this._options
  }

  private get url(): string {
    return `amqp://${this.options.user}:${this.options.password}@${this.options.url}`
  }

  private get concurrency(): number {
    return this.options.messageConcurrency === undefined
      ? 1
      : this.options.messageConcurrency
  }

  private get retry(): boolean {
    return this.options.retry === undefined ? true : this.options.retry
  }

  private get channel(): amqp.Channel {
    if (!this._channel) {
      throw new Error('[RabbitMQ] Not Connected')
    } else {
      return this._channel
    }
  }

  private async consumeQueue(queueName: string): Promise<void> {
    const queueData = this.queueRegistry[queueName]
    if (this._channel && !queueData.connected) {
      queueData.connected = true
      await this.createQueue(queueName)
      await this.channel.consume(
        queueName,
        async (msg: any) => {
          if (!msg) {
            this.log.error('[RabbitMQ] Message received is null')
          } else {
            try {
              const messageBody = JSON.parse(msg.content.toString())
              await this.queueRegistry[queueName].cb(messageBody)
              if (this.channel) {
                this.channel.ack(msg) // acks that the message was processed
              }
            } catch (err) {
              // Error processing, it will be requeued unless it has already been delivered (1 retry)
              this.log.warn('Error Processing Message:', msg.content.toString())
              if (err) {
                this.log.warn(err.message)
              }
              if (this.channel) {
                const shouldRetry = this.retry && !msg.fields.redelivered
                if (shouldRetry) {
                  this.channel.nack(msg, false, true)
                } else {
                  this.channel.nack(msg, false, false)
                }
              }
            }
          }
        },
        { noAck: false }
      )
    }
  }

  private async createQueue(queueName: string): Promise<void> {
    const queueAlreadyExists = this.assertedQueues.has(queueName)
    if (!queueAlreadyExists) {
      await this.channel.assertQueue(queueName, { durable: true }) // Creates the queue if doesn't exists
      this.assertedQueues.add(queueName)
    }
  }
}
