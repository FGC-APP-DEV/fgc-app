import React, { useState } from 'react'
import type { ShellMessageKey } from '@fgc/shared'
import { Body, Button, Card, Heading, Screen, useI18n } from '@fgc/ui'
import { ApproveAccessPage } from './ApproveAccessPage'
import { MentorCodesPage } from './MentorCodesPage'
import { UsersPage } from './UsersPage'

type Page = 'dashboard' | 'users' | 'approve' | 'codes'

const cards = [
  { id: 'users', title: 'adminUsers', text: 'adminUsersText' },
  { id: 'approve', title: 'adminApprove', text: 'adminApproveText' },
  { id: 'codes', title: 'adminCodes', text: 'adminCodesText' },
  { id: 'imports', title: 'adminImport', text: 'adminImportText' },
] as const
const titles = {
  dashboard: 'administration',
  users: 'adminUsers',
  approve: 'adminApprove',
  codes: 'adminCodes',
} as const satisfies Record<Page, ShellMessageKey>

export function AdminScreen({ onImports }: { onImports: () => void }) {
  const [page, setPage] = useState<Page>('dashboard')
  const { t } = useI18n()
  return (
    <Screen>
      <Heading>{t(titles[page])}</Heading>
      {page === 'dashboard' ? (
        <>
          <Body>{t('adminIntro')}</Body>
          {cards.map((card) => (
            <Card key={card.id} title={t(card.title)}>
              <Body>{t(card.text)}</Body>
              <Button
                label={t('adminOpen', { title: t(card.title) })}
                variant="secondary"
                onPress={() => (card.id === 'imports' ? onImports() : setPage(card.id))}
              />
            </Card>
          ))}
        </>
      ) : (
        <>
          <Button
            label={t('adminBack')}
            variant="secondary"
            icon="arrowLeft"
            onPress={() => setPage('dashboard')}
          />
          {page === 'users' && <UsersPage />}
          {page === 'approve' && <ApproveAccessPage />}
          {page === 'codes' && <MentorCodesPage />}
        </>
      )}
    </Screen>
  )
}
