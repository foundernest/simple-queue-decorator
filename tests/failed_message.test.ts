import { sendMessage, OnQueue, init, close } from '..'

import Config from './config'
import { EventEmitter } from 'events'
import assert = require('assert')

class BadWolpertingerTest {
  public static events: EventEmitter = new EventEmitter()

  @OnQueue('wolpertinger-bad-test-queue')
  public static async onMessageTest(msg: any): Promise<void> {
    this.events.emit('msg', msg)
    return Promise.reject()
  }

  public static waitForNextMessage(): Promise<any> {
    return new Promise((resolve) => {
      this.events.once('msg', (msg) => {
        resolve(msg)
      })
    })
  }
}

describe('Failed Messages', () => {
  afterEach(async () => {
    await close()
  })

  it('Retry Failed Message Once', async () => {
    await init(Config)

    sendMessage('wolpertinger-bad-test-queue', { test: 'Bad1' })
    const msg1 = await BadWolpertingerTest.waitForNextMessage()
    assert.strictEqual(msg1.test, 'Bad1')
    const msg2 = await BadWolpertingerTest.waitForNextMessage()
    assert.strictEqual(msg2.test, 'Bad1')

    return new Promise(async (resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, 500)
      BadWolpertingerTest.waitForNextMessage().then(() => {
        reject(new Error('No more messages Expected'))
      })
    })
  })

  it('Disable Retry Message', async () => {
    await init({ ...Config, retry: false })
    sendMessage('wolpertinger-bad-test-queue', { test: 'Bad1' })
    const msg1 = await BadWolpertingerTest.waitForNextMessage()
    assert.strictEqual(msg1.test, 'Bad1')

    return new Promise(async (resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, 500)
      BadWolpertingerTest.waitForNextMessage().then(() => {
        reject(new Error('No more messages Expected'))
      })
    })
  })
})
