import React from 'react'
import { View } from 'react-native'
import type { Panel, Participation } from '@fgc/contracts'
import { Badge, Body, Button, Card, Field, Notice, ProgressBar, layout } from '@fgc/ui'
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
      <Card title="Set up panels">
        <Body>
          1. Create the panels and divide the teams. 2. List judge conflicts on the Judges
          tab. 3. Distribute the judges, then pick a leader for each panel.
        </Body>
        <View style={layout.row}>
          <View style={{ minWidth: 140, flexGrow: 1, flexBasis: 140 }}>
            <Field
              label="Number of panels"
              value={props.panelCount}
              onChangeText={(v) => props.onPanelCount(v.replace(/\D/g, '').slice(0, 2))}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
          <Button
            label="Create panels"
            disabled={busy || !props.panelCount}
            onPress={props.onCreatePanels}
          />
          <Button label="New panel" variant="secondary" onPress={props.onNew} />
        </View>
        <View style={layout.row}>
          {props.notIncludedTeams > 0 && (
            <Button
              label={`Include ${props.notIncludedTeams} registered teams`}
              variant="secondary"
              disabled={busy}
              onPress={props.onIncludeAll}
            />
          )}
          <Button
            label={`Divide ${props.unassignedTeams} teams evenly`}
            variant="secondary"
            disabled={busy || !panels.length || !props.unassignedTeams}
            onPress={props.onDivideTeams}
          />
          <Button
            label="Distribute judges"
            disabled={busy || !judgesReady}
            onPress={props.onDistributeJudges}
          />
        </View>
      </Card>
      {!panels.length && <Notice text="No panels yet. Create panels to begin." />}
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
                <Body>Leader: {leader ?? 'Not set'}</Body>
                <Body>
                  Countries: {countries.length ? countries.join(', ') : 'No teams yet'}
                </Body>
                <Body>
                  {p.judgeIds.length} judges · {progress.total} teams
                </Body>
                <ProgressBar
                  value={progress.evaluated}
                  max={progress.active}
                  label={`${p.name} interviewed`}
                />
                <View style={layout.row}>
                  <Body>
                    Interviewed {progress.evaluated}/{progress.active}
                  </Body>
                  {!p.leaderId && <Badge label="No leader" tone="warning" />}
                </View>
                <Button
                  label={`Open ${p.name}`}
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
