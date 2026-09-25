import * as contract from './index'

describe('REST boundary contracts', () => {
  it('requires an actual leader among panel members', () => {
    const id = '11111111-1111-4111-8111-111111111111'
    expect(
      contract.panelInput.safeParse({ name: 'Panel A', leaderId: id, judgeIds: [] })
        .success,
    ).toBe(false)
    expect(
      contract.panelInput.safeParse({ name: 'Panel A', leaderId: id, judgeIds: [id] })
        .success,
    ).toBe(true)
  })
  it('rejects authority injected into an observation and requires a version', () => {
    const value = {
      panelId: '11111111-1111-4111-8111-111111111111',
      text: 'Useful observation',
      expectedVersion: 0,
    }
    expect(contract.observationInput.safeParse(value).success).toBe(true)
    expect(
      contract.observationInput.safeParse({ ...value, authorId: value.panelId }).success,
    ).toBe(false)
    expect(contract.observationInput.safeParse({ text: 'Note' }).success).toBe(false)
  })
  it('rejects mixed administrative and judging access', () => {
    expect(
      contract.accessInput.safeParse({
        emails: ['admin@example.org'],
        roles: ['admin', 'judge'],
        mode: 'replace',
      }).success,
    ).toBe(false)
  })
  it('allows only approved mentor responses and enforces pager limits', () => {
    expect(
      contract.responseInput.safeParse({ response: 'On our way', expectedVersion: 1 })
        .success,
    ).toBe(true)
    expect(
      contract.responseInput.safeParse({ response: 'Arbitrary text', expectedVersion: 1 })
        .success,
    ).toBe(false)
    expect(
      contract.pageInput.safeParse({
        teamId: '11111111-1111-4111-8111-111111111111',
        sourceArea: 'production',
        message: 'Hello',
      }).success,
    ).toBe(false)
  })
  it('never grants admin judging capabilities even with corrupt mixed roles', () => {
    expect(contract.capabilities(['admin', 'judge', 'judgeAdvisor']).judging).toBe(false)
    expect(contract.capabilities(['judge']).judging).toBe(true)
    expect(contract.capabilities([]).schedule).toBe(false)
  })
})
