import React from 'react'
import { View } from 'react-native'
import type { Panel, Participation } from '@fgc/contracts'
import {
  Badge,
  Body,
  Button,
  Card,
  Field,
  Notice,
  ProgressBar,
  layout,
  useI18n,
} from '@fgc/ui'
import { panelCountries, panelProgress } from './panel-planning'

interface JudgeName {
  id: string
  name: string | null
  email: string
}

export interface PanelsDashboardProps {
  panels: Panel[]
  teams: Participation[]
  judges: JudgeName[]
  busy: boolean
  panelCount: string
  onPanelCount(value: string): void
  unassignedTeams: number
  notIncludedTeams: number
  onOpen(panel: Panel): void
  onNew(): void
  onCreatePanels(): void
  onIncludeAll(): void
  onDivideTeams(): void
  onDistributeJudges(): void
}

/** Cards wrap onto as many columns as the width allows, one column on a phone. */
const cell = { flexGrow: 1, flexShrink: 1, flexBasis: 280, minWidth: 0 } as const

/**
 * Judge Advisor dashboard: setup steps (create panels, divide teams, distribute
 * judges) above a responsive grid with one summary card per panel.
 */
export function PanelsDashboard(props: PanelsDashboardProps) {
  const { panels, teams, judges, busy } = props
  const { t } = useI18n()
  const nameOf = (id: string | null) => {
    const j = judges.find((x) => x.id === id)
    return j ? (j.name ?? j.email) : null
  }
  const sorted = [...panels].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true }),
  )
  const judgesReady = judges.length > 0 && panels.length > 0
  return (
    <>
      <Card title={t('jdSetup')}>
        <Body>{t('jdSetupSteps')}</Body>
        <View style={layout.row}>
          <View style={{ minWidth: 140, flexGrow: 1, flexBasis: 140 }}>
            <Field
              label={t('jdPanelCount')}
              value={props.panelCount}
              onChangeText={(v) => props.onPanelCount(v.replace(/\D/g, '').slice(0, 2))}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
          <Button
            label={t('jdCreatePanels')}
            disabled={busy || !props.panelCount}
            onPress={props.onCreatePanels}
          />
          <Button label={t('jdNewPanel')} variant="secondary" onPress={props.onNew} />
        </View>
        <View style={layout.row}>
          {props.notIncludedTeams > 0 && (
            <Button
              label={t('jdIncludeN', { count: props.notIncludedTeams })}
              variant="secondary"
              disabled={busy}
              onPress={props.onIncludeAll}
            />
          )}
          <Button
            label={t('jdDivideN', { count: props.unassignedTeams })}
            variant="secondary"
            disabled={busy || !panels.length || !props.unassignedTeams}
            onPress={props.onDivideTeams}
          />
          <Button
            label={t('jdDistributeJudges')}
            disabled={busy || !judgesReady}
            onPress={props.onDistributeJudges}
          />
        </View>
      </Card>
      {!panels.length && <Notice text={t('jdNoPanels')} />}
      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'stretch' }}
      >
        {sorted.map((p) => {
          const progress = panelProgress(p.id, teams)
          const leader = nameOf(p.leaderId)
          const countries = panelCountries(p.id, teams)
          return (
            <View key={p.id} style={cell}>
              <Card
                title={p.name}
                accent={
                  !p.leaderId
                    ? 'warning'
                    : progress.active > 0 && progress.evaluated === progress.active
                      ? 'success'
                      : 'neutral'
                }
              >
                <Body>{t('jdLeaderOf', { leader: leader ?? t('jdNotSet') })}</Body>
                <Body>
                  {t('jdCountriesOf', {
                    countries: countries.length
                      ? countries.join(', ')
                      : t('jdNoTeamsYet'),
                  })}
                </Body>
                <Body>
                  {t('jdJudgesTeams', {
                    judges: p.judgeIds.length,
                    teams: progress.total,
                  })}
                </Body>
                <ProgressBar
                  value={progress.evaluated}
                  max={progress.active}
                  label={t('jdInterviewed', { panel: p.name })}
                />
                <View style={layout.row}>
                  <Body>
                    {t('jdInterviewedCount', {
                      done: progress.evaluated,
                      total: progress.active,
                    })}
                  </Body>
                  {!p.leaderId && <Badge label={t('jdNoLeader')} tone="warning" />}
                </View>
                <Button
                  label={t('jdOpenTeam', { team: p.name })}
                  variant="secondary"
                  onPress={() => props.onOpen(p)}
                />
              </Card>
            </View>
          )
        })}
      </View>
    </>
  )
}
