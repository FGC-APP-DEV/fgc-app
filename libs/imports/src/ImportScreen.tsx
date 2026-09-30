import React, { useState } from 'react'
import { View } from 'react-native'
import { useAuth } from '@fgc/auth'
import type { ImportPreview } from '@fgc/contracts'
import {
  Body,
  Button,
  Card,
  Field,
  Heading,
  Notice,
  Screen,
  layout,
  useI18n,
  useToast,
  useToastOn,
} from '@fgc/ui'

export interface ImportFile {
  fileName: string
  content: string
  encoding: 'utf8' | 'base64'
}
export function ImportScreen({
  pickFile,
  onBack,
}: {
  pickFile: () => Promise<ImportFile | null>
  onBack: () => void
}) {
  const { api } = useAuth()
  const { t, locale } = useI18n()
  const [file, setFile] = useState<ImportFile | null>(null)
  const [mapping, setMapping] = useState({
    officialId: 'id',
    name: 'name',
    country: 'country',
  })
  const [delimiter, setDelimiter] = useState<',' | ';' | '\t'>(',')
  const [sheet, setSheet] = useState('')
  const [countryMap, setCountryMap] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const toast = useToast()
  useToastOn(error, 'error')
  const choose = async () => {
    setError('')
    try {
      const selected = await pickFile()
      if (selected) {
        setFile(selected)
        setPreview(null)
        setResult('')
      }
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const inspect = async () => {
    if (!file) return
    setBusy(true)
    setError('')
    setPreview(null)
    try {
      const countries: Record<string, string> = {}
      for (const line of countryMap.split('\n').filter((l) => l.trim())) {
        const [name, code] = line.split('=')
        if (!name || !code) throw new Error(t('importMappingError'))
        countries[name.trim()] = code.trim().toUpperCase()
      }
      const data = await api.command<ImportPreview>('/imports/preview', {
        ...file,
        mapping,
        delimiter,
        ...(sheet ? { sheet } : {}),
        countries,
      })
      setPreview(data)
      toast.success(t('importChecked'))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const commit = async () => {
    if (!preview) return
    setBusy(true)
    setError('')
    try {
      const data = await api.command<
        ImportPreview & {
          results: { row: number; status: string }[]
          errors: { row: number; message: string }[]
        }
      >(`/imports/${preview.id}/commit`, { expectedVersion: preview.version })
      setResult(
        [
          ...data.results.map((r) =>
            t('importRowResult', { row: r.row, status: r.status }),
          ),
          ...data.errors.map((r) =>
            t('importRowResult', { row: r.row, status: r.message }),
          ),
        ].join('\n'),
      )
      setPreview(data)
      toast.success(data.errors.length ? t('importDoneErrors') : t('importDone'))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Screen>
      <Button label={t('importBack')} variant="secondary" onPress={onBack} />
      <Heading>{t('importTitle')}</Heading>
      <Body>{t('importIntro')}</Body>
      <Notice text={t('importFormats')} />
      <Card title={t('importChooseTitle')}>
        <Button
          label={file ? t('importChooseAnother') : t('importChooseFile')}
          disabled={busy}
          onPress={() => void choose()}
        />
        {file && <Body>{file.fileName}</Body>}
        {Object.entries(mapping).map(([field, value]) => (
          <Field
            key={field}
            label={t('importColumnFor', { field })}
            value={value}
            onChangeText={(text) => {
              setMapping({ ...mapping, [field]: text })
              setPreview(null)
            }}
          />
        ))}
        <View style={layout.row}>
          {([',', ';', '\t'] as const).map((value) => (
            <Button
              key={value}
              label={value === '\t' ? t('importTab') : t('importDelimiter', { value })}
              variant={value === delimiter ? 'primary' : 'secondary'}
              onPress={() => {
                setDelimiter(value)
                setPreview(null)
              }}
            />
          ))}
        </View>
        <Field
          label={t('importSheet')}
          value={sheet}
          onChangeText={(v) => {
            setSheet(v)
            setPreview(null)
          }}
        />
        <Field
          label={t('importCountryMap')}
          multiline
          value={countryMap}
          onChangeText={(v) => {
            setCountryMap(v)
            setPreview(null)
          }}
        />
        <Button
          label={busy ? t('importProcessing') : t('importReview')}
          disabled={busy || !file}
          onPress={() => void inspect()}
        />
      </Card>
      {preview && (
        <Card title={t('importPreviewTitle')}>
          <Body>
            {t('importPreviewSummary', {
              ready: preview.rows.filter((row) => row.status === 'ready').length,
              total: preview.rows.length,
              time: new Date(preview.expiresAt).toLocaleTimeString(locale),
            })}
          </Body>
          {preview.rows.map((row) => (
            <View key={row.row} style={layout.stack}>
              <Body>
                {row.row}. {row.officialId} · {row.name} · {row.country} — {row.status}
              </Body>
              {row.errors.length > 0 && (
                <Notice
                  text={row.errors.join(' ')}
                  error={row.status === 'invalid' || row.status === 'conflict'}
                />
              )}
            </View>
          ))}
          <Button
            label={t('importConfirm')}
            disabled={busy || !preview.rows.some((row) => row.status === 'ready')}
            onPress={() => void commit()}
          />
        </Card>
      )}
      {Boolean(result) && (
        <Card title={t('importResults')}>
          <Body>{result}</Body>
        </Card>
      )}
    </Screen>
  )
}
