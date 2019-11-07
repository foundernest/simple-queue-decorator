import {
  sendMessage,
  OnQueue,
  init,
  close,
  registerQueue,
} from '..'

import Config from './config'
import { EventEmitter } from 'events'
import assert = require('assert')

class WolpertingerTest {
  public static events: EventEmitter = new EventEmitter()

  @OnQueue('wolpertinger-test-queue')
  public static async onMessageTest(msg: any): Promise<void> {
    this.events.emit('msg', msg)
  }

  public static waitForNextMessage(): Promise<any> {
    return new Promise(resolve => {
      this.events.once('msg', msg => {
        resolve(msg)
      })
    })
  }
}

describe('Send And Received Queue Messages', () => {
  before(async () => {
    await init(Config)
  })

  after(async () => {
    await close()
  })

  it('Send Message', async () => {
    sendMessage('wolpertinger-test-queue', { test: 'Hola' })
    const msg = await WolpertingerTest.waitForNextMessage()
    assert.strictEqual(msg.test, 'Hola')
  })

  it('Queue Multiple Messages Before Reading Them', done => {
    for (let i = 0; i < 10; i++) {
      sendMessage('wolpertinger-test-queue-2', { item: i })
    }

    class WolpertingerTest2 {
      @OnQueue('wolpertinger-test-queue-2')
      public static async onMessageTest(_msg: any): Promise<void> {
        this.count++
        if (this.count >= 10) {
          done()
        }
      }
      private static count = 0
    }
  })

  it('Register Queue Without Decorator', async () => {
    const p = new Promise(resolve => {
      function msgCallback(msg: any): Promise<void> {
        assert.strictEqual(msg.test, 'arthur')
        resolve()
        return Promise.resolve()
      }
      registerQueue('no-decorator-queue', msgCallback) // No need for await, so registering is immediate
    })
    await sendMessage('no-decorator-queue', { test: 'arthur' })
    await p
  })

  it('Register Queue Without Decorator (several queues)', async () => {
    let callbackCallCount = 0;
    const p = new Promise(resolve => {
      function msgCallback(msg: any): Promise<void> {
        assert.strictEqual(msg.test, 'arthur')
        callbackCallCount++
        if (callbackCallCount === 2) {
          resolve()
        }
        return Promise.resolve()
      }

      registerQueue([
        'first-no-decorator-queue', 'second-no-decorator-queue'
      ], msgCallback)
    })
    await sendMessage('first-no-decorator-queue', { test: 'arthur' })
    await sendMessage('second-no-decorator-queue', { test: 'arthur' })
    await p
  })
})
