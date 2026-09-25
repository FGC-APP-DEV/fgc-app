import React, { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { useAuth } from '@fgc/auth'
import type { Observation } from '@fgc/contracts'
import { Body, Button, Card, Confirm, Field, Notice, layout } from '@fgc/ui'
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
      setReviewed(undefined)
      try {
        await onSaved()
      } catch {
        setError('Saved. Refresh the team to load the latest observations.')
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
      setError('The current observation could not be loaded. Your draft remains here.')
    }
  }
  return (
    <Card title="Panel observations">
      {observations
        .filter((o) => o.authorId !== user?.id)
        .map((o) => (
          <Card key={o.id} title={o.authorName}>
            <Body>{o.text}</Body>
          </Card>
        ))}
      {!observations.length && <Notice text="No observations yet." />}
      {(editable || own || draft.dirty) && (
        <>
          <Field
            label="Your observation"
            multiline
            maxLength={10000}
            value={draft.text}
            editable={editable && !draft.busy}
            onChangeText={(value) => {
              draft.edit(value)
              update()
            }}
          />
          {draft.dirty && (
            <Notice text="Unsaved changes. Keep this screen open until you save or discard them." />
          )}
          {!editable && (
            <Notice text="Observations can only be changed by their author while this team is active and pending in their current panel." />
          )}
          {(draft.error || error) && <Notice error text={draft.error || error} />}
          {reviewed !== undefined && (
            <Card title="Current saved observation">
              <Body>
                {reviewed?.text ?? 'Your previous observation has been deleted.'}
              </Body>
              <Notice text="Compare this saved record with your draft above. Edit your draft as needed before saving, or discard it to keep the saved record." />
            </Card>
          )}
          <View style={layout.row}>
            <Button
              label={
                draft.busy
                  ? 'Saving…'
                  : draft.error && !draft.conflict
                    ? 'Retry previous save'
                    : 'Save observation'
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
                label="Review current record"
                variant="secondary"
                onPress={() => void review()}
              />
            )}
            <Button
              label="Discard draft"
              variant="secondary"
              disabled={!draft.dirty || draft.busy}
              onPress={() => setConfirm('discard')}
            />
            {own && (
              <Button
                label="Delete your observation"
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
          title={
            confirm === 'delete' ? 'Delete your observation?' : 'Discard unsaved changes?'
          }
          description={
            confirm === 'delete'
              ? 'This removes your observation from this panel.'
              : 'Your unsaved text will be removed from this screen.'
          }
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
                .catch(() =>
                  setError(
                    'Delete was not confirmed. Refresh and review the current observation before trying again.',
                  ),
                )
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
