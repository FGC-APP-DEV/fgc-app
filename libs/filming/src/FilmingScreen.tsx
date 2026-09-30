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
  useI18n,
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
  const { t } = useI18n()
  const statusLabel = (value: string) =>
    value === 'all'
      ? t('filmingAll')
      : value === 'done'
        ? t('filmingDoneFilter')
        : value === 'pending'
          ? t('statusPending')
          : value === 'captured'
            ? t('statusCaptured')
            : value === 'skipped'
              ? t('statusSkipped')
              : value
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
        ? t('filmingMarkedCaptured')
        : state === 'skipped'
          ? t('filmingMarkedSkipped')
          : t('filmingResetPending'),
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
      itemDelete
        ? t('filmingShotDeleted')
        : itemDone
          ? t('filmingShotCompleted')
          : t('filmingShotReopened'),
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
    {
      key: 'team',
      title: t('filmingTeam'),
      flex: 3,
      render: (team) => `${team.officialId} · ${team.name}`,
    },
    {
      key: 'country',
      title: t('filmingCountry'),
      flex: 2,
      render: (team) => team.country,
    },
    {
      key: 'status',
      title: t('filmingStatus'),
      flex: 2,
      render: (team) => <Badge label={statusLabel(shot(team)?.status ?? 'pending')} />,
    },
  ]
  const visibleItems = items.filter(
    (i) =>
      (!categoryId || i.categoryId === categoryId) &&
      i.title.toLowerCase().includes(search.toLowerCase()) &&
      (itemStatus === 'all' || Boolean(i.doneAt) === (itemStatus === 'done')),
  )
  const itemColumns: Column<ShotItem>[] = [
    { key: 'title', title: t('filmingShot'), flex: 3, render: (i) => i.title },
    {
      key: 'category',
      title: t('filmingCategory'),
      flex: 2,
      render: (i) => categories.find((c) => c.id === i.categoryId)?.name ?? '-',
    },
    {
      key: 'status',
      title: t('filmingStatus'),
      flex: 2,
      render: (i) => (
        <Badge label={i.doneAt ? t('filmingComplete') : t('filmingPending')} />
      ),
    },
  ]
  return (
    <Screen>
      <Heading>{t('filmingTitle')}</Heading>
      <Body>{t('filmingIntro')}</Body>
      <View style={layout.row}>
        <Button
          label="Step & Repeat"
          variant={tab === 'tracker' ? 'primary' : 'secondary'}
          onPress={() => setTab('tracker')}
        />
        <Button
          label={t('filmingShotList')}
          variant={tab === 'items' ? 'primary' : 'secondary'}
          onPress={() => setTab('items')}
        />
        <Button
          label={t('pagerTitle')}
          variant="secondary"
          icon="send"
          onPress={() => onPage()}
        />
        <Button label={t('refresh')} variant="secondary" onPress={() => void load()} />
      </View>
      {!loaded && <Loading />}
      <Field
        label={t('filmingSearch')}
        icon="search"
        value={search}
        onChangeText={setSearch}
      />
      {tab === 'tracker' ? (
        <>
          <Card title={t('filmingCoverage')}>
            <Body>{t('filmingCaptured', { captured, total: tracker.teams.length })}</Body>
            <ProgressBar
              value={captured}
              max={tracker.teams.length}
              label={t('filmingTeamsCaptured')}
            />
            <View style={layout.row}>
              <Select
                label={t('filmingStatus')}
                value={status}
                options={['all', 'pending', 'captured', 'skipped'].map((value) => ({
                  value,
                  label: statusLabel(value),
                }))}
                onChange={setStatus}
              />
              <Select
                label={t('filmingContinent')}
                value={continent}
                options={['all', ...CONTINENTS].map((value) => ({
                  value,
                  label: value === 'all' ? t('filmingAllContinents') : value,
                }))}
                onChange={setContinent}
              />
            </View>
            <Button
              label={map ? t('filmingShowList') : t('filmingShowMap')}
              variant="secondary"
              onPress={() => setMap(!map)}
            />
          </Card>
          {!template && <Notice text={t('filmingNoTemplate')} />}
          {map ? (
            <Card title={t('filmingTeamMap')}>
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
            <Card title={t('filmingTeams')}>
              <DataTable
                columns={teamColumns}
                rows={filtered}
                rowKey={(team) => team.id}
                noun={t('teamsNoun')}
                loading={!loaded}
                empty={t('filmingNoTeams')}
                resetKey={`${search}|${status}|${continent}`}
                rowActionLabel={(team) => t('actionsFor', { name: team.name })}
                onRowAction={(team) => (template ? openTeam(team) : undefined)}
              />
            </Card>
          )}
          {selected && (
            <ActionModal
              title={t('filmingUpdate', { team: selected.name })}
              onClose={() => setSelected(null)}
              confirmDisabled={busy}
              onConfirm={() => void mark(newStatus as 'captured' | 'skipped' | 'pending')}
            >
              <Select
                label={t('filmingShotStatus')}
                value={newStatus}
                options={['pending', 'captured', 'skipped'].map((value) => ({
                  value,
                  label: statusLabel(value),
                }))}
                onChange={setNewStatus}
              />
              <Field
                label={t('filmingNotes')}
                multiline
                maxLength={500}
                value={notes}
                onChangeText={setNotes}
              />
              <Button
                label={t('filmingPageTeam', { team: selected.name })}
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
          <Card title={t('filmingCreateCategory')}>
            <Field
              label={t('filmingCategoryName')}
              maxLength={80}
              value={categoryName}
              onChangeText={setCategoryName}
            />
            <Button
              label={t('filmingAddCategory')}
              disabled={busy || !categoryName.trim()}
              onPress={() =>
                void run(async () => {
                  await api.command('/filming/categories', { name: categoryName })
                  setCategoryName('')
                }, t('filmingCategoryAdded'))
              }
            />
          </Card>
          <Card title={t('filmingAddShotTitle')}>
            <Select
              label={t('filmingCategory')}
              value={categoryId}
              options={[
                { value: '', label: t('filmingAllCategories') },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              onChange={setCategoryId}
            />
            <Field
              label={t('filmingShotTitleField')}
              maxLength={200}
              value={itemName}
              onChangeText={setItemName}
            />
            <Button
              label={t('filmingAddShot')}
              disabled={busy || !categoryId || !itemName.trim()}
              onPress={() =>
                void run(async () => {
                  await api.command('/filming/items', { categoryId, title: itemName })
                  setItemName('')
                }, t('filmingShotAdded'))
              }
            />
          </Card>
          <Select
            label={t('filmingShotStatus')}
            value={itemStatus}
            options={['all', 'pending', 'done'].map((value) => ({
              value,
              label: statusLabel(value),
            }))}
            onChange={setItemStatus}
          />
          <Body>
            {t('filmingShotsComplete', {
              done: items.filter((i) => i.doneAt).length,
              total: items.length,
            })}
          </Body>
          <Card title={t('filmingShotList')}>
            <DataTable
              columns={itemColumns}
              rows={visibleItems}
              rowKey={(i) => i.id}
              noun={t('filmingShotsNoun')}
              loading={!loaded}
              empty={t('filmingNoShots')}
              resetKey={`${search}|${categoryId}|${itemStatus}`}
              rowActionLabel={(i) => t('actionsFor', { name: i.title })}
              onRowAction={openItem}
            />
          </Card>
          {editingItem && (
            <ActionModal
              title={editingItem.title}
              onClose={() => setEditingItem(null)}
              confirmLabel={itemDelete ? t('filmingDeleteShot') : t('confirm')}
              confirmVariant={itemDelete ? 'danger' : 'primary'}
              confirmDisabled={busy}
              onConfirm={saveItem}
            >
              <Checkbox
                label={t('filmingCompleted')}
                checked={itemDone}
                disabled={itemDelete}
                onChange={setItemDone}
              />
              <Checkbox
                label={t('filmingDeleteThis')}
                checked={itemDelete}
                onChange={setItemDelete}
              />
              {itemDelete && (
                <Notice
                  text={t('filmingDeleteWarn', { title: editingItem.title })}
                  error
                />
              )}
            </ActionModal>
          )}
        </>
      )}
    </Screen>
  )
}
