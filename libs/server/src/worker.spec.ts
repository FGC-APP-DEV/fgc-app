import express from 'express'
import request from 'supertest'
import { createWorkerRouter } from './worker'

it('does no work without the scheduler credential', async () => {
  const rpc = jest.fn()
  const app = express().use(createWorkerRouter({ rpc }, 's'.repeat(32)))
  expect((await request(app).post('/tick')).status).toBe(403)
  expect(rpc).not.toHaveBeenCalled()
})
it('cleans expired secrets, skips revoked delivery and sends only generic authorized content', async () => {
  const rpc = jest.fn(async (name: string, args?: Record<string, unknown>) => {
    if (name === 'delivery_claim') return ['revoked', 'allowed']
    if (name === 'delivery_authorize')
      return args?.p_id === 'allowed'
        ? {
            deliveryId: 'delivery',
            attempt: 2,
            token: 'ExponentPushToken[synthetic]',
            title: 'Private team',
            body: 'Private observation',
          }
        : null
    return null
  })
  const fetcher = jest.fn(
    async () =>
      new Response(
        JSON.stringify({
          data: { status: 'error', details: { error: 'DeviceNotRegistered' } },
        }),
        { status: 200 },
      ),
  )
  const app = express().use(createWorkerRouter({ rpc }, 's'.repeat(32), fetcher))
  expect(
    (
      await request(app)
        .post('/tick')
        .set('Authorization', 'Bearer ' + 's'.repeat(32))
    ).status,
  ).toBe(200)
  expect(rpc).toHaveBeenCalledWith('staff_auth_cleanup')
  expect(fetcher).toHaveBeenCalledTimes(1)
  expect(fetcher).toHaveBeenCalledWith(
    'https://exp.host/--/api/v2/push/send',
    expect.objectContaining({
      body: JSON.stringify({
        to: 'ExponentPushToken[synthetic]',
        title: 'FGC',
        body: 'You have a new message.',
        sound: 'default',
        data: { deliveryId: 'delivery' },
        channelId: 'pager',
      }),
    }),
  )
  expect(rpc).toHaveBeenCalledWith('delivery_finish', {
    p_id: 'allowed',
    p_attempt: 2,
    p_accepted: false,
    p_invalid_token: true,
  })
})
