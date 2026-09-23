import React, { useState } from 'react'
import { View } from 'react-native'
import { useAuth } from '@fgc/auth'
import type { ImportPreview } from '@fgc/contracts'
import { Body, Button, Card, Field, Heading, Notice, Screen, layout } from '@fgc/ui'

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
        if (!name || !code)
          throw new Error('Use Country name=ISO code, one mapping per line.')
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
          ...data.results.map((r) => `Row ${r.row}: ${r.status}`),
          ...data.errors.map((r) => `Row ${r.row}: ${r.message}`),
        ].join('\n'),
      )
      setPreview(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Screen>
      <Button label="Back to administration" variant="secondary" onPress={onBack} />
      <Heading>Import teams</Heading>
      <Body>
        Upload, map, review, then confirm. Existing identifiers are never overwritten.
      </Body>
      <Notice text="XLSX, UTF-8 CSV/TXT or flat JSON arrays. Maximum 5 MiB, 5,000 records, 50 columns and 2,000 characters per field. Official identifier, name and country are provisional fields pending the official sample." />
      {error && <Notice text={error} error />}
      <Card title="Choose and map your file">
        <Button
          label={file ? 'Choose another file' : 'Choose file'}
          disabled={busy}
          onPress={() => void choose()}
        />
        {file && <Body>{file.fileName}</Body>}
        {Object.entries(mapping).map(([field, value]) => (
          <Field
            key={field}
            label={`Column for ${field}`}
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
              label={value === '\t' ? 'Tab separated' : `Delimiter ${value}`}
              variant={value === delimiter ? 'primary' : 'secondary'}
              onPress={() => {
                setDelimiter(value)
                setPreview(null)
              }}
            />
          ))}
        </View>
        <Field
          label="XLSX worksheet name (required when multiple sheets)"
          value={sheet}
          onChangeText={(v) => {
            setSheet(v)
            setPreview(null)
          }}
        />
        <Field
          label="Country mappings (example: Brazil=BR)"
          multiline
          value={countryMap}
          onChangeText={(v) => {
            setCountryMap(v)
            setPreview(null)
          }}
        />
        <Button
          label={busy ? 'Processing…' : 'Review preview'}
          disabled={busy || !file}
          onPress={() => void inspect()}
        />
      </Card>
      {preview && (
        <Card title="Preview — nothing is saved until you confirm">
          <Body>
            {preview.rows.filter((row) => row.status === 'ready').length} ready of{' '}
            {preview.rows.length} rows. Preview expires{' '}
            {new Date(preview.expiresAt).toLocaleTimeString()}.
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
            label="Confirm and import valid rows"
            disabled={busy || !preview.rows.some((row) => row.status === 'ready')}
            onPress={() => void commit()}
          />
        </Card>
      )}
      {result && (
        <Card title="Import results">
          <Body>{result}</Body>
        </Card>
      )}
    </Screen>
  )
}
