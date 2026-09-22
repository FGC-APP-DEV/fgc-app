import { ApiError, type ApiClient } from '@fgc/api-client'
import type { Observation, Panel, Participation, User } from '@fgc/contracts'

export function judgingAccess(user: User, panel: Panel | undefined, team: Participation) {
  const allowed = !user.roles.includes('admin')
  const advisor = allowed && user.roles.includes('judgeAdvisor')
  const member =
    allowed && user.roles.includes('judge') && Boolean(panel?.judgeIds.includes(user.id))
  const leader = member && panel?.leaderId === user.id
  const writable =
    team.participationStatus === 'active' && team.evaluationStatus === 'pending'
  return {
    advisor,
    member,
    leader,
    observe: member && writable,
    complete: leader && writable,
    reopen: (leader || advisor) && team.evaluationStatus === 'evaluated',
    removable: advisor && writable && !team.hasHistory,
  }
}
export function progress(teams: readonly Participation[]) {
  const active = teams.filter((t) => t.participationStatus === 'active')
  return {
    evaluated: active.filter((t) => t.evaluationStatus === 'evaluated').length,
    active: active.length,
    withdrawn: teams.length - active.length,
  }
}
/** Memory-only draft and immutable retry payload: edits are never queued or auto-replayed. */
export class ObservationDraft {
  text: string
  saved: string
  version: number
  error = ''
  conflict = false
  busy = false
  private pending?: { key: string; text: string; version: number }
  constructor(observation?: Observation) {
    this.text = observation?.text ?? ''
    this.saved = this.text
    this.version = observation?.version ?? 0
  }
  get dirty() {
    return this.text !== this.saved
  }
  edit(text: string) {
    this.text = text
  }
  async save(
    api: Pick<ApiClient, 'command' | 'newKey'>,
    teamId: string,
    panelId: string,
  ): Promise<boolean> {
    if (this.busy || this.conflict || !this.text.trim()) return false
    this.busy = true
    this.error = ''
    // Keep the exact failed command until its outcome is reconciled, even if user edits more.
    this.pending ??= { key: api.newKey(), text: this.text, version: this.version }
    const pending = this.pending
    try {
      const receipt = await api.command(
        `/judging/teams/${teamId}/observation`,
        { panelId, text: pending.text, expectedVersion: pending.version },
        { method: 'PUT', key: pending.key },
      )
      this.saved = pending.text
      this.version = receipt.resultingVersion
      this.pending = undefined
      return true
    } catch (error) {
      this.conflict =
        error instanceof ApiError &&
        [
          'VERSION_CONFLICT',
          'STATE_CONFLICT',
          'FORBIDDEN',
          'NOT_FOUND',
          'IDEMPOTENCY_EXPIRED',
        ].includes(error.code)
      this.error = this.conflict
        ? 'This team or observation changed. Your draft is retained. Review the current record before saving again.'
        : 'Save was not confirmed. Your draft is retained. Retry manually to confirm the previous save.'
      return false
    } finally {
      this.busy = false
    }
  }
  reconcile(current?: Observation) {
    this.saved = current?.text ?? ''
    this.version = current?.version ?? 0
    this.pending = undefined
    this.conflict = false
    this.error = ''
  }
  discard() {
    this.text = this.saved
    this.error = ''
    this.pending = undefined
    this.conflict = false
  }
}
