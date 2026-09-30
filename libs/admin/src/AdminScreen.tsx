import React, { useState } from 'react'
import { Body, Button, Card, Heading, Screen } from '@fgc/ui'
import { ApproveAccessPage } from './ApproveAccessPage'
import { MentorCodesPage } from './MentorCodesPage'
import { UsersPage } from './UsersPage'

type Page = 'dashboard' | 'users' | 'approve' | 'codes'

const cards: {
  id: Exclude<Page, 'dashboard'> | 'imports'
  title: string
  text: string
}[] = [
  {
    id: 'users',
    title: 'Current users',
    text: 'Search everyone with access, change their roles or remove them.',
  },
  {
    id: 'approve',
    title: 'Approve staff access',
    text: 'Grant roles to new staff by pasting a list of emails and roles.',
  },
  {
    id: 'codes',
    title: 'Mentor access codes',
    text: 'Issue or regenerate the seven-day access code for each team.',
  },
  {
    id: 'imports',
    title: 'Import teams',
    text: 'Upload the shared team register from a spreadsheet.',
  },
]
const titles: Record<Page, string> = {
  dashboard: 'Administration',
  users: 'Current users',
  approve: 'Approve staff access',
  codes: 'Mentor access codes',
}

export function AdminScreen({ onImports }: { onImports: () => void }) {
  const [page, setPage] = useState<Page>('dashboard')
  return (
    <Screen>
      <Heading>{titles[page]}</Heading>
      {page === 'dashboard' ? (
        <>
          <Body>
            Manage access and the shared team register. Judging content is private to
            judges and advisors.
          </Body>
          {cards.map((card) => (
            <Card key={card.id} title={card.title}>
              <Body>{card.text}</Body>
              <Button
                label={`Open ${card.title}`}
                variant="secondary"
                onPress={() => (card.id === 'imports' ? onImports() : setPage(card.id))}
              />
            </Card>
          ))}
        </>
      ) : (
        <>
          <Button
            label="Back to Administration"
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
