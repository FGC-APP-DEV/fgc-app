import { SHELL_MESSAGES, sortTeams, type ShellMessageKey } from '@fgc/shared'
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
  useI18n,
  useRememberedState,
  useToast,
  useToastOn,
} from '@fgc/ui'
import { AnnotationsSearch } from './AnnotationsSearch'
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
  const toast = useToast()
  const { t: tr } = useI18n()
  const statusLabel = (value: string) => {
    const key = `jdSt_${value}` as ShellMessageKey
    return SHELL_MESSAGES.en[key] ? tr(key) : value
  }
  useToastOn(error, 'error')
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useRememberedState<
    'teams' | 'annotations' | 'panels' | 'judges' | 'closure'
  >('judging.tab', 'teams')
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
      setError(e instanceof Error ? e.message : tr('jdLoadError'))
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
        setError(e instanceof Error ? e.message : tr('jdObsLoadError')),
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
      toast.success(tr('jdSaved'))
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : tr('jdNotConfirmed'))
    } finally {
      setBusy(false)
    }
  }
  const navigate = (work: () => void) => {
    if (dirty)
      setConfirmation({
        title: tr('jdLeaveTitle'),
        description: tr('jdLeaveBody'),
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
      description: tr('jdApplyChange', { team: current?.team.name ?? '' }),
      work: async () => {
        await commandTeam(suffix, body)
      },
    })
  const judgeName = (id: string) => {
    const j = judges.find((x) => x.id === id)
    return j ? (j.name ?? j.email) : tr('jdUnknownJudge')
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
        tr('jdNoEligiblePanel', { count: stuck.length, teams: stuck.join(', ') }),
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
      title: tr('jdDistributeTitle'),
      description:
        tr('jdDistributeBody', { judges: judges.length, panels: panels.length }) +
        (plan.unplaced.length
          ? tr('jdUnplaced', { judges: plan.unplaced.map(judgeName).join(', ') })
          : ''),
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
        <Notice error text={tr('jdNoAccess')} />
      </Screen>
    )
  return (
    <Screen>
      <Heading>{tr('jdTitle')}</Heading>
      <Body>{tr('jdIntro')}</Body>
      <View style={layout.row}>
        <Button
          label={tr('jdTabTeams')}
          variant={tab === 'teams' ? 'primary' : 'secondary'}
          onPress={() =>
            navigate(() => {
              setSelected(null)
              setTab('teams')
            })
          }
        />
        <Button
          label={tr('jdTabAnnotations')}
          variant={tab === 'annotations' ? 'primary' : 'secondary'}
          onPress={() =>
            navigate(() => {
              setSelected(null)
              setTab('annotations')
            })
          }
        />
        {advisor && (
          <>
            <Button
              label={tr('jdTabPanels')}
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
              label={tr('jdTabJudges')}
              variant={tab === 'judges' ? 'primary' : 'secondary'}
              onPress={() =>
                navigate(() => {
                  setSelected(null)
                  setTab('judges')
                })
              }
            />
            <Button
              label={tr('jdTabClosure')}
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
          label={tr('pagerTitle')}
          variant="secondary"
          icon="send"
          disabled={busy}
          onPress={() => navigate(() => onPage())}
        />
        <Button
          label={tr('jdRefresh')}
          variant="secondary"
          disabled={busy}
          onPress={() => {
            void load()
            if (selected)
              void loadObservations().catch(() => setError(tr('jdObsRefreshError')))
          }}
        />
      </View>
      {Boolean(planNotice) && tab === 'panels' && <Notice text={planNotice} />}
      {!loaded && <Loading />}
      {loaded && !cycle && <Notice text={tr('jdNoCycle')} />}
      {tab === 'annotations' && <AnnotationsSearch />}
      {tab === 'teams' && (
        <>
          <Card title={tr('jdProgress')}>
            <Body>
              {tr('jdEvaluated', {
                evaluated: summary.evaluated,
                active: summary.active,
              })}
            </Body>
            <ProgressBar
              value={summary.evaluated}
              max={summary.active}
              label={tr('jdTeamsEvaluated')}
            />
            <Body>{tr('jdWithdrawn', { count: summary.withdrawn })}</Body>
          </Card>
          <Field
            label={tr('jdSearchTeams')}
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
                    {panels.find((p) => p.id === t.panelId)?.name ?? tr('jdUnassigned')}
                  </Body>
                  <View style={layout.row}>
                    <Badge label={statusLabel(t.evaluationStatus)} />
                    <Badge label={statusLabel(t.participationStatus)} />
                    {t.flags.map((f) => (
                      <Badge key={f.type} label={statusLabel(f.type)} />
                    ))}
                  </View>
                  <Button
                    label={tr('jdOpenTeam', { team: t.team.name })}
                    onPress={() => setSelected(t.teamId)}
                  />
                </Card>
              ))}
          {!selected && loaded && !teams.length && <Notice text={tr('jdNoTeams')} />}
          {current && access && (
            <>
              <Card
                title={`${current.team.officialId} · ${current.team.name}`}
                accent={teamAccent(current)}
              >
                <Body>{currentPanel?.name ?? tr('jdNoPanel')}</Body>
                <View style={layout.row}>
                  <Badge label={statusLabel(current.evaluationStatus)} />
                  <Badge label={statusLabel(current.participationStatus)} />
                </View>
                {Boolean(current.withdrawalReason) && (
                  <Body>
                    {tr('jdWithdrawal', { reason: current.withdrawalReason ?? '' })}
                  </Body>
                )}
                {current.flags.map((f) => (
                  <Body key={f.type}>
                    {statusLabel(f.type)}
                    {f.reason ? `: ${f.reason}` : ''}
                  </Body>
                ))}
                <View style={layout.row}>
                  <Button
                    label={tr('jdBackTeams')}
                    variant="secondary"
                    onPress={() => navigate(() => setSelected(null))}
                  />
                  <Button
                    label={tr('jdPageTeam')}
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
              <Card title={tr('jdEvaluation')}>
                <View style={layout.row}>
                  {access.complete && (
                    <Button
                      label={tr('jdComplete')}
                      disabled={busy || dirty || !observationLoaded}
                      onPress={() =>
                        confirmTeam(tr('jdCompleteQ'), 'complete', {
                          confirmed: true,
                        })
                      }
                    />
                  )}
                  {access.reopen && (
                    <Button
                      label={tr('jdReopen')}
                      disabled={busy || dirty}
                      onPress={() => confirmTeam(tr('jdReopenQ'), 'reopen')}
                    />
                  )}
                </View>
                <Body>{current.hasHistory ? tr('jdHistory') : tr('jdNoHistory')}</Body>
              </Card>
              {advisor && (
                <Card title={tr('jdCoordination')}>
                  <Field
                    label={tr('jdReasonField')}
                    value={reason}
                    onChangeText={setReason}
                    maxLength={500}
                    multiline
                  />
                  <View style={layout.row}>
                    {current.participationStatus === 'active' ? (
                      <Button
                        label={tr('jdWithdraw')}
                        variant="danger"
                        disabled={busy || dirty || !reason.trim()}
                        onPress={() =>
                          confirmTeam(tr('jdWithdrawQ'), 'withdraw', { reason })
                        }
                      />
                    ) : (
                      <Button
                        label={tr('jdReactivate')}
                        disabled={busy || dirty}
                        onPress={() => confirmTeam(tr('jdReactivateQ'), 'reactivate')}
                      />
                    )}
                    {(['absent', 'online', 'other'] as const).map((type) => {
                      const flagged = current.flags.some((f) => f.type === type)
                      return (
                        <Button
                          key={type}
                          label={tr(flagged ? 'jdClearFlag' : 'jdFlag', { type })}
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
                          label={tr('jdRemoveJudging')}
                          variant="danger"
                          disabled={busy || dirty}
                          onPress={() =>
                            setConfirmation({
                              title: tr('jdRemoveJudgingQ'),
                              description: tr('jdRegistrationStays'),
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
                    {current.panelId ? tr('jdTransferHint') : tr('jdAssignHint')}
                  </Body>
                  <View style={layout.row}>
                    {panels
                      .filter((p) => p.id !== current.panelId)
                      .map((p) => (
                        <Button
                          key={p.id}
                          label={tr('jdAssignTo', { panel: p.name })}
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
            <Card title={tr('jdIncludeTitle')}>
              <Field
                label={tr('jdFindRegistered')}
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
                    label={tr('jdInclude', { team: `${t.officialId} · ${t.name}` })}
                    disabled={busy}
                    variant="secondary"
                    onPress={() =>
                      void run(() =>
                        api.command('/judging/participations', { teamId: t.id }),
                      )
                    }
                  />
                ))}
              <Body>{tr('jdShowing30')}</Body>
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
              label={tr('jdBackPanels')}
              variant="secondary"
              onPress={() => {
                choosePanel()
                setPanelMode('dashboard')
              }}
            />
          )}
          {panelMode === 'manage' && (
            <Card
              title={
                editingPanel
                  ? tr('jdManage', { panel: editingPanel.name })
                  : tr('jdCreatePanelTitle')
              }
            >
              {!editingPanel && (
                <Field
                  label={tr('jdPanelName')}
                  maxLength={80}
                  value={panelName}
                  onChangeText={setPanelName}
                />
              )}
              <Body>{tr('jdSelectMembers')}</Body>
              {judges
                .filter((j) => !j.panelId || j.panelId === panelId)
                .map((j) => {
                  const hits = panelId ? judgeConflictsWithPanel(j, panelId, teams) : []
                  return (
                    <View key={j.id} style={layout.row}>
                      <Button
                        label={tr(memberIds.includes(j.id) ? 'jdSelected' : 'jdSelect', {
                          judge: j.name ?? j.email,
                        })}
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
                          label={tr(leaderId === j.id ? 'jdLeader' : 'jdMakeLeader', {
                            judge: j.name ?? j.email,
                          })}
                          variant={leaderId === j.id ? 'primary' : 'secondary'}
                          onPress={() => setLeaderId(j.id)}
                        />
                      )}
                      {hits.length > 0 && (
                        <Badge
                          label={tr('jdConflict', { countries: hits.join(', ') })}
                          tone="danger"
                        />
                      )}
                    </View>
                  )
                })}
              <View style={layout.row}>
                {editingPanel ? (
                  <>
                    <Button
                      label={tr('jdSaveMembers')}
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
                      label={
                        editingPanel.leaderId ? tr('jdReplaceLeader') : tr('jdSetLeader')
                      }
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
                      label={tr('jdDeletePanel')}
                      variant="danger"
                      disabled={busy || teams.some((t) => t.panelId === panelId)}
                      onPress={() =>
                        setConfirmation({
                          title: tr('jdDeletePanelQ'),
                          description: tr('jdDeletePanelBody'),
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
                    label={tr('jdCreatePanel')}
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
                  <Body>{tr('jdReplaceFirst')}</Body>
                  <Body>{tr('jdTransferJudge')}</Body>
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
                              label={tr('jdToPanel', { panel: p.name })}
                              variant={targetId === p.id ? 'primary' : 'secondary'}
                              disabled={hits.length > 0}
                              onPress={() => setTargetId(p.id)}
                            />
                            {hits.length > 0 && (
                              <Badge
                                label={tr('jdConflict', { countries: hits.join(', ') })}
                                tone="danger"
                              />
                            )}
                          </React.Fragment>
                        )
                      })}
                  </View>
                  <Button
                    label={tr('jdTransferSelected')}
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
            <Card title={tr('jdPanelTeams', { panel: editingPanel.name })}>
              <Body>
                {tr('jdLeaderCountries', {
                  leader: editingPanel.leaderId
                    ? judgeName(editingPanel.leaderId)
                    : tr('jdNotSet'),
                  countries:
                    panelCountries(editingPanel.id, teams).join(', ') || tr('jdNoneYet'),
                })}
              </Body>
              {teams
                .filter((t) => t.panelId === editingPanel.id)
                .map((t) => (
                  <View key={t.id} style={layout.row}>
                    <Body>
                      {t.team.officialId} · {t.team.name} ({t.team.country})
                    </Body>
                    <Badge label={statusLabel(t.evaluationStatus)} />
                    <Button
                      label={tr('jdReview', { team: t.team.name })}
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
                <Notice text={tr('jdNoTeamsInPanel')} />
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
          <Card title={tr('jdCloseTitle')}>
            <Body>{tr('jdCloseBody')}</Body>
            <Button
              label={tr('jdBeginClosure')}
              variant="danger"
              disabled={busy || !cycle}
              onPress={() => {
                if (!cycle) return
                const closing = cycle
                setConfirmation({
                  title: tr('jdFirstConfirm'),
                  description: tr('jdFirstConfirmBody'),
                  work: async () => {
                    const receipt = await api.command<Receipt>(
                      '/judging/closure-intents',
                      { expectedVersion: closing.version, confirmed: true },
                    )
                    setConfirmation({
                      title: tr('jdFinalConfirm'),
                      description: tr('jdFinalConfirmBody'),
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
          <Card title={tr('jdAuditTitle')}>
            <Button
              label={tr('jdLoadAudit')}
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
                    {tr('jdAuditCycle', { closed: c.closed_at, due: c.purge_due_at })}
                  </Body>
                ))}
                {audit.observations.map((o) => (
                  <Card key={o.id} title={tr('jdAuditTeam', { id: o.team_id })}>
                    <Body>{o.notes}</Body>
                  </Card>
                ))}
                <Body>{tr('jdAuditEntries', { count: audit.entries.length })}</Body>
                {!audit.cycles.length && <Notice text={tr('jdNoAudit')} />}
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
