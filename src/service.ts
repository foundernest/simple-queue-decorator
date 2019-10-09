import amqp from 'amqplib'
import { wait } from './utils'
import {
  InitOptions,
  SendMessageOptions,
  ServiceOptions,
  DefaultOptions,
} from './types'
import Log from './log'
import MessageEmitter from './messageEmitter'

type QueueRegistry = {
  [q: string]: {
    cb: (r: any) => Promise<void>
    connected: boolean // This is to make "consumeQueue" idempotent
  }
}

const DEFAULT_OPTIONS: DefaultOptions = {
  messageConcurrency: 1,
  log: true,
  retry: true,
  connectionRetryDelay: 5000,
}

enum ServiceStatus {
  Connected,
  Idle,
  Connecting,
}

export default class RabbitMQService {
  private _options?: InitOptions
  private _channel?: amqp.ConfirmChannel
  private queueRegistry: QueueRegistry = {}
  private connection?: amqp.Connection
  private log: Log
  private assertedQueues: Set<string> = new Set() // Avoid duplicated queues
  private status: ServiceStatus = ServiceStatus.Idle

  constructor(options?: InitOptions) {
    this.log = new Log(true)
    if (options) {
      this.setOptions(options)
    }
  }

  public setOptions(options: InitOptions): void {
    this._options = options
    this.log = new Log(options.log)
  }

  public async sendMessage(
    queue: string,
    msg: any,
    options: SendMessageOptions
  ): Promise<void> {
    await this.assertQueue(queue)
    const emitter = new MessageEmitter(this.channel)
    await emitter.sendMessage(queue, msg, options)
  }

  public registerQueue(queueName: string | string[], cb: (r: any) => Promise<void>): void {

    if (Array.isArray(queueName)) {
      queueName.forEach((val) => this.registerSingleQueue(val, cb))
    } else {
      this.registerSingleQueue(queueName, cb)
    }
  }

  public async connect(): Promise<void> {
    this.disconnect()
    this.status = ServiceStatus.Connecting
    let retries = 0

    while (this.shouldRetryConnection(retries)) {
      retries++
      try {
        this.log.log('[RabbitMQ] Connecting')
        this.connection = await amqp.connect(this.url)
        this._channel = await this.connection.createConfirmChannel()
        await this.channel.prefetch(this.options.messageConcurrency) // Number of messages to fetch simultaneously
        this.connection.on('close', () => {
          this.connection = undefined
          this._channel = undefined
          // Unexpected close
          if (this.status === ServiceStatus.Connected) {
            this.log.warn('[RabbitMQ] Unexpected Close')
            this.connect()
          }
        })
        await Promise.all(
          Object.keys(this.queueRegistry).map(queue => {
            return this.consumeQueue(queue)
          })
        )

        this.status = ServiceStatus.Connected
        this.log.log('[RabbitMQ] Connected')
      } catch (err) {
        this.log.warn('[RabbitMQ] Error Connecting', err.message)
        if (!this.shouldRetryConnection(retries)) {
          throw new Error(
            `[RabbitMQ] Max Reconnection attemps [${retries}] - will not try to connect anymore.`
          )
        }
        await wait(this.connectionDelay)
      }
    }
  }

  public async disconnect(): Promise<void> {
    this.status = ServiceStatus.Idle
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

  private get options(): ServiceOptions {
    if (!this._options) {
      throw new Error('[RabbitMQService] Options not initialized')
    }
    return Object.assign({}, DEFAULT_OPTIONS, this._options)
  }

  private get url(): string {
    return `amqp://${this.options.user}:${this.options.password}@${this.options.url}`
  }

  private get channel(): amqp.ConfirmChannel {
    if (!this._channel) {
      throw new Error('[RabbitMQ] Not Connected')
    } else {
      return this._channel
    }
  }

  private get connectionDelay(): number {
    const defaultConnectionDelay = 5000
    const delay = this.options.connectionRetryDelay
    return delay === undefined ? defaultConnectionDelay : delay
  }

  private shouldRetryConnection(retries: number): boolean {
    if (this.options.maxConnectionAttempts) {
      if (retries >= this.options.maxConnectionAttempts) {
        return false
      }
    }
    return this.status === ServiceStatus.Connecting
  }

  private async consumeQueue(queueName: string): Promise<void> {
    const queueData = this.queueRegistry[queueName]
    if (this._channel && !queueData.connected) {
      queueData.connected = true
      await this.assertQueue(queueName)
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
              this.retryErroredMessageIfNeeded(msg)
            }
          }
        },
        { noAck: false }
      )
    }
  }

  private retryErroredMessageIfNeeded(msg: any): void {
    if (this.channel) {
      const shouldRetry = this.options.retry && !msg.fields.redelivered
      if (shouldRetry) {
        this.channel.nack(msg, false, true)
      } else {
        this.channel.nack(msg, false, false)
      }
    }
  }

  private async assertQueue(queueName: string): Promise<void> {
    const queueAlreadyExists = this.assertedQueues.has(queueName)
    if (!queueAlreadyExists) {
      await this.channel.assertQueue(queueName, {
        durable: true,
        maxPriority: 10,
      }) // Creates the queue if doesn't exists
      this.assertedQueues.add(queueName)
    }
  }

  private registerSingleQueue(queueName: string, cb: (r: any) => Promise<void>): void {
    if (this.queueRegistry[queueName]) {
      throw new Error(`[RabbitMQService] queue ${queueName} already registered`)
    }
    this.queueRegistry[queueName] = {
      cb,
      connected: false,
    }
    this.consumeQueue(queueName)
  }
}
