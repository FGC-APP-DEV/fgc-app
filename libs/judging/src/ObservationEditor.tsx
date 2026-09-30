import React, { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { useAuth } from '@fgc/auth'
import type { Observation } from '@fgc/contracts'
import {
  Body,
  Button,
  Card,
  Confirm,
  Field,
  Notice,
  layout,
  useI18n,
  useToast,
} from '@fgc/ui'
import { ObservationDraft } from './judging-state'

export function ObservationEditor({
  teamId,
  panelId,
  observations,
  editable,
  onSaved,
  onDirtyChange,
}: {
  teamId: string
  panelId: string
  observations: Observation[]
  editable: boolean
  onSaved(): Promise<void>
  onDirtyChange?(dirty: boolean): void
}) {
  const { api, user } = useAuth()
  const toast = useToast()
  const { t } = useI18n()
  const own = observations.find((o) => o.authorId === user?.id)
  const draft = useRef(new ObservationDraft(own)).current
  const [, render] = useState(0)
  const [confirm, setConfirm] = useState<'discard' | 'delete' | null>(null)
  const [error, setError] = useState('')
  const [reviewed, setReviewed] = useState<Observation | null | undefined>(undefined)
  const update = () => {
    render((value) => value + 1)
    onDirtyChange?.(draft.dirty)
  }
  useEffect(() => {
    if (!draft.dirty && !draft.busy) {
      draft.reconcile(own)
      draft.discard()
      render((v) => v + 1)
    }
  }, [own?.version, draft])
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange])
  const save = async () => {
    const pending = draft.save(api, teamId, panelId)
    update()
    const saved = await pending
    update()
    if (saved) {
      toast.success(t('jdObsSaved'))
      setReviewed(undefined)
      try {
        await onSaved()
      } catch {
        setError(t('jdSavedRefresh'))
      }
    }
  }
  const review = async () => {
    try {
      const current = await api.get<Observation[]>(
        `/judging/teams/${teamId}/observations`,
      )
      const saved = current.find((o) => o.authorId === user?.id)
      setReviewed(saved ?? null)
      draft.reconcile(saved)
      update()
      await onSaved()
    } catch {
      setError(t('jdCurrentLoadError'))
    }
  }
  return (
    <Card title={t('jdPanelObs')}>
      {observations
        .filter((o) => o.authorId !== user?.id)
        .map((o) => (
          <Card key={o.id} title={o.authorName}>
            <Body>{o.text}</Body>
          </Card>
        ))}
      {!observations.length && <Notice text={t('jdNoObs')} />}
      {(editable || own || draft.dirty) && (
        <>
          <Field
            label={t('jdYourObs')}
            multiline
            maxLength={10000}
            value={draft.text}
            editable={editable && !draft.busy}
            onChangeText={(value) => {
              draft.edit(value)
              update()
            }}
          />
          {draft.dirty && <Notice text={t('jdUnsaved')} />}
          {!editable && <Notice text={t('jdNotEditable')} />}
          {Boolean(draft.error || error) && <Notice error text={draft.error || error} />}
          {reviewed !== undefined && (
            <Card title={t('jdCurrentSaved')}>
              <Body>{reviewed?.text ?? t('jdPrevDeleted')}</Body>
              <Notice text={t('jdCompare')} />
            </Card>
          )}
          <View style={layout.row}>
            <Button
              label={
                draft.busy
                  ? t('jdSaving')
                  : draft.error && !draft.conflict
                    ? t('jdRetrySave')
                    : t('jdSaveObs')
              }
              disabled={
                !editable ||
                draft.busy ||
                draft.conflict ||
                !draft.dirty ||
                !draft.text.trim()
              }
              onPress={() => void save()}
            />
            {draft.conflict && (
              <Button
                label={t('jdReviewCurrent')}
                variant="secondary"
                onPress={() => void review()}
              />
            )}
            <Button
              label={t('jdDiscardDraft')}
              variant="secondary"
              disabled={!draft.dirty || draft.busy}
              onPress={() => setConfirm('discard')}
            />
            {own && (
              <Button
                label={t('jdDeleteObs')}
                variant="danger"
                disabled={!editable || draft.busy || draft.dirty}
                onPress={() => setConfirm('delete')}
              />
            )}
          </View>
        </>
      )}
      {confirm && (
        <Confirm
          title={confirm === 'delete' ? t('jdDeleteObsQ') : t('jdDiscardQ')}
          description={confirm === 'delete' ? t('jdDeleteObsBody') : t('jdDiscardBody')}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const action = confirm
            setConfirm(null)
            if (action === 'discard') {
              draft.discard()
              update()
            } else if (own) {
              draft.busy = true
              update()
              void api
                .command(
                  `/judging/teams/${teamId}/observation`,
                  { panelId, expectedVersion: own.version },
                  { method: 'DELETE' },
                )
                .then(async () => {
                  draft.reconcile()
                  draft.discard()
                  await onSaved()
                })
                .catch(() => setError(t('jdDeleteUnconfirmed')))
                .finally(() => {
                  draft.busy = false
                  update()
                })
            }
          }}
        />
      )}
    </Card>
  )
}
