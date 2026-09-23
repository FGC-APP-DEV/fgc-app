import request from 'supertest'
import * as server from './http'

const id = '11111111-1111-4111-8111-111111111111'
function setup(roles = ['judge']) {
  const rpc = jest.fn(async (name: string) =>
    name === 'me'
      ? { id, roles, email: 'test@example.org', name: 'Test', version: 1 }
      : [],
  )
  const gateway = {
    staff: () => ({ rpc }),
    service: { rpc },
    verify: async () => ({ id }),
    ready: async () => true,
  }
  return {
    rpc,
    app: server.createApi({
      gateway,
      allowedOrigins: ['http://localhost:3000'],
      mentorSecret: 'test-secret-with-enough-entropy',
      development: true,
    }),
  }
}
it('denies unauthenticated reads and exposes no GraphQL demo login', async () => {
  const { app } = setup()
  expect((await request(app).get('/api/v1/teams')).status).toBe(401)
  expect(
    (await request(app).post('/graphql').send({ query: 'mutation { login }' })).status,
  ).toBe(404)
})
it('denies admin judging even when judgeAdvisor is also present', async () => {
  const { app, rpc } = setup(['admin', 'judgeAdvisor'])
  const result = await request(app)
    .get('/api/v1/judging/panels')
    .set('Authorization', 'Bearer verified')
  expect(result.status).toBe(403)
  expect(rpc.mock.calls.map((c) => c[0])).not.toContain('panels_list')
})
it('rejects author injection before calling the mutation', async () => {
  const { app, rpc } = setup()
  const result = await request(app)
    .put(`/api/v1/judging/teams/${id}/observation`)
    .set('Authorization', 'Bearer verified')
    .set('Idempotency-Key', id)
    .send({ authorId: id, panelId: id, text: 'Observation', expectedVersion: 0 })
  expect(result.status).toBe(400)
  expect(rpc.mock.calls.map((c) => c[0])).not.toContain('observation_put')
})
it('requires UUID idempotency keys and makes a metadata envelope', async () => {
  const { app } = setup(['filmmaker'])
  expect(
    (
      await request(app)
        .post('/api/v1/filming/categories')
        .set('Authorization', 'Bearer verified')
        .send({ name: 'Event' })
    ).status,
  ).toBe(400)
  const result = await request(app)
    .get('/api/v1/filming/categories')
    .set('Authorization', 'Bearer verified')
  expect(result.status).toBe(200)
  expect(result.body.meta.requestId).toEqual(expect.any(String))
})

it('allows same-origin mentor CSRF bootstrap, but rejects foreign and unproven origins', async () => {
  const { app } = setup()
  const cookie = 'fgc_mentor=' + 'a'.repeat(64)
  const allowed = await request(app)
    .get('/api/v1/mentor/csrf')
    .set('Cookie', cookie)
    .set('Sec-Fetch-Site', 'same-origin')
    .set('Referer', 'http://localhost:3000/')
  expect(allowed.status).toBe(200)
  expect(allowed.body.data.csrfToken).toMatch(/^[a-f0-9]{64}$/)
  expect(
    (await request(app).get('/api/v1/mentor/csrf').set('Cookie', cookie)).status,
  ).toBe(403)
  expect(
    (
      await request(app)
        .get('/api/v1/mentor/csrf')
        .set('Cookie', cookie)
        .set('Sec-Fetch-Site', 'same-origin')
        .set('Referer', 'https://example.org/')
    ).status,
  ).toBe(403)
})
