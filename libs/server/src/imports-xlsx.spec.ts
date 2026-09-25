import ExcelJS from 'exceljs'
import { readImport } from './imports'
const base = {
  encoding: 'base64' as const,
  delimiter: ',' as const,
  mapping: { officialId: 'id', name: 'name', country: 'country' },
  countries: {},
}
it('reads an XLSX worksheet without losing textual leading zeroes', async () => {
  const book = new ExcelJS.Workbook()
  const sheet = book.addWorksheet('Teams')
  sheet.addRow(['id', 'name', 'country'])
  sheet.addRow(['001', 'Alpha', 'BR'])
  const content = Buffer.from(await book.xlsx.writeBuffer()).toString('base64')
  const preview = await readImport({ ...base, fileName: 'teams.xlsx', content })
  expect(preview.rows[0]).toMatchObject({
    officialId: '001',
    name: 'Alpha',
    status: 'ready',
  })
  expect(preview.sheets).toEqual(['Teams'])
})
it('requires worksheet selection and rejects formulas rather than trusting cached values', async () => {
  const book = new ExcelJS.Workbook()
  const sheet = book.addWorksheet('Teams')
  book.addWorksheet('Other')
  sheet.addRow(['id', 'name', 'country'])
  sheet.addRow(['001', { formula: 'CONCAT("A","B")', result: 'AB' }, 'BR'])
  const content = Buffer.from(await book.xlsx.writeBuffer()).toString('base64')
  await expect(readImport({ ...base, fileName: 'teams.xlsx', content })).rejects.toThrow(
    'Choose one worksheet',
  )
  await expect(
    readImport({ ...base, fileName: 'teams.xlsx', content, sheet: 'Teams' }),
  ).rejects.toThrow('Remove formula')
})
it('rejects oversized and corrupted workbook content before accepting rows', async () => {
  await expect(
    readImport({
      ...base,
      fileName: 'bad.xlsx',
      content: Buffer.from('not an XLSX zip').toString('base64'),
    }),
  ).rejects.toThrow()
  await expect(
    readImport({
      ...base,
      fileName: 'big.xlsx',
      content: Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64'),
    }),
  ).rejects.toThrow()
})

it('bounds actual ZIP expansion even when the directory lies about uncompressed size', async () => {
  const { deflateRawSync } = await import('node:zlib')
  const payload = deflateRawSync(Buffer.alloc(26 * 1024 * 1024, 65))
  const local = Buffer.alloc(31)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt16LE(8, 8)
  local.writeUInt32LE(payload.length, 18)
  local.writeUInt32LE(1, 22)
  local.writeUInt16LE(1, 26)
  local[30] = 97
  const central = Buffer.alloc(47)
  central.writeUInt32LE(0x02014b50, 0)
  central.writeUInt16LE(8, 10)
  central.writeUInt32LE(payload.length, 20)
  central.writeUInt32LE(1, 24)
  central.writeUInt16LE(1, 28)
  central[46] = 97
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(1, 8)
  end.writeUInt16LE(1, 10)
  end.writeUInt32LE(central.length, 12)
  end.writeUInt32LE(local.length + payload.length, 16)
  await expect(
    readImport({
      ...base,
      fileName: 'bomb.xlsx',
      content: Buffer.concat([local, payload, central, end]).toString('base64'),
    }),
  ).rejects.toThrow('supported ZIP limits')
})
