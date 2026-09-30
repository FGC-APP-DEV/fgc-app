import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useAuth } from '@fgc/auth'
import type { Team } from '@fgc/contracts'
import { sortTeams } from '@fgc/shared'
import {
  ActionModal,
  Body,
  Button,
  Card,
  DataTable,
  Field,
  Notice,
  layout,
  useI18n,
  useToast,
  useToastOn,
  type Column,
} from '@fgc/ui'
import { matchesCountry } from './lib/admin'

type Code = { teamId: string; version: number; expiresAt: string }

export function MentorCodesPage() {
  const { api } = useAuth()
  const [teams, setTeams] = useState<Team[] | null>(null)
  const [codes, setCodes] = useState<Code[]>([])
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [acting, setActing] = useState<Team | null>(null)
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const { t } = useI18n()
  useToastOn(error, 'error')

  const load = async () => {
    try {
      const [allTeams, allCodes] = await Promise.all([
        api.list<Team>('/teams'),
        api.get<Code[]>('/admin/mentor-codes'),
      ])
      setTeams(sortTeams(allTeams, (t) => t))
      setCodes(allCodes)
    } catch (e) {
      setError((e as Error).message)
      setTeams((current) => current ?? [])
    }
  }
  useEffect(() => {
    void load()
  }, [api])

  const issue = async (team: Team) => {
    setBusy(true)
    setError('')
    setSecret('')
    try {
      const data = await api.command<{ code: string }>('/admin/mentor-codes', {
        teamId: team.id,
        expectedVersion: codes.find((c) => c.teamId === team.id)?.version ?? 0,
      })
      setSecret(`${team.name}: ${data.code}`)
      toast.success(t('codesIssued', { team: team.name }))
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const query = name.trim().toLowerCase()
  const filtered = (teams ?? []).filter(
    (t) =>
      (!query || `${t.officialId} ${t.name}`.toLowerCase().includes(query)) &&
      matchesCountry(t, country),
  )
  const codeOf = (team: Team) => codes.find((c) => c.teamId === team.id)
  const columns: Column<Team>[] = [
    { key: 'team', title: t('codesTeam'), flex: 3, render: (team) => team.name },
    { key: 'country', title: t('codesCountry'), render: (team) => team.countryCode },
    {
      key: 'code',
      title: t('codesCode'),
      flex: 2,
      render: (team) => (codeOf(team) ? t('codesActive') : t('codesNotIssued')),
    },
  ]
  const has = acting ? Boolean(codeOf(acting)) : false

  return (
    <View style={layout.stack}>
      <Card title={t('adminCodes')}>
        <Body>{t('codesIntro')}</Body>
        {Boolean(secret) && <Notice text={t('codesCopy', { secret })} />}
        <Button
          label={t('codesRefresh')}
          variant="secondary"
          icon="refresh"
          onPress={() => void load()}
        />
        <Field
          label={t('codesFilterName')}
          icon="search"
          value={name}
          onChangeText={setName}
        />
        <Field
          label={t('codesFilterCountry')}
          icon="search"
          autoCapitalize="characters"
          value={country}
          onChangeText={setCountry}
        />
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(t) => t.id}
          noun={t('teamsNoun')}
          loading={teams === null}
          empty={t('codesNoMatch')}
          resetKey={`${name}|${country}`}
          rowActionLabel={(team) => t('actionsFor', { name: team.name })}
          onRowAction={setActing}
        />
      </Card>
      {acting && (
        <ActionModal
          title={t('codesFor', { team: acting.name })}
          onClose={() => setActing(null)}
          confirmLabel={has ? t('codesRegenerate') : t('codesIssue')}
          confirmDisabled={busy}
          onConfirm={() => {
            const team = acting
            setActing(null)
            void issue(team)
          }}
        >
          <Body>
            {has
              ? t('codesRegenerateBody', { team: acting.name })
              : t('codesIssueBody', { team: acting.name })}
          </Body>
        </ActionModal>
      )}
    </View>
  )
}
