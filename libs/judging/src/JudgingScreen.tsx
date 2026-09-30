import { sortTeams } from '@fgc/shared'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { useAuth } from '@fgc/auth'
import type { Observation, Panel, Participation, Team, Receipt } from '@fgc/contracts'
import {
  Badge,
  Body,
  Button,
  Card,
  Confirm,
  Field,
  Heading,
  Loading,
  Notice,
  ProgressBar,
  Screen,
  layout,
} from '@fgc/ui'
import { ObservationEditor } from './ObservationEditor'
import { judgingAccess, progress } from './judging-state'
import { JudgesSheet } from './JudgesSheet'
import { PanelsDashboard } from './PanelsDashboard'
import {
  conflictsWithTeam,
  distributeJudges,
  panelsForTeam,
  judgeConflictsWithPanel,
  panelCountries,
} from './panel-planning'

interface Judge {
  id: string
  name: string | null
  email: string
  panelId: string | null
  version: number
  conflict: string[]
  conflictVersion: number
}
interface Cycle {
  id: string
  version: number
  state: string
}
interface Audit {
  cycles: { id: string; closed_at: string; purge_due_at: string }[]
  observations: { id: string; notes: string; team_id: string; author_id: string }[]
  entries: { id: string; operation?: string; created_at?: string }[]
}
const teamAccent = (t: Participation) =>
  t.participationStatus === 'withdrawn'
    ? 'danger'
    : t.evaluationStatus === 'evaluated'
      ? 'success'
      : t.flags.length
        ? 'warning'
        : 'neutral'
interface Confirmation {
  title: string
  description: string
  work(): Promise<void>
}

export function JudgingScreen({
  onPage,
  onDirtyChange,
}: {
  onPage(teamId?: string): void
  onDirtyChange?(dirty: boolean): void
}) {
  const { api, user } = useAuth()
  const advisor = Boolean(
    user && !user.roles.includes('admin') && user.roles.includes('judgeAdvisor'),
  )
  const [panels, setPanels] = useState<Panel[]>([])
  const [teams, setTeams] = useState<Participation[]>([])
  const [judges, setJudges] = useState<Judge[]>([])
  const [globalTeams, setGlobalTeams] = useState<Team[]>([])
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<'teams' | 'panels' | 'judges' | 'closure'>('teams')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [observations, setObservations] = useState<Observation[]>([])
  const [observationLoaded, setObservationLoaded] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [reason, setReason] = useState('')
  const [panelId, setPanelId] = useState('')
  const [panelName, setPanelName] = useState('')
  const [panelMode, setPanelMode] = useState<'dashboard' | 'manage'>('dashboard')
  const [panelCount, setPanelCount] = useState('4')
  const [planNotice, setPlanNotice] = useState('')
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [leaderId, setLeaderId] = useState('')
  const [transferJudge, setTransferJudge] = useState('')
  const [targetId, setTargetId] = useState('')
  const [audit, setAudit] = useState<Audit | null>(null)
  const selectedRef = useRef(selected)
  selectedRef.current = selected
  const reportDirty = useCallback(
    (value: boolean) => {
      setDirty(value)
      onDirtyChange?.(value)
    },
    [onDirtyChange],
  )
  const load = useCallback(async () => {
    setError('')
    try {
      const [nextPanels, nextTeams, nextCycle] = await Promise.all([
        api.list<Panel>('/judging/panels'),
        api.list<Participation>('/judging/teams'),
        api.get<Cycle | null>('/judging/cycle'),
      ])
      setPanels(nextPanels)
      setTeams(sortTeams(nextTeams, (t) => t.team))
      setCycle(nextCycle)
      if (advisor) {
        const [nextJudges, allTeams] = await Promise.all([
          api.list<Judge>('/judging/judges'),
          api.list<Team>('/teams'),
        ])
        setJudges(nextJudges)
        setGlobalTeams(allTeams)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Judging could not be loaded. Try again.')
    } finally {
      setLoaded(true)
    }
  }, [api, advisor])
  useEffect(() => {
    void load()
  }, [load])
  const loadObservations = useCallback(async () => {
    if (!selected) return
    const next = await api.get<Observation[]>(`/judging/teams/${selected}/observations`)
    if (selectedRef.current === selected) {
      setObservations(next)
      setObservationLoaded(true)
    }
  }, [api, selected])
  useEffect(() => {
    setObservations([])
    setObservationLoaded(false)
    if (selected)
      void loadObservations().catch((e) =>
        setError(e instanceof Error ? e.message : 'Observations could not be loaded.'),
      )
  }, [selected, loadObservations])
  useEffect(() => {
    if (!audit?.cycles.length) return
    const deadline = Math.min(...audit.cycles.map((c) => Date.parse(c.purge_due_at)))
    if (!Number.isFinite(deadline)) {
      setAudit(null)
      return
    }
    const timer = setTimeout(() => setAudit(null), Math.max(0, deadline - Date.now()))
    return () => clearTimeout(timer)
  }, [audit])
  const run = async (work: () => Promise<unknown>) => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await work()
      await load()
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'The change was not confirmed. Refresh and review before retrying.',
      )
    } finally {
      setBusy(false)
    }
  }
  const navigate = (work: () => void) => {
    if (dirty)
      setConfirmation({
        title: 'Leave unsaved observation?',
        description: 'Discard the unsaved text and continue, or cancel to keep editing.',
        work: async () => {
          reportDirty(false)
          work()
        },
      })
    else work()
  }
  const current = teams.find((t) => t.teamId === selected)
  const currentPanel = panels.find((p) => p.id === current?.panelId)
  const access = user && current ? judgingAccess(user, currentPanel, current) : null
  const summary = progress(teams)
  const editingPanel = panels.find((p) => p.id === panelId)
  const commandTeam = (
    suffix: string,
    body: Record<string, unknown> = {},
    method: 'POST' | 'PUT' | 'DELETE' = 'POST',
  ) =>
    current
      ? api.command(
          `/judging/teams/${current.teamId}/${suffix}`,
          { expectedVersion: current.version, ...body },
          { method },
        )
      : Promise.resolve()
  const confirmTeam = (
    title: string,
    suffix: string,
    body: Record<string, unknown> = {},
  ) =>
    setConfirmation({
      title,
      description: `Apply this change to ${current?.team.name}?`,
      work: async () => {
        await commandTeam(suffix, body)
      },
    })
  const judgeName = (id: string) => {
    const j = judges.find((x) => x.id === id)
    return j ? (j.name ?? j.email) : 'Unknown judge'
  }
  const unassignedTeams = teams.filter(
    (t) => !t.panelId && t.participationStatus === 'active',
  )
  const notIncluded = globalTeams.filter((t) => !teams.some((p) => p.teamId === t.id))
  const createPanels = async () => {
    const wanted = Math.max(1, Math.min(30, Number.parseInt(panelCount, 10) || 0))
    const taken = new Set(panels.map((p) => p.name))
    let n = panels.length
    for (let made = 0; made < wanted; made += 1) {
      do n += 1
      while (taken.has(`Panel ${n}`))
      taken.add(`Panel ${n}`)
      await api.command('/judging/panels', { name: `Panel ${n}`, judgeIds: [] })
    }
  }
  const includeAllTeams = async () => {
    for (const t of notIncluded)
      await api.command('/judging/participations', { teamId: t.id })
  }
  const divideTeams = async () => {
    const versions = new Map(panels.map((p) => [p.id, p.version]))
    const sizes = new Map(
      panels.map((p) => [p.id, teams.filter((t) => t.panelId === p.id).length]),
    )
    const stuck: string[] = []
    setPlanNotice('')
    for (const t of unassignedTeams) {
      // Same predicate as manual assignment: no judge on the panel may conflict.
      const target = panelsForTeam(t, panels, judges).sort(
        (a, b) => (sizes.get(a.id) ?? 0) - (sizes.get(b.id) ?? 0),
      )[0]
      if (!target) {
        stuck.push(`${t.team.officialId} ${t.team.name}`)
        continue
      }
      const receipt = await api.command<Receipt>(`/judging/panels/${target.id}/teams`, {
        teamId: t.teamId,
        expectedVersion: versions.get(target.id),
      })
      versions.set(target.id, receipt.resultingVersion)
      sizes.set(target.id, (sizes.get(target.id) ?? 0) + 1)
    }
    if (stuck.length)
      setPlanNotice(
        `No eligible panel (judge conflict) for ${stuck.length} team(s): ${stuck.join(', ')}. Assign them manually.`,
      )
  }
  const planJudges = () => {
    const plan = distributeJudges(judges, panels, teams)
    const changed = panels.filter((p) => {
      const next = plan.assignments[p.id] ?? []
      return (
        next.length !== p.judgeIds.length || next.some((id) => !p.judgeIds.includes(id))
      )
    })
    setConfirmation({
      title: 'Distribute judges across panels?',
      description: `${judges.length} judges are spread evenly over ${panels.length} panels, avoiding conflicts of interest. Panel leaders stay in place; other members may move.${
        plan.unplaced.length
          ? ` Left unassigned because of conflicts: ${plan.unplaced.map(judgeName).join(', ')}.`
          : ''
      }`,
      work: async () => {
        const versions = new Map(panels.map((p) => [p.id, p.version]))
        const send = async (p: Panel, judgeIds: string[]) => {
          const receipt = await api.command<Receipt>(`/judging/panels/${p.id}/members`, {
            expectedVersion: versions.get(p.id),
            judgeIds,
          })
          versions.set(p.id, receipt.resultingVersion)
        }
        // Free judges that leave a panel first: a judge can only sit on one panel.
        for (const p of changed) {
          const next = plan.assignments[p.id] ?? []
          const kept = p.judgeIds.filter((id) => next.includes(id))
          if (kept.length !== p.judgeIds.length) await send(p, kept)
        }
        for (const p of changed) {
          const next = plan.assignments[p.id] ?? []
          const kept = p.judgeIds.filter((id) => next.includes(id))
          if (next.length && next.length !== kept.length) await send(p, next)
        }
      },
    })
  }
  const openPanel = (panel?: Panel) => {
    choosePanel(panel)
    setPanelMode('manage')
  }
  const choosePanel = (panel?: Panel) => {
    setPanelId(panel?.id ?? '')
    setPanelName(panel?.name ?? '')
    setMemberIds(panel?.judgeIds ?? [])
    setLeaderId(panel?.leaderId ?? '')
    setTargetId('')
    setTransferJudge('')
  }
  if (!user || user.roles.includes('admin') || !(user.roles.includes('judge') || advisor))
    return (
      <Screen>
        <Notice error text="You do not have access to Judging." />
      </Screen>
    )
  return (
    <Screen>
      <Heading>Judging</Heading>
      <Body>Panel coordination and shared observations.</Body>
      <View style={layout.row}>
        <Button
          label="Teams"
          variant={tab === 'teams' ? 'primary' : 'secondary'}
          onPress={() =>
            navigate(() => {
              setSelected(null)
              setTab('teams')
            })
          }
        />
        {advisor && (
          <>
            <Button
              label="Panels"
              variant={tab === 'panels' ? 'primary' : 'secondary'}
              onPress={() =>
                navigate(() => {
                  setSelected(null)
                  setPanelMode('dashboard')
                  setTab('panels')
                })
              }
            />
            <Button
              label="Judges"
              variant={tab === 'judges' ? 'primary' : 'secondary'}
              onPress={() =>
                navigate(() => {
                  setSelected(null)
                  setTab('judges')
                })
              }
            />
            <Button
              label="Close & audit"
              variant={tab === 'closure' ? 'primary' : 'secondary'}
              onPress={() =>
                navigate(() => {
                  setSelected(null)
                  setTab('closure')
                })
              }
            />
          </>
        )}
        <Button
          label="Team pager"
          variant="secondary"
          icon="send"
          disabled={busy}
          onPress={() => navigate(() => onPage())}
        />
        <Button
          label="Refresh judging"
          variant="secondary"
          disabled={busy}
          onPress={() => {
            void load()
            if (selected)
              void loadObservations().catch(() =>
                setError('Could not refresh observations.'),
              )
          }}
        />
      </View>
      {Boolean(error) && <Notice error text={error} />}
      {Boolean(planNotice) && tab === 'panels' && <Notice text={planNotice} />}
      {!loaded && <Loading />}
      {loaded && !cycle && (
        <Notice text="There is no active judging cycle. Operational records are unavailable; advisors can review the temporary audit before its expiry." />
      )}
      {tab === 'teams' && (
        <>
          <Card title="Progress">
            <Body>
              {summary.evaluated} of {summary.active} active teams evaluated
            </Body>
            <ProgressBar
              value={summary.evaluated}
              max={summary.active}
              label="Teams evaluated"
            />
            <Body>{summary.withdrawn} withdrawn</Body>
          </Card>
          <Field
            label="Search judging teams"
            icon="search"
            value={search}
            onChangeText={setSearch}
          />
          {!selected &&
            teams
              .filter((t) =>
                `${t.team.name} ${t.team.officialId} ${t.team.country}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((t) => (
                <Card
                  key={t.id}
                  title={`${t.team.officialId} · ${t.team.name}`}
                  accent={teamAccent(t)}
                >
                  <Body>
                    {t.team.country} ·{' '}
                    {panels.find((p) => p.id === t.panelId)?.name ?? 'Unassigned'}
                  </Body>
                  <View style={layout.row}>
                    <Badge label={t.evaluationStatus} />
                    <Badge label={t.participationStatus} />
                    {t.flags.map((f) => (
                      <Badge key={f.type} label={f.type} />
                    ))}
                  </View>
                  <Button
                    label={`Open ${t.team.name}`}
                    onPress={() => setSelected(t.teamId)}
                  />
                </Card>
              ))}
          {!selected && loaded && !teams.length && (
            <Notice text="No teams are available in Judging." />
          )}
          {current && access && (
            <>
              <Card
                title={`${current.team.officialId} · ${current.team.name}`}
                accent={teamAccent(current)}
              >
                <Body>{currentPanel?.name ?? 'No panel assigned'}</Body>
                <View style={layout.row}>
                  <Badge label={current.evaluationStatus} />
                  <Badge label={current.participationStatus} />
                </View>
                {Boolean(current.withdrawalReason) && (
                  <Body>Withdrawal: {current.withdrawalReason}</Body>
                )}
                {current.flags.map((f) => (
                  <Body key={f.type}>
                    {f.type}
                    {f.reason ? `: ${f.reason}` : ''}
                  </Body>
                ))}
                <View style={layout.row}>
                  <Button
                    label="Back to teams"
                    variant="secondary"
                    onPress={() => navigate(() => setSelected(null))}
                  />
                  <Button
                    label="Page this team"
                    variant="secondary"
                    icon="send"
                    disabled={!current.panelId}
                    onPress={() => navigate(() => onPage(current.teamId))}
                  />
                </View>
              </Card>
              {current.panelId &&
                (observationLoaded ? (
                  <ObservationEditor
                    key={`${current.teamId}:${current.panelId}`}
                    teamId={current.teamId}
                    panelId={current.panelId}
                    observations={observations}
                    editable={access.observe}
                    onSaved={async () => {
                      await loadObservations()
                      await load()
                    }}
                    onDirtyChange={reportDirty}
                  />
                ) : (
                  <Loading />
                ))}
              <Card title="Evaluation">
                <View style={layout.row}>
                  {access.complete && (
                    <Button
                      label="Complete evaluation"
                      disabled={busy || dirty || !observationLoaded}
                      onPress={() =>
                        confirmTeam('Complete this evaluation?', 'complete', {
                          confirmed: true,
                        })
                      }
                    />
                  )}
                  {access.reopen && (
                    <Button
                      label="Reopen evaluation"
                      disabled={busy || dirty}
                      onPress={() => confirmTeam('Reopen this evaluation?', 'reopen')}
                    />
                  )}
                </View>
                <Body>
                  {current.hasHistory
                    ? 'This team has evaluation history and cannot be removed from Judging.'
                    : 'Pending teams may be removed only when they have no observations or evaluation history.'}
                </Body>
              </Card>
              {advisor && (
                <Card title="Team coordination">
                  <Field
                    label="Reason for withdrawal or other flag"
                    value={reason}
                    onChangeText={setReason}
                    maxLength={500}
                    multiline
                  />
                  <View style={layout.row}>
                    {current.participationStatus === 'active' ? (
                      <Button
                        label="Withdraw team"
                        variant="danger"
                        disabled={busy || dirty || !reason.trim()}
                        onPress={() =>
                          confirmTeam('Withdraw team?', 'withdraw', { reason })
                        }
                      />
                    ) : (
                      <Button
                        label="Reactivate team"
                        disabled={busy || dirty}
                        onPress={() => confirmTeam('Reactivate team?', 'reactivate')}
                      />
                    )}
                    {(['absent', 'online', 'other'] as const).map((type) => {
                      const flagged = current.flags.some((f) => f.type === type)
                      return (
                        <Button
                          key={type}
                          label={`${flagged ? 'Clear' : 'Flag'} ${type}`}
                          variant="secondary"
                          disabled={
                            busy ||
                            dirty ||
                            (!flagged && type === 'other' && !reason.trim())
                          }
                          onPress={() =>
                            void run(() =>
                              commandTeam(
                                `flags/${type}`,
                                flagged
                                  ? {
                                      expectedVersion:
                                        current.flags.find((f) => f.type === type)
                                          ?.version ?? 0,
                                    }
                                  : {
                                      expectedVersion: 0,
                                      reason: type === 'other' ? reason : '',
                                    },
                                flagged ? 'DELETE' : 'PUT',
                              ),
                            )
                          }
                        />
                      )
                    })}
                    {access.removable &&
                      observationLoaded &&
                      observations.length === 0 && (
                        <Button
                          label="Remove from Judging"
                          variant="danger"
                          disabled={busy || dirty}
                          onPress={() =>
                            setConfirmation({
                              title: 'Remove team from Judging?',
                              description: 'The shared team registration will remain.',
                              work: async () => {
                                await api.command(
                                  `/judging/participations/${current.teamId}`,
                                  { expectedVersion: current.version },
                                  { method: 'DELETE' },
                                )
                                setSelected(null)
                              },
                            })
                          }
                        />
                      )}
                  </View>
                  <Body>
                    {current.panelId
                      ? 'Transfer to another panel (pending with no observations).'
                      : 'Assign this team to a panel.'}
                  </Body>
                  <View style={layout.row}>
                    {panels
                      .filter((p) => p.id !== current.panelId)
                      .map((p) => (
                        <Button
                          key={p.id}
                          label={`Assign to ${p.name}`}
                          disabled={
                            busy ||
                            dirty ||
                            judges.some(
                              (j) =>
                                p.judgeIds.includes(j.id) &&
                                conflictsWithTeam(j.conflict, current.team),
                            ) ||
                            current.evaluationStatus !== 'pending' ||
                            (Boolean(current.panelId) &&
                              (!observationLoaded || observations.length > 0))
                          }
                          onPress={() =>
                            void run(() =>
                              currentPanel
                                ? api.command(
                                    `/judging/teams/${current.teamId}/transfer`,
                                    {
                                      sourcePanelId: currentPanel.id,
                                      targetPanelId: p.id,
                                      sourceVersion: currentPanel.version,
                                      targetVersion: p.version,
                                      expectedVersion: current.version,
                                    },
                                  )
                                : api.command(`/judging/panels/${p.id}/teams`, {
                                    teamId: current.teamId,
                                    expectedVersion: p.version,
                                  }),
                            )
                          }
                        />
                      ))}
                  </View>
                </Card>
              )}
            </>
          )}
          {!selected && advisor && cycle && (
            <Card title="Include an imported team">
              <Field
                label="Find registered team"
                icon="search"
                value={search}
                onChangeText={setSearch}
              />
              {globalTeams
                .filter(
                  (t) =>
                    !teams.some((p) => p.teamId === t.id) &&
                    `${t.name} ${t.officialId}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                )
                .slice(0, 30)
                .map((t) => (
                  <Button
                    key={t.id}
                    label={`Include ${t.officialId} · ${t.name}`}
                    disabled={busy}
                    variant="secondary"
                    onPress={() =>
                      void run(() =>
                        api.command('/judging/participations', { teamId: t.id }),
                      )
                    }
                  />
                ))}
              <Body>Showing up to 30 matches. Use search to find a team.</Body>
            </Card>
          )}
        </>
      )}
      {tab === 'panels' && advisor && cycle && (
        <>
          {panelMode === 'dashboard' && (
            <PanelsDashboard
              panels={panels}
              teams={teams}
              judges={judges}
              busy={busy}
              panelCount={panelCount}
              onPanelCount={setPanelCount}
              unassignedTeams={unassignedTeams.length}
              notIncludedTeams={notIncluded.length}
              onOpen={openPanel}
              onNew={() => openPanel()}
              onCreatePanels={() => void run(createPanels)}
              onIncludeAll={() => void run(includeAllTeams)}
              onDivideTeams={() => void run(divideTeams)}
              onDistributeJudges={planJudges}
            />
          )}
          {panelMode === 'manage' && (
            <Button
              label="Back to panels"
              variant="secondary"
              onPress={() => {
                choosePanel()
                setPanelMode('dashboard')
              }}
            />
          )}
          {panelMode === 'manage' && (
            <Card title={editingPanel ? `Manage ${editingPanel.name}` : 'Create panel'}>
              {!editingPanel && (
                <Field
                  label="Panel name"
                  maxLength={80}
                  value={panelName}
                  onChangeText={setPanelName}
                />
              )}
              <Body>Select panel members. Choose a leader from the selected judges.</Body>
              {judges
                .filter((j) => !j.panelId || j.panelId === panelId)
                .map((j) => {
                  const hits = panelId ? judgeConflictsWithPanel(j, panelId, teams) : []
                  return (
                    <View key={j.id} style={layout.row}>
                      <Button
                        label={`${memberIds.includes(j.id) ? 'Selected' : 'Select'} ${j.name ?? j.email}`}
                        variant={memberIds.includes(j.id) ? 'primary' : 'secondary'}
                        disabled={hits.length > 0 && !memberIds.includes(j.id)}
                        onPress={() => {
                          setMemberIds((ids) =>
                            ids.includes(j.id)
                              ? ids.filter((id) => id !== j.id)
                              : [...ids, j.id],
                          )
                          if (leaderId === j.id) setLeaderId('')
                        }}
                      />
                      {memberIds.includes(j.id) && (
                        <Button
                          label={`${leaderId === j.id ? 'Leader' : 'Make leader'}: ${j.name ?? j.email}`}
                          variant={leaderId === j.id ? 'primary' : 'secondary'}
                          onPress={() => setLeaderId(j.id)}
                        />
                      )}
                      {hits.length > 0 && (
                        <Badge label={`Conflict: ${hits.join(', ')}`} tone="danger" />
                      )}
                    </View>
                  )
                })}
              <View style={layout.row}>
                {editingPanel ? (
                  <>
                    <Button
                      label="Save panel members"
                      disabled={
                        busy ||
                        Boolean(
                          editingPanel.leaderId &&
                          !memberIds.includes(editingPanel.leaderId),
                        )
                      }
                      onPress={() =>
                        void run(() =>
                          api.command(`/judging/panels/${panelId}/members`, {
                            expectedVersion: editingPanel.version,
                            judgeIds: memberIds,
                          }),
                        )
                      }
                    />
                    <Button
                      label={editingPanel.leaderId ? 'Replace leader' : 'Set leader'}
                      disabled={
                        busy ||
                        !leaderId ||
                        leaderId === editingPanel.leaderId ||
                        !editingPanel.judgeIds.includes(leaderId)
                      }
                      onPress={() =>
                        void run(() =>
                          api.command(`/judging/panels/${panelId}/leader`, {
                            expectedVersion: editingPanel.version,
                            leaderId,
                          }),
                        )
                      }
                    />
                    <Button
                      label="Delete empty panel"
                      variant="danger"
                      disabled={busy || teams.some((t) => t.panelId === panelId)}
                      onPress={() =>
                        setConfirmation({
                          title: 'Delete empty panel?',
                          description:
                            'Only a panel with no teams or observations can be deleted.',
                          work: async () => {
                            await api.command(
                              `/judging/panels/${panelId}`,
                              { expectedVersion: editingPanel.version },
                              { method: 'DELETE' },
                            )
                            choosePanel()
                            setPanelMode('dashboard')
                          },
                        })
                      }
                    />
                  </>
                ) : (
                  <Button
                    label="Create panel"
                    disabled={
                      busy ||
                      !panelName.trim() ||
                      (memberIds.length > 0 && !memberIds.includes(leaderId))
                    }
                    onPress={() =>
                      void run(async () => {
                        await api.command('/judging/panels', {
                          name: panelName,
                          ...(leaderId ? { leaderId } : {}),
                          judgeIds: memberIds,
                        })
                        choosePanel()
                        setPanelMode('dashboard')
                      })
                    }
                  />
                )}
              </View>
              {editingPanel && (
                <>
                  <Body>
                    Replace the leader before removing or transferring that judge.
                  </Body>
                  <Body>Transfer a judge</Body>
                  <View style={layout.row}>
                    {judges
                      .filter(
                        (j) => j.panelId === panelId && j.id !== editingPanel.leaderId,
                      )
                      .map((j) => (
                        <Button
                          key={j.id}
                          label={j.name ?? j.email}
                          variant={transferJudge === j.id ? 'primary' : 'secondary'}
                          onPress={() => {
                            setTransferJudge(j.id)
                            setTargetId('')
                          }}
                        />
                      ))}
                  </View>
                  <View style={layout.row}>
                    {panels
                      .filter((p) => p.id !== panelId)
                      .map((p) => {
                        const picked = judges.find((j) => j.id === transferJudge)
                        const hits = picked
                          ? judgeConflictsWithPanel(picked, p.id, teams)
                          : []
                        return (
                          <React.Fragment key={p.id}>
                            <Button
                              label={`To ${p.name}`}
                              variant={targetId === p.id ? 'primary' : 'secondary'}
                              disabled={hits.length > 0}
                              onPress={() => setTargetId(p.id)}
                            />
                            {hits.length > 0 && (
                              <Badge
                                label={`Conflict: ${hits.join(', ')}`}
                                tone="danger"
                              />
                            )}
                          </React.Fragment>
                        )
                      })}
                  </View>
                  <Button
                    label="Transfer selected judge"
                    disabled={busy || !transferJudge || !targetId}
                    onPress={() =>
                      void run(async () => {
                        const judge = judges.find((j) => j.id === transferJudge)
                        const target = panels.find((p) => p.id === targetId)
                        if (judge && target)
                          await api.command(`/judging/judges/${judge.id}/transfer`, {
                            sourcePanelId: editingPanel.id,
                            targetPanelId: target.id,
                            sourceVersion: editingPanel.version,
                            targetVersion: target.version,
                            expectedVersion: judge.version,
                          })
                        setTransferJudge('')
                      })
                    }
                  />
                </>
              )}
            </Card>
          )}
          {panelMode === 'manage' && editingPanel && (
            <Card title={`${editingPanel.name} teams`}>
              <Body>
                Leader:{' '}
                {editingPanel.leaderId ? judgeName(editingPanel.leaderId) : 'Not set'} ·
                Countries:{' '}
                {panelCountries(editingPanel.id, teams).join(', ') || 'none yet'}
              </Body>
              {teams
                .filter((t) => t.panelId === editingPanel.id)
                .map((t) => (
                  <View key={t.id} style={layout.row}>
                    <Body>
                      {t.team.officialId} · {t.team.name} ({t.team.country})
                    </Body>
                    <Badge label={t.evaluationStatus} />
                    <Button
                      label={`Review ${t.team.name}`}
                      variant="secondary"
                      onPress={() =>
                        navigate(() => {
                          setTab('teams')
                          setSelected(t.teamId)
                        })
                      }
                    />
                  </View>
                ))}
              {!teams.some((t) => t.panelId === editingPanel.id) && (
                <Notice text="No teams in this panel yet." />
              )}
            </Card>
          )}
        </>
      )}
      {tab === 'judges' && advisor && cycle && (
        <JudgesSheet
          judges={judges}
          panels={panels}
          teams={teams}
          busy={busy}
          onSave={(judge, countries) =>
            void run(() =>
              api.command(
                `/judging/judges/${judge.id}/conflict`,
                { expectedVersion: judge.conflictVersion, countries },
                { method: 'PUT' },
              ),
            )
          }
        />
      )}
      {tab === 'closure' && advisor && (
        <>
          <Card title="Close Judging">
            <Body>
              Closing removes all operational Judging access. The temporary audit is
              available only to advisors, and all Judging data must be permanently
              discarded within 24 hours. Other modules remain available.
            </Body>
            <Button
              label="Begin closure"
              variant="danger"
              disabled={busy || !cycle}
              onPress={() => {
                if (!cycle) return
                const closing = cycle
                setConfirmation({
                  title: 'First confirmation: close Judging?',
                  description:
                    'Continue to the final confirmation. Cancel now to keep Judging open.',
                  work: async () => {
                    const receipt = await api.command<Receipt>(
                      '/judging/closure-intents',
                      { expectedVersion: closing.version, confirmed: true },
                    )
                    setConfirmation({
                      title: 'Final confirmation: close Judging now?',
                      description:
                        'All operational Judging access will end immediately. This confirmation expires in five minutes.',
                      work: async () => {
                        await api.command('/judging/close', {
                          expectedVersion: closing.version,
                          token: receipt.entityId,
                        })
                        setTeams([])
                        setPanels([])
                        setObservations([])
                        setSelected(null)
                      },
                    })
                  },
                })
              }}
            />
          </Card>
          <Card title="Temporary audit">
            <Button
              label="Load temporary audit"
              variant="secondary"
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  setAudit(await api.get<Audit>('/judging/audit'))
                })
              }
            />
            {audit && (
              <>
                {audit.cycles.map((c) => (
                  <Body key={c.id}>
                    Closed {c.closed_at}. Disposal deadline: {c.purge_due_at}.
                  </Body>
                ))}
                {audit.observations.map((o) => (
                  <Card key={o.id} title={`Team ${o.team_id}`}>
                    <Body>{o.notes}</Body>
                  </Card>
                ))}
                <Body>{audit.entries.length} audit entries</Body>
                {!audit.cycles.length && (
                  <Notice text="No temporary audit is available." />
                )}
              </>
            )}
          </Card>
        </>
      )}
      {confirmation && (
        <Confirm
          title={confirmation.title}
          description={confirmation.description}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            // A confirmation shown by the previous step can appear while that step is
            // still refreshing; keep it open instead of silently discarding the tap.
            if (busy) return
            const action = confirmation
            setConfirmation(null)
            void run(action.work)
          }}
        />
      )}
    </Screen>
  )
}
