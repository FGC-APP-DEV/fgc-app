import ExcelJS from 'exceljs';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { importPreviewInput, type ImportRow } from '@fgc/contracts';
import { DomainError } from './errors';

type Input = z.infer<typeof importPreviewInput>;
const isoCountries = new Set('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' '));
function delimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false; let closed = false;
  const push = () => { if (field.length > 2000) throw new DomainError('VALIDATION_ERROR', 'A field exceeds 2,000 characters.'); row.push(field); field = ''; closed = false; if (row.length > 50) throw new DomainError('VALIDATION_ERROR', 'Files may contain at most 50 columns.'); };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) { if (char === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else { quoted = false; closed = true; } } else field += char; continue; }
    if (char === delimiter) push();
    else if (char === '\n' || char === '\r') { if (char === '\r' && text[i + 1] === '\n') i++; push(); rows.push(row); row = []; if (rows.length > 5001) throw new DomainError('VALIDATION_ERROR', 'Files may contain at most 5,000 records.'); }
    else if (char === '"' && !field && !closed) quoted = true;
    else { if (closed || char === '"') throw new DomainError('VALIDATION_ERROR', 'Malformed quoted field.'); field += char; }
  }
  if (quoted) throw new DomainError('VALIDATION_ERROR', 'A quoted field is not closed.');
  if (field || row.length) { push(); rows.push(row); }
  return rows;
}
function validateZip(data: Buffer): void {
  let total = 0; let entries = 0;
  for (let i = 0; i + 46 <= data.length; i++) {
    if (data.readUInt32LE(i) !== 0x02014b50) continue;
    const flags = data.readUInt16LE(i + 8); const size = data.readUInt32LE(i + 24);
    const nameLength = data.readUInt16LE(i + 28); const extraLength = data.readUInt16LE(i + 30); const commentLength = data.readUInt16LE(i + 32);
    const name = data.subarray(i + 46, i + 46 + nameLength).toString(); total += size; entries++;
    if (flags & 1 || /vbaProject|macros|externalLinks/i.test(name) || total > 25 * 1024 * 1024 || entries > 10000) throw new DomainError('VALIDATION_ERROR', 'Encrypted, macro-enabled, linked, or oversized workbooks are not supported.');
    i += 45 + nameLength + extraLength + commentLength;
  }
  if (!entries) throw new DomainError('VALIDATION_ERROR', 'The workbook is corrupt.');
}
export async function readImport(input: Input): Promise<{ rows: ImportRow[]; columns: string[]; sheets?: string[]; inputHash: string }> {
  const data = input.encoding === 'base64' ? Buffer.from(input.content, 'base64') : Buffer.from(input.content, 'utf8');
  if (data.length > 5 * 1024 * 1024) throw new DomainError('PAYLOAD_TOO_LARGE');
  if (!data.length) throw new DomainError('VALIDATION_ERROR', 'The file is empty.');
  const extension = input.fileName.split('.').pop()?.toLowerCase(); let records: Record<string, unknown>[]; let columns: string[]; let sheets: string[] | undefined;
  const fromTable = (table: string[][]) => {
    columns = table.shift()?.map(v => v.trim()) ?? [];
    if (!columns.length || columns.length > 50 || columns.some(v => !v) || new Set(columns).size !== columns.length) throw new DomainError('VALIDATION_ERROR', 'Use distinct, nonempty column headers.');
    return table.filter(row => row.some(v => v.trim())).map(row => { if (row.length > columns.length) throw new DomainError('VALIDATION_ERROR', 'A row has more fields than the header.'); return Object.fromEntries(columns.map((name, i) => [name, row[i] ?? ''])); });
  };
  if (extension === 'xlsx') {
    validateZip(data); const book = new ExcelJS.Workbook();
    try { await book.xlsx.load(data as unknown as Parameters<typeof book.xlsx.load>[0]); } catch { throw new DomainError('VALIDATION_ERROR', 'The workbook could not be read.'); }
    sheets = book.worksheets.map(s => s.name);
    const sheet = input.sheet ? book.getWorksheet(input.sheet) : book.worksheets.length === 1 ? book.worksheets[0] : undefined;
    if (!sheet) throw new DomainError('VALIDATION_ERROR', `Choose one worksheet: ${sheets.join(', ')}`);
    if (sheet.rowCount > 5001 || sheet.columnCount > 50) throw new DomainError('VALIDATION_ERROR', 'Workbook exceeds 5,000 records or 50 columns.');
    const table: string[][] = [];
    sheet.eachRow({ includeEmpty: true }, row => { const fields: string[] = []; for (let i = 1; i <= sheet.columnCount; i++) { const cell = row.getCell(i); if (cell.type === ExcelJS.ValueType.Formula) throw new DomainError('VALIDATION_ERROR', `Remove formula at ${cell.address}; formulas are not accepted.`); fields.push(cell.text); } table.push(fields); });
    records = fromTable(table); columns = Object.keys(records[0] ?? {});
  } else {
    let text: string; try { text = new TextDecoder('utf-8', { fatal: true }).decode(data).replace(/^\uFEFF/, ''); } catch { throw new DomainError('VALIDATION_ERROR', 'Use UTF-8 text.'); }
    if (text.includes('\0')) throw new DomainError('VALIDATION_ERROR', 'Binary content is not supported.');
    if (extension === 'json') {
      let parsed: unknown; try { parsed = JSON.parse(text); } catch { throw new DomainError('VALIDATION_ERROR', 'Invalid JSON. Use an array of flat objects.'); }
      if (!Array.isArray(parsed) || parsed.some(row => !row || Array.isArray(row) || typeof row !== 'object' || Object.keys(row).length > 50 || Object.values(row).some(v => v !== null && !['string', 'number', 'boolean'].includes(typeof v)))) throw new DomainError('VALIDATION_ERROR', 'Use an array of flat objects with at most 50 columns.');
      records = parsed; columns = [...new Set(records.flatMap(row => Object.keys(row)))];
    } else if (extension === 'csv' || extension === 'txt') { records = fromTable(delimited(text, input.delimiter)); columns = Object.keys(records[0] ?? {}); }
    else throw new DomainError('VALIDATION_ERROR', 'Choose XLSX, CSV, TXT or JSON.');
  }
  if (!records.length || records.length > 5000 || columns.length > 50) throw new DomainError('VALIDATION_ERROR', 'Use 1–5,000 records and at most 50 columns.');
  if (Object.values(input.mapping).some(column => !columns.includes(column))) throw new DomainError('VALIDATION_ERROR', 'Map each required field to a column in the file.');
  const rows: ImportRow[] = records.map((record, index) => {
    const value = (field: keyof Input['mapping']) => String(record[input.mapping[field]] ?? '').trim();
    const officialId = value('officialId'); const name = value('name'); const originalCountry = value('country'); const country = input.countries[originalCountry] ?? originalCountry.toUpperCase();
    const errors: string[] = [];
    if (!officialId || officialId.length > 2000) errors.push('Official identifier is required (maximum 2,000 characters).');
    if (!name || name.length > 2000) errors.push('Name is required (maximum 2,000 characters).');
    if (!isoCountries.has(country)) errors.push('Map country to an ISO alpha-2 code.');
    if (Object.values(record).some(v => String(v ?? '').length > 2000)) errors.push('A field exceeds 2,000 characters.');
    return { row: index + 1, officialId, name, country, status: errors.length ? 'invalid' : 'ready', errors };
  });
  const groups = new Map<string, ImportRow[]>();
  for (const row of rows) { if (row.officialId) groups.set(row.officialId, [...(groups.get(row.officialId) ?? []), row]); }
  for (const group of groups.values()) if (group.length > 1) {
    const first = group[0]; const conflict = group.some(r => r.name !== first.name || r.country !== first.country);
    group.forEach((row, i) => { if (conflict) { row.status = 'conflict'; row.errors.push('Conflicting rows share this identifier. Correct all of them.'); } else if (i > 0 && row.status === 'ready') { row.status = 'duplicate'; row.errors.push('Identical duplicate; the first occurrence will be used.'); } });
  }
  return { rows, columns, sheets, inputHash: createHash('sha256').update(data).update(JSON.stringify({ mapping: input.mapping, delimiter: input.delimiter, sheet: input.sheet, countries: input.countries })).digest('hex') };
}
