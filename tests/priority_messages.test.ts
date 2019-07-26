import {
  sendMessage,
  initService,
  closeService,
  registerQueue,
  MessagePriority,
} from '..'

import Config from './config'
import assert = require('assert')

describe('Send And Received Queue Messages', () => {
  before(async () => {
    await initService(Config)
  })

  after(async () => {
    await closeService()
  })

  it('Priority Queue', done => {
    sendMessage(
      'priority-test-queue',
      { content: 'msg1' },
      {
        priority: MessagePriority.LOW,
      }
    )
    sendMessage(
      'priority-test-queue',
      { content: 'msg2' },
      {
        priority: MessagePriority.LOW,
      }
    )
    sendMessage(
      'priority-test-queue',
      { content: 'msg3' },
      {
        priority: MessagePriority.HIGH,
      }
    )

    const receivedMessages: Array<{ content: string }> = []
    registerQueue('priority-test-queue', msg => {
      receivedMessages.push(msg)
      if (receivedMessages.length === 3) {
        assert.strictEqual(receivedMessages[0].content, 'msg3')
        assert.strictEqual(receivedMessages[1].content, 'msg1')
        assert.strictEqual(receivedMessages[2].content, 'msg2')
        done()
      }
      return Promise.resolve()
    })
  })
})
