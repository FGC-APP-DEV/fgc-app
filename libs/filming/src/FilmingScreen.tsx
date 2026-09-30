import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useAuth } from '@fgc/auth'
import type { Category, ShotItem, Tracker, TrackerTeam } from '@fgc/contracts'
import { CONTINENTS, countryName, sortTeams, teamContinent } from '@fgc/shared'
import {
  ActionModal,
  Badge,
  Body,
  Button,
  Card,
  Checkbox,
  DataTable,
  Field,
  Heading,
  Loading,
  Notice,
  ProgressBar,
  Screen,
  Select,
  TeamMap,
  layout,
  useToast,
  useToastOn,
  type Column,
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
  const [newStatus, setNewStatus] = useState('pending')
  const [editingItem, setEditingItem] = useState<ShotItem | null>(null)
  const [itemDone, setItemDone] = useState(false)
  const [itemDelete, setItemDelete] = useState(false)
  const toast = useToast()
  useToastOn(error, 'error')
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
  const run = async (work: () => Promise<unknown>, done?: string) => {
    setBusy(true)
    setError('')
    try {
      await work()
      if (done) toast.success(done)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const mark = async (state: 'captured' | 'skipped' | 'pending') => {
    if (!selected || !template) return
    await run(
      async () => {
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
      },
      state === 'captured'
        ? 'Marked as captured'
        : state === 'skipped'
          ? 'Marked as skipped'
          : 'Reset to pending',
    )
  }
  const openTeam = (team: TrackerTeam) => {
    setSelected(team)
    setNotes(shot(team)?.notes ?? '')
    setNewStatus(shot(team)?.status ?? 'pending')
  }
  const openItem = (item: ShotItem) => {
    setEditingItem(item)
    setItemDone(Boolean(item.doneAt))
    setItemDelete(false)
  }
  const saveItem = () => {
    const item = editingItem
    if (!item) return
    setEditingItem(null)
    void run(
      () =>
        itemDelete
          ? api.command(
              `/filming/items/${item.id}`,
              { expectedVersion: item.version },
              { method: 'DELETE' },
            )
          : api.command(
              `/filming/items/${item.id}`,
              { expectedVersion: item.version, done: itemDone },
              { method: 'PATCH' },
            ),
      itemDelete ? 'Shot deleted' : itemDone ? 'Shot completed' : 'Shot reopened',
    )
  }
  const filtered = tracker.teams.filter(
    (t) =>
      `${t.name} ${t.country} ${countryName(t.country)} ${t.officialId}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === 'all' || (shot(t)?.status ?? 'pending') === status) &&
      (continent === 'all' || teamContinent(t.country, t.countryCode) === continent),
  )
  const teamColumns: Column<TrackerTeam>[] = [
    { key: 'team', title: 'Team', flex: 3, render: (t) => `${t.officialId} · ${t.name}` },
    { key: 'country', title: 'Country', flex: 2, render: (t) => t.country },
    {
      key: 'status',
      title: 'Status',
      flex: 2,
      render: (t) => <Badge label={shot(t)?.status ?? 'pending'} />,
    },
  ]
  const visibleItems = items.filter(
    (i) =>
      (!categoryId || i.categoryId === categoryId) &&
      i.title.toLowerCase().includes(search.toLowerCase()) &&
      (itemStatus === 'all' || Boolean(i.doneAt) === (itemStatus === 'done')),
  )
  const itemColumns: Column<ShotItem>[] = [
    { key: 'title', title: 'Shot', flex: 3, render: (i) => i.title },
    {
      key: 'category',
      title: 'Category',
      flex: 2,
      render: (i) => categories.find((c) => c.id === i.categoryId)?.name ?? '-',
    },
    {
      key: 'status',
      title: 'Status',
      flex: 2,
      render: (i) => <Badge label={i.doneAt ? 'Complete' : 'Pending'} />,
    },
  ]
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
        <Button
          label="Team pager"
          variant="secondary"
          icon="send"
          onPress={() => onPage()}
        />
        <Button label="Refresh" variant="secondary" onPress={() => void load()} />
      </View>
      {!loaded && <Loading />}
      <Field
        label="Search teams or shots"
        icon="search"
        value={search}
        onChangeText={setSearch}
      />
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
              <Select
                label="Status"
                value={status}
                options={['all', 'pending', 'captured', 'skipped'].map((value) => ({
                  value,
                  label: value,
                }))}
                onChange={setStatus}
              />
              <Select
                label="Continent"
                value={continent}
                options={['all', ...CONTINENTS].map((value) => ({
                  value,
                  label: value === 'all' ? 'All continents' : value,
                }))}
                onChange={setContinent}
              />
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
                  if (team) openTeam(team)
                }}
              />
            </Card>
          ) : (
            <Card title="Teams">
              <DataTable
                columns={teamColumns}
                rows={filtered}
                rowKey={(team) => team.id}
                noun="teams"
                loading={!loaded}
                empty="No teams match these filters."
                resetKey={`${search}|${status}|${continent}`}
                rowActionLabel={(team) => `Actions for ${team.name}`}
                onRowAction={(team) => (template ? openTeam(team) : undefined)}
              />
            </Card>
          )}
          {selected && (
            <ActionModal
              title={`Update ${selected.name}`}
              onClose={() => setSelected(null)}
              confirmDisabled={busy}
              onConfirm={() => void mark(newStatus as 'captured' | 'skipped' | 'pending')}
            >
              <Select
                label="Shot status"
                value={newStatus}
                options={['pending', 'captured', 'skipped'].map((value) => ({
                  value,
                  label: value,
                }))}
                onChange={setNewStatus}
              />
              <Field
                label="Shot notes"
                multiline
                maxLength={500}
                value={notes}
                onChangeText={setNotes}
              />
              <Button
                label={`Page ${selected.name}`}
                variant="secondary"
                icon="send"
                onPress={() => {
                  const id = selected.id
                  setSelected(null)
                  onPage(id)
                }}
              />
            </ActionModal>
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
                }, 'Category added')
              }
            />
          </Card>
          <Card title="Add a shot">
            <Select
              label="Category"
              value={categoryId}
              options={[
                { value: '', label: 'All categories' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              onChange={setCategoryId}
            />
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
                }, 'Shot added')
              }
            />
          </Card>
          <Select
            label="Shot status"
            value={itemStatus}
            options={['all', 'pending', 'done'].map((value) => ({ value, label: value }))}
            onChange={setItemStatus}
          />
          <Body>
            {items.filter((i) => i.doneAt).length} of {items.length} shots complete
          </Body>
          <Card title="Shot list">
            <DataTable
              columns={itemColumns}
              rows={visibleItems}
              rowKey={(i) => i.id}
              noun="shots"
              loading={!loaded}
              empty="No shots match these filters."
              resetKey={`${search}|${categoryId}|${itemStatus}`}
              rowActionLabel={(i) => `Actions for ${i.title}`}
              onRowAction={openItem}
            />
          </Card>
          {editingItem && (
            <ActionModal
              title={editingItem.title}
              onClose={() => setEditingItem(null)}
              confirmLabel={itemDelete ? 'Delete shot' : 'Confirm'}
              confirmVariant={itemDelete ? 'danger' : 'primary'}
              confirmDisabled={busy}
              onConfirm={saveItem}
            >
              <Checkbox
                label="Completed"
                checked={itemDone}
                disabled={itemDelete}
                onChange={setItemDone}
              />
              <Checkbox
                label="Delete this shot"
                checked={itemDelete}
                onChange={setItemDelete}
              />
              {itemDelete && (
                <Notice text={`Remove ${editingItem.title} from the shot list.`} error />
              )}
            </ActionModal>
          )}
        </>
      )}
    </Screen>
  )
}
