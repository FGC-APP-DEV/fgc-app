import React, { useState } from 'react'
import { View } from 'react-native'
import type { Panel, Participation } from '@fgc/contracts'
import { Badge, Body, Button, Card, Field, Notice, layout } from '@fgc/ui'
import { judgeConflictsWithPanel, validateConflicts } from './panel-planning'

export interface SheetJudge {
  id: string
  name: string | null
  email: string
  panelId: string | null
  conflict: string[]
  conflictVersion: number
}

/**
 * Judges sheet: every eligible judge with the panel they are on and a "conflict"
 * cell where the Judge Advisor lists the country codes the judge is related to.
 * Judges are never placed on a panel holding a team from those countries.
 */
export function JudgesSheet({
  judges,
  panels,
  teams,
  busy,
  onSave,
}: {
  judges: SheetJudge[]
  panels: Panel[]
  teams: Participation[]
  busy: boolean
  onSave(judge: SheetJudge, countries: string[]): void
}) {
  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const shown = judges.filter((j) =>
    `${j.name ?? ''} ${j.email} ${j.conflict.join(' ')}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  )
  return (
    <Card title="Judges">
      <Body>
        Add the country codes (for example BR or BRA, separated by commas) each judge is
        related to. Leave blank when there is no conflict. Judges are kept off panels that
        include those countries.
      </Body>
      <Field
        label="Search judges"
        icon="search"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />
      {shown.map((j) => {
        const saved = j.conflict.join(', ')
        const draft = drafts[j.id] ?? saved
        const { codes: next, invalid } = validateConflicts(draft)
        const dirty = invalid.length > 0 || next.join(', ') !== saved
        const panel = panels.find((p) => p.id === j.panelId)
        const clash = panel
          ? judgeConflictsWithPanel({ conflict: next }, panel.id, teams)
          : []
        return (
          <View
            key={j.id}
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              gap: 12,
            }}
          >
            <View style={{ flexGrow: 1, flexBasis: 200, minWidth: 0, gap: 4 }}>
              <Body>{j.name ?? j.email}</Body>
              <View style={layout.row}>
                <Badge label={panel?.name ?? 'No panel'} tone="neutral" />
                {panel && panel.leaderId === j.id && (
                  <Badge label="Leader" tone="success" />
                )}
                {clash.length > 0 && (
                  <Badge
                    label={`Conflict with panel: ${clash.join(', ')}`}
                    tone="danger"
                  />
                )}
              </View>
            </View>
            <View style={{ flexGrow: 2, flexBasis: 220, minWidth: 0 }}>
              <Field
                label={`Conflict for ${j.name ?? j.email}`}
                value={draft}
                onChangeText={(v) => setDrafts((d) => ({ ...d, [j.id]: v }))}
                autoCapitalize="characters"
                maxLength={200}
              />
              {invalid.length > 0 && (
                <Notice
                  error
                  text={`Unknown country code: ${invalid.join(', ')}. Use ISO codes such as BR or BRA.`}
                />
              )}
            </View>
            <Button
              label={`Save conflict for ${j.name ?? j.email}`}
              variant={dirty ? 'primary' : 'secondary'}
              disabled={busy || !dirty || invalid.length > 0}
              onPress={() => {
                onSave(j, next)
                setDrafts((d) => {
                  const { [j.id]: _drop, ...rest } = d
                  return rest
                })
              }}
            />
          </View>
        )
      })}
      {!shown.length && (
        <Notice
          text={judges.length ? 'No judges match this search.' : 'No judges yet.'}
        />
      )}
    </Card>
  )
}
