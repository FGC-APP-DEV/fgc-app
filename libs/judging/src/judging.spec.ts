import { ApiClient } from '@fgc/api-client'
import type { Observation, Panel, Participation, Receipt, User } from '@fgc/contracts'
import { judgingAccess, ObservationDraft, progress } from './judging-state'

const user: User = {
  id: 'judge',
  email: 'judge@example.test',
  name: 'Judge',
  roles: ['judge'],
  version: 1,
}
const panel: Panel = {
  id: 'panel',
  name: 'Panel',
  leaderId: 'judge',
  judgeIds: ['judge'],
  version: 1,
}
const team: Participation = {
  id: 'participation',
  teamId: 'team',
  panelId: 'panel',
  evaluationStatus: 'pending',
  participationStatus: 'active',
  hasHistory: false,
  version: 1,
  flags: [],
  team: {
    id: 'team',
    officialId: '001',
    name: 'Team',
    country: 'Country',
    countryCode: 'XX',
    version: 1,
  },
}
const observation: Observation = {
  id: 'observation',
  authorId: 'judge',
  authorName: 'Judge',
  panelId: 'panel',
  teamId: 'team',
  text: 'Original',
  version: 2,
  updatedAt: '2026-09-22T00:00:00Z',
}
const receipt: Receipt = {
  commandId: 'command',
  entityId: 'observation',
  resultingVersion: 3,
  outcome: 'updated',
  committedAt: '2026-09-22T00:00:00Z',
}
test('admin plus judge never grants observing or leadership; advisor alone cannot observe', () => {
  expect(
    judgingAccess({ ...user, roles: ['admin', 'judge', 'judgeAdvisor'] }, panel, team),
  ).toEqual({
    advisor: false,
    member: false,
    leader: false,
    observe: false,
    complete: false,
    reopen: false,
    removable: false,
  })
  expect(judgingAccess({ ...user, roles: ['judgeAdvisor'] }, panel, team).observe).toBe(
    false,
  )
})
test('current membership, active pending state and leadership determine actions', () => {
  expect(judgingAccess(user, panel, team).complete).toBe(true)
  expect(judgingAccess(user, { ...panel, judgeIds: [] }, team).observe).toBe(false)
  expect(
    judgingAccess(user, panel, { ...team, participationStatus: 'withdrawn' }).observe,
  ).toBe(false)
  expect(
    judgingAccess(user, panel, { ...team, evaluationStatus: 'evaluated' }).observe,
  ).toBe(false)
  expect(
    judgingAccess(user, panel, { ...team, evaluationStatus: 'evaluated' }).reopen,
  ).toBe(true)
})
test('history prevents removal even after reopening and withdrawn teams stay outside progress', () => {
  expect(
    judgingAccess({ ...user, roles: ['judgeAdvisor'] }, panel, {
      ...team,
      hasHistory: true,
    }).removable,
  ).toBe(false)
  expect(progress([])).toEqual({ evaluated: 0, active: 0, withdrawn: 0 })
  expect(
    progress([
      team,
      { ...team, evaluationStatus: 'evaluated' },
      { ...team, evaluationStatus: 'evaluated', participationStatus: 'withdrawn' },
    ]),
  ).toEqual({ evaluated: 1, active: 2, withdrawn: 1 })
})
test('failed save retains draft and retries exact immutable command with same key', async () => {
  const requests: RequestInit[] = []
  let failure = true
  const api = new ApiClient({
    baseUrl: 'https://example.test',
    getAuthorization: () => undefined,
    createId: () => 'fixed-key',
    fetcher: async (_, init) => {
      requests.push(init ?? {})
      if (failure) throw new Error('offline')
      return new Response(
        JSON.stringify({ data: receipt, meta: { requestId: 'request' } }),
      )
    },
  })
  const draft = new ObservationDraft(observation)
  draft.edit('First edit')
  expect(await draft.save(api, 'team', 'panel')).toBe(false)
  expect(draft.text).toBe('First edit')
  expect(draft.dirty).toBe(true)
  draft.edit('Further edit while offline')
  failure = false
  expect(await draft.save(api, 'team', 'panel')).toBe(true)
  expect(requests[0].body).toBe(requests[1].body)
  expect(new Headers(requests[1].headers).get('Idempotency-Key')).toBe('fixed-key')
  expect(draft.saved).toBe('First edit')
  expect(draft.text).toBe('Further edit while offline')
  expect(draft.dirty).toBe(true)
})
test('version conflict keeps draft and blocks overwrite until explicit review', async () => {
  const api = new ApiClient({
    baseUrl: 'https://example.test',
    getAuthorization: () => undefined,
    createId: () => 'key',
    fetcher: async () =>
      new Response(
        JSON.stringify({
          error: { code: 'VERSION_CONFLICT', message: 'Changed' },
          requestId: 'request',
        }),
        { status: 409 },
      ),
  })
  const command = jest.spyOn(api, 'command')
  const draft = new ObservationDraft(observation)
  draft.edit('My draft')
  expect(await draft.save(api, 'team', 'panel')).toBe(false)
  expect(draft.conflict).toBe(true)
  await draft.save(api, 'team', 'panel')
  expect(command).toHaveBeenCalledTimes(1)
  draft.reconcile({ ...observation, text: 'Another edit', version: 4 })
  expect(draft.text).toBe('My draft')
  expect(draft.version).toBe(4)
  expect(draft.conflict).toBe(false)
})
test('save in flight cannot submit a duplicate and does not discard subsequent edits', async () => {
  let complete: (response: Response) => void = () => undefined
  const api = new ApiClient({
    baseUrl: 'https://example.test',
    getAuthorization: () => undefined,
    createId: () => 'key',
    fetcher: async () =>
      new Promise<Response>((resolve) => {
        complete = resolve
      }),
  })
  const draft = new ObservationDraft(observation)
  draft.edit('One')
  const pending = draft.save(api, 'team', 'panel')
  expect(draft.busy).toBe(true)
  expect(await draft.save(api, 'team', 'panel')).toBe(false)
  draft.edit('Two')
  complete(
    new Response(JSON.stringify({ data: receipt, meta: { requestId: 'request' } })),
  )
  await pending
  expect(draft.text).toBe('Two')
  expect(draft.saved).toBe('One')
  expect(draft.dirty).toBe(true)
})
test('discard restores saved content; an empty draft cannot issue a save', async () => {
  const draft = new ObservationDraft(observation)
  draft.edit('Changed')
  draft.discard()
  expect(draft.text).toBe('Original')
  expect(draft.dirty).toBe(false)
  const api = new ApiClient({
    baseUrl: 'https://example.test',
    getAuthorization: () => undefined,
  })
  const command = jest.spyOn(api, 'command')
  draft.edit('   ')
  expect(await draft.save(api, 'team', 'panel')).toBe(false)
  expect(command).not.toHaveBeenCalled()
})
