import ExcelJS from 'exceljs'
import { createHash } from 'node:crypto'
import { inflateRawSync } from 'node:zlib'
import { z } from 'zod'
import { importPreviewInput, type ImportRow } from '@fgc/contracts'
import { DomainError } from './errors'

type Input = z.infer<typeof importPreviewInput>
const isoCountries = new Set(
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(
    ' ',
  ),
)
function delimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let closed = false
  const push = () => {
    if (field.length > 2000)
      throw new DomainError('VALIDATION_ERROR', 'A field exceeds 2,000 characters.')
    row.push(field)
    field = ''
    closed = false
    if (row.length > 50)
      throw new DomainError('VALIDATION_ERROR', 'Files may contain at most 50 columns.')
  }
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          quoted = false
          closed = true
        }
      } else field += char
      continue
    }
    if (char === delimiter) push()
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      push()
      rows.push(row)
      row = []
      if (rows.length > 5001)
        throw new DomainError(
          'VALIDATION_ERROR',
          'Files may contain at most 5,000 records.',
        )
    } else if (char === '"' && !field && !closed) quoted = true
    else {
      if (closed || char === '"')
        throw new DomainError('VALIDATION_ERROR', 'Malformed quoted field.')
      field += char
    }
  }
  if (quoted) throw new DomainError('VALIDATION_ERROR', 'A quoted field is not closed.')
  if (field || row.length) {
    push()
    rows.push(row)
  }
  return rows
}
function validateZip(data: Buffer): void {
  const invalid = () =>
    new DomainError(
      'VALIDATION_ERROR',
      'The workbook is corrupt or exceeds the supported ZIP limits.',
    )
  let end = -1
  for (let i = data.length - 22; i >= Math.max(0, data.length - 65557); i--) {
    if (
      data.readUInt32LE(i) === 0x06054b50 &&
      i + 22 + data.readUInt16LE(i + 20) === data.length
    ) {
      end = i
      break
    }
  }
  if (end < 0 || data.readUInt16LE(end + 4) || data.readUInt16LE(end + 6)) throw invalid()
  const count = data.readUInt16LE(end + 10)
  const centralEnd = data.readUInt32LE(end + 16) + data.readUInt32LE(end + 12)
  let cursor = data.readUInt32LE(end + 16)
  let expanded = 0
  if (!count || count > 10000 || centralEnd > end) throw invalid()
  for (let entry = 0; entry < count; entry++) {
    if (cursor + 46 > centralEnd || data.readUInt32LE(cursor) !== 0x02014b50)
      throw invalid()
    const flags = data.readUInt16LE(cursor + 8)
    const method = data.readUInt16LE(cursor + 10)
    const compressedSize = data.readUInt32LE(cursor + 20)
    const size = data.readUInt32LE(cursor + 24)
    const nameLength = data.readUInt16LE(cursor + 28)
    const extraLength = data.readUInt16LE(cursor + 30)
    const commentLength = data.readUInt16LE(cursor + 32)
    const local = data.readUInt32LE(cursor + 42)
    const next = cursor + 46 + nameLength + extraLength + commentLength
    if (
      next > centralEnd ||
      local + 30 > data.length ||
      data.readUInt32LE(local) !== 0x04034b50
    )
      throw invalid()
    const name = data.subarray(cursor + 46, cursor + 46 + nameLength).toString()
    if (
      flags & 1 ||
      /vbaProject|macros|externalLinks/i.test(name) ||
      ![0, 8].includes(method) ||
      size > 25 * 1024 * 1024 - expanded
    )
      throw invalid()
    const start =
      local + 30 + data.readUInt16LE(local + 26) + data.readUInt16LE(local + 28)
    if (start + compressedSize > data.readUInt32LE(end + 16)) throw invalid()
    const compressed = data.subarray(start, start + compressedSize)
    let actual: Buffer
    try {
      actual =
        method === 0
          ? compressed
          : inflateRawSync(compressed, {
              maxOutputLength: Math.max(1, 25 * 1024 * 1024 - expanded),
            })
    } catch {
      throw invalid()
    }
    if (actual.length !== size) throw invalid()
    expanded += actual.length
    cursor = next
  }
  if (cursor !== centralEnd) throw invalid()
}
export async function readImport(
  input: Input,
): Promise<{
  rows: ImportRow[]
  columns: string[]
  sheets?: string[]
  inputHash: string
}> {
  const data =
    input.encoding === 'base64'
      ? Buffer.from(input.content, 'base64')
      : Buffer.from(input.content, 'utf8')
  if (data.length > 5 * 1024 * 1024) throw new DomainError('PAYLOAD_TOO_LARGE')
  if (!data.length) throw new DomainError('VALIDATION_ERROR', 'The file is empty.')
  const extension = input.fileName.split('.').pop()?.toLowerCase()
  let records: Record<string, unknown>[]
  let columns: string[]
  let sheets: string[] | undefined
  const fromTable = (table: string[][]) => {
    columns = table.shift()?.map((v) => v.trim()) ?? []
    if (
      !columns.length ||
      columns.length > 50 ||
      columns.some((v) => !v) ||
      new Set(columns).size !== columns.length
    )
      throw new DomainError('VALIDATION_ERROR', 'Use distinct, nonempty column headers.')
    return table
      .filter((row) => row.some((v) => v.trim()))
      .map((row) => {
        if (row.length > columns.length)
          throw new DomainError(
            'VALIDATION_ERROR',
            'A row has more fields than the header.',
          )
        return Object.fromEntries(columns.map((name, i) => [name, row[i] ?? '']))
      })
  }
  if (extension === 'xlsx') {
    validateZip(data)
    const book = new ExcelJS.Workbook()
    try {
      await book.xlsx.load(data as unknown as Parameters<typeof book.xlsx.load>[0])
    } catch {
      throw new DomainError('VALIDATION_ERROR', 'The workbook could not be read.')
    }
    sheets = book.worksheets.map((s) => s.name)
    const sheet = input.sheet
      ? book.getWorksheet(input.sheet)
      : book.worksheets.length === 1
        ? book.worksheets[0]
        : undefined
    if (!sheet)
      throw new DomainError(
        'VALIDATION_ERROR',
        `Choose one worksheet: ${sheets.join(', ')}`,
      )
    if (sheet.rowCount > 5001 || sheet.columnCount > 50)
      throw new DomainError(
        'VALIDATION_ERROR',
        'Workbook exceeds 5,000 records or 50 columns.',
      )
    const table: string[][] = []
    sheet.eachRow({ includeEmpty: true }, (row) => {
      const fields: string[] = []
      for (let i = 1; i <= sheet.columnCount; i++) {
        const cell = row.getCell(i)
        if (cell.type === ExcelJS.ValueType.Formula)
          throw new DomainError(
            'VALIDATION_ERROR',
            `Remove formula at ${cell.address}; formulas are not accepted.`,
          )
        fields.push(cell.text)
      }
      table.push(fields)
    })
    records = fromTable(table)
    columns = Object.keys(records[0] ?? {})
  } else {
    let text: string
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(data).replace(/^\uFEFF/, '')
    } catch {
      throw new DomainError('VALIDATION_ERROR', 'Use UTF-8 text.')
    }
    if (text.includes('\0'))
      throw new DomainError('VALIDATION_ERROR', 'Binary content is not supported.')
    if (extension === 'json') {
      let parsed: unknown
      try {
        parsed = JSON.parse(text)
      } catch {
        throw new DomainError(
          'VALIDATION_ERROR',
          'Invalid JSON. Use an array of flat objects.',
        )
      }
      if (
        !Array.isArray(parsed) ||
        parsed.some(
          (row) =>
            !row ||
            Array.isArray(row) ||
            typeof row !== 'object' ||
            Object.keys(row).length > 50 ||
            Object.values(row).some(
              (v) => v !== null && !['string', 'number', 'boolean'].includes(typeof v),
            ),
        )
      )
        throw new DomainError(
          'VALIDATION_ERROR',
          'Use an array of flat objects with at most 50 columns.',
        )
      records = parsed
      columns = [...new Set(records.flatMap((row) => Object.keys(row)))]
    } else if (extension === 'csv' || extension === 'txt') {
      records = fromTable(delimited(text, input.delimiter))
      columns = Object.keys(records[0] ?? {})
    } else throw new DomainError('VALIDATION_ERROR', 'Choose XLSX, CSV, TXT or JSON.')
  }
  if (!records.length || records.length > 5000 || columns.length > 50)
    throw new DomainError(
      'VALIDATION_ERROR',
      'Use 1–5,000 records and at most 50 columns.',
    )
  if (Object.values(input.mapping).some((column) => !columns.includes(column)))
    throw new DomainError(
      'VALIDATION_ERROR',
      'Map each required field to a column in the file.',
    )
  const rows: ImportRow[] = records.map((record, index) => {
    const value = (field: keyof Input['mapping']) =>
      String(record[input.mapping[field]] ?? '').trim()
    const officialId = value('officialId')
    const name = value('name')
    const originalCountry = value('country')
    const country = input.countries[originalCountry] ?? originalCountry.toUpperCase()
    const errors: string[] = []
    if (!officialId || officialId.length > 2000)
      errors.push('Official identifier is required (maximum 2,000 characters).')
    if (!name || name.length > 2000)
      errors.push('Name is required (maximum 2,000 characters).')
    if (!isoCountries.has(country)) errors.push('Map country to an ISO alpha-2 code.')
    if (Object.values(record).some((v) => String(v ?? '').length > 2000))
      errors.push('A field exceeds 2,000 characters.')
    return {
      row: index + 1,
      officialId,
      name,
      country,
      status: errors.length ? 'invalid' : 'ready',
      errors,
    }
  })
  const groups = new Map<string, ImportRow[]>()
  for (const row of rows) {
    if (row.officialId)
      groups.set(row.officialId, [...(groups.get(row.officialId) ?? []), row])
  }
  for (const group of groups.values())
    if (group.length > 1) {
      const first = group[0]
      const conflict = group.some(
        (r) => r.name !== first.name || r.country !== first.country,
      )
      group.forEach((row, i) => {
        if (conflict) {
          row.status = 'conflict'
          row.errors.push('Conflicting rows share this identifier. Correct all of them.')
        } else if (i > 0 && row.status === 'ready') {
          row.status = 'duplicate'
          row.errors.push('Identical duplicate; the first occurrence will be used.')
        }
      })
    }
  return {
    rows,
    columns,
    sheets,
    inputHash: createHash('sha256')
      .update(data)
      .update(
        JSON.stringify({
          mapping: input.mapping,
          delimiter: input.delimiter,
          sheet: input.sheet,
          countries: input.countries,
        }),
      )
      .digest('hex'),
  }
}
