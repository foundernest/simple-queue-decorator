import RabbitMQService from './src/service'
import { InitOptions, SendMessageOptions } from './src/types'

const rabbitService = new RabbitMQService()

type DecoratorFunction = (
  target: any,
  propertyKey: string,
  propertyDescriptor: PropertyDescriptor
) => void

export async function initService(options: InitOptions): Promise<void> {
  rabbitService.setOptions(options)
  await rabbitService.connect()
}

export function sendMessage(
  queue: string,
  msg: any,
  options: SendMessageOptions = {}
): Promise<void> {
  return rabbitService.sendMessage(queue, msg, options)
}

export function closeService(): Promise<void> {
  return rabbitService.disconnect()
}

export function registerQueue(
  queueName: string | string[],
  cb: (r: any) => Promise<void>
): void {
  rabbitService.registerQueue(queueName, cb)
}

export function OnQueue(queueName: string): DecoratorFunction {
  return (
    target: any,
    _propertyKey: string,
    propertyDescriptor: PropertyDescriptor
  ): void => {
    rabbitService.registerQueue(
      queueName,
      propertyDescriptor.value.bind(target)
    )
  }
}

export enum MessagePriority {
  LOW = 2,
  MEDIUM = 4,
  HIGH = 7,
}
