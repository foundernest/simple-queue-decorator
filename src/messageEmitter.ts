import { SendMessageOptions } from './types'
import { ConfirmChannel } from 'amqplib'

export default class MessageEmitter {
  private channel: ConfirmChannel

  constructor(channel: ConfirmChannel) {
    this.channel = channel
  }

  public sendMessage(
    queue: string,
    msg: any,
    options: SendMessageOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(msg)),
        {
          persistent: true,
          priority: options.priority,
        },
        (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })
  }
}
