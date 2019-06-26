import RabbitMQService from './src/service'
import { AppOptions } from './src/types'

const rabbitService = new RabbitMQService()

type DecoratorFunction = (
  target: any,
  propertyKey: string,
  propertyDescriptor: PropertyDescriptor
) => void

export async function initService(options: AppOptions): Promise<void> {
  rabbitService.setOptions(options)
  await rabbitService.connect()
}

export function sendMessage(queue: string, msg: any): Promise<void> {
  return rabbitService.sendMessage(queue, msg)
}

export function closeService(): Promise<void> {
  return rabbitService.disconnect()
}

export function registerQueue(
  queueName: string,
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
