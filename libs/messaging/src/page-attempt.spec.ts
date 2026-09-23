import { createPageAttempt } from './page-attempt'

it('retains the same scheduled instant and payload during a manual retry', () => {
  const attempt = createPageAttempt(
    { teamId: 'team', source: 'filming', message: 'Visit the pit', minutes: 10 },
    'command',
    Date.parse('2026-09-22T12:00:00Z'),
  )
  expect(attempt).toEqual({
    key: 'command',
    createdAt: Date.parse('2026-09-22T12:00:00Z'),
    body: {
      teamId: 'team',
      sourceArea: 'filming',
      message: 'Visit the pit',
      scheduledFor: '2026-09-22T12:10:00.000Z',
    },
  })
  expect(
    createPageAttempt(
      { teamId: 'team', source: 'filming', message: 'Now', minutes: 0 },
      'other',
    ).body,
  ).not.toHaveProperty('scheduledFor')
})
