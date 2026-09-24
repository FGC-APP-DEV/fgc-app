import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useAuth } from '@fgc/auth'
import type { Category, ShotItem, Tracker, TrackerTeam } from '@fgc/contracts'
import { CONTINENTS, countryName, sortTeams, teamContinent } from '@fgc/shared'
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
  TeamMap,
  layout,
} from '@fgc/ui'

export function FilmingScreen({ onPage }: { onPage: (teamId?: string) => void }) {
  const { api } = useAuth()
  const [tracker, setTracker] = useState<Tracker>({ teams: [], templates: [] })
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<ShotItem[]>([])
  const [tab, setTab] = useState('tracker')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [continent, setContinent] = useState('all')
  const [map, setMap] = useState(false)
  const [selected, setSelected] = useState<TrackerTeam | null>(null)
  const [notes, setNotes] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [itemName, setItemName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [itemStatus, setItemStatus] = useState('all')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [deleting, setDeleting] = useState<ShotItem | null>(null)
  const template = tracker.templates.find((t) => t.name === 'Step & Repeat')
  const shot = (team: TrackerTeam) =>
    team.shots.find((s) => s.templateId === template?.id)
  const captured = tracker.teams.filter((t) => shot(t)?.status === 'captured').length
  const load = async () => {
    try {
      const all: TrackerTeam[] = []
      let cursor: string | undefined
      let templates: Tracker['templates'] = []
      do {
        const result = await api.envelope<Tracker>(
          `/filming/tracker?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
        )
        all.push(...result.data.teams)
        templates = result.data.templates
        cursor = result.meta.nextCursor
      } while (cursor)
      const [nextCategories, nextItems] = await Promise.all([
        api.list<Category>('/filming/categories'),
        api.list<ShotItem>('/filming/items'),
      ])
      setTracker({ teams: sortTeams(all, (t) => t), templates })
      setCategories(nextCategories)
      setItems(nextItems)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoaded(true)
    }
  }
  useEffect(() => {
    void load()
  }, [api])
  const run = async (work: () => Promise<unknown>) => {
    setBusy(true)
    setError('')
    try {
      await work()
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const mark = async (state: 'captured' | 'skipped' | 'pending') => {
    if (!selected || !template) return
    await run(async () => {
      await api.command(
        `/filming/teams/${selected.id}/shots/${template.id}`,
        {
          expectedVersion: shot(selected)?.version ?? 0,
          ...(state !== 'pending' ? { status: state, notes } : {}),
        },
        { method: state === 'pending' ? 'DELETE' : 'PUT' },
      )
      setSelected(null)
      setNotes('')
    })
  }
  const filtered = tracker.teams.filter(
    (t) =>
      `${t.name} ${t.country} ${countryName(t.country)} ${t.officialId}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === 'all' || (shot(t)?.status ?? 'pending') === status) &&
      (continent === 'all' || teamContinent(t.country, t.countryCode) === continent),
  )
  return (
    <Screen>
      <Heading>Filming</Heading>
      <Body>Capture the competition, one team at a time.</Body>
      <View style={layout.row}>
        <Button
          label="Step & Repeat"
          variant={tab === 'tracker' ? 'primary' : 'secondary'}
          onPress={() => setTab('tracker')}
        />
        <Button
          label="Shot list"
          variant={tab === 'items' ? 'primary' : 'secondary'}
          onPress={() => setTab('items')}
        />
        <Button label="Team pager" variant="secondary" onPress={() => onPage()} />
        <Button label="Refresh" variant="secondary" onPress={() => void load()} />
      </View>
      {error && <Notice text={error} error />}
      {!loaded && <Loading />}
      <Field label="Search teams or shots" value={search} onChangeText={setSearch} />
      {tab === 'tracker' ? (
        <>
          <Card title="Coverage">
            <Body>
              {captured} of {tracker.teams.length} teams captured
            </Body>
            <ProgressBar
              value={captured}
              max={tracker.teams.length}
              label="Teams captured"
            />
            <View style={layout.row}>
              {['all', 'pending', 'captured', 'skipped'].map((value) => (
                <Button
                  key={value}
                  label={value}
                  variant={status === value ? 'primary' : 'secondary'}
                  onPress={() => setStatus(value)}
                />
              ))}
            </View>
            <View style={layout.row}>
              {['all', ...CONTINENTS].map((value) => (
                <Button
                  key={value}
                  label={value === 'all' ? 'All continents' : value}
                  variant={continent === value ? 'primary' : 'secondary'}
                  onPress={() => setContinent(value)}
                />
              ))}
            </View>
            <Button
              label={map ? 'Show list' : 'Show map'}
              variant="secondary"
              onPress={() => setMap(!map)}
            />
          </Card>
          {!template && <Notice text="Step & Repeat template is not configured yet." />}
          {map ? (
            <Card title="Team map">
              <TeamMap
                teams={tracker.teams}
                visibleTeamIds={new Set(filtered.map((team) => team.id))}
                status={(id) =>
                  shot(tracker.teams.find((t) => t.id === id)!)?.status ?? 'pending'
                }
                onSelect={(id) => {
                  const team = tracker.teams.find((t) => t.id === id)
                  if (team) {
                    setSelected(team)
                    setNotes(shot(team)?.notes ?? '')
                  }
                }}
              />
            </Card>
          ) : (
            filtered.map((team) => (
              <Card key={team.id} title={`${team.officialId} · ${team.name}`}>
                <View style={layout.row}>
                  <Badge label={shot(team)?.status ?? 'pending'} />
                  <Body>{team.country}</Body>
                </View>
                {shot(team)?.notes && <Body>{shot(team)?.notes}</Body>}
                <View style={layout.row}>
                  <Button
                    label={`Update ${team.name}`}
                    disabled={!template}
                    onPress={() => {
                      setSelected(team)
                      setNotes(shot(team)?.notes ?? '')
                    }}
                  />
                  <Button
                    label={`Page ${team.name}`}
                    variant="secondary"
                    onPress={() => onPage(team.id)}
                  />
                </View>
              </Card>
            ))
          )}
          {!map && loaded && !filtered.length && (
            <Notice text="No teams match these filters." />
          )}
          {selected && (
            <Card title={`Update ${selected.name}`}>
              <Field
                label="Shot notes"
                multiline
                maxLength={500}
                value={notes}
                onChangeText={setNotes}
              />
              <View style={layout.row}>
                <Button
                  label="Captured"
                  disabled={busy}
                  onPress={() => void mark('captured')}
                />
                <Button
                  label="Skipped"
                  disabled={busy}
                  onPress={() => void mark('skipped')}
                />
                <Button
                  label="Reset to pending"
                  disabled={busy}
                  variant="secondary"
                  onPress={() => void mark('pending')}
                />
                <Button
                  label="Cancel editing"
                  variant="secondary"
                  onPress={() => setSelected(null)}
                />
              </View>
            </Card>
          )}
        </>
      ) : (
        <>
          <Card title="Create category">
            <Field
              label="Category name"
              maxLength={80}
              value={categoryName}
              onChangeText={setCategoryName}
            />
            <Button
              label="Add category"
              disabled={busy || !categoryName.trim()}
              onPress={() =>
                void run(async () => {
                  await api.command('/filming/categories', { name: categoryName })
                  setCategoryName('')
                })
              }
            />
          </Card>
          <Card title="Add a shot">
            <View style={layout.row}>
              {categories.map((c) => (
                <Button
                  key={c.id}
                  label={c.name}
                  variant={categoryId === c.id ? 'primary' : 'secondary'}
                  onPress={() => setCategoryId(c.id)}
                />
              ))}
            </View>
            <Field
              label="Shot title"
              maxLength={200}
              value={itemName}
              onChangeText={setItemName}
            />
            <Button
              label="Add shot"
              disabled={busy || !categoryId || !itemName.trim()}
              onPress={() =>
                void run(async () => {
                  await api.command('/filming/items', { categoryId, title: itemName })
                  setItemName('')
                })
              }
            />
          </Card>
          <View style={layout.row}>
            {['all', 'pending', 'done'].map((value) => (
              <Button
                key={value}
                label={value}
                variant={itemStatus === value ? 'primary' : 'secondary'}
                onPress={() => setItemStatus(value)}
              />
            ))}
            <Button
              label="All categories"
              variant="secondary"
              onPress={() => setCategoryId('')}
            />
          </View>
          <Body>
            {items.filter((i) => i.doneAt).length} of {items.length} shots complete
          </Body>
          {items
            .filter(
              (i) =>
                (!categoryId || i.categoryId === categoryId) &&
                i.title.toLowerCase().includes(search.toLowerCase()) &&
                (itemStatus === 'all' || Boolean(i.doneAt) === (itemStatus === 'done')),
            )
            .map((item) => (
              <Card key={item.id} title={item.title}>
                <Body>{categories.find((c) => c.id === item.categoryId)?.name}</Body>
                <Badge label={item.doneAt ? 'Complete' : 'Pending'} />
                <View style={layout.row}>
                  <Button
                    label={
                      item.doneAt ? `Reopen ${item.title}` : `Complete ${item.title}`
                    }
                    disabled={busy}
                    onPress={() =>
                      void run(() =>
                        api.command(
                          `/filming/items/${item.id}`,
                          { expectedVersion: item.version, done: !item.doneAt },
                          { method: 'PATCH' },
                        ),
                      )
                    }
                  />
                  <Button
                    label={`Delete ${item.title}`}
                    variant="danger"
                    disabled={busy}
                    onPress={() => setDeleting(item)}
                  />
                </View>
              </Card>
            ))}
        </>
      )}
      {deleting && (
        <Confirm
          title="Delete shot?"
          description={`Remove ${deleting.title} from the shot list.`}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            const item = deleting
            setDeleting(null)
            void run(() =>
              api.command(
                `/filming/items/${item.id}`,
                { expectedVersion: item.version },
                { method: 'DELETE' },
              ),
            )
          }}
        />
      )}
    </Screen>
  )
}
