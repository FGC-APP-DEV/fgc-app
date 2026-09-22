import * as imports from './imports';

const mapping = { officialId: 'id', name: 'name', country: 'country' };
it('preserves leading zeros and groups duplicates without choosing conflicting rows', async () => {
  const rows = [{ id: '001', name: 'Alpha', country: 'BR' }, { id: '001', name: 'Alpha', country: 'BR' }, { id: '002', name: 'Beta', country: 'US' }, { id: '002', name: 'Other', country: 'US' }, { id: '003', name: '', country: 'BR' }];
  const preview = await imports.readImport({ fileName: 'teams.json', content: JSON.stringify(rows), encoding: 'utf8', delimiter: ',', mapping, countries: {} });
  expect(preview.rows.map(r => [r.officialId, r.status])).toEqual([['001', 'ready'], ['001', 'duplicate'], ['002', 'conflict'], ['002', 'conflict'], ['003', 'invalid']]);
});
it('reads quoted CSV fields and rejects corrupt and nested data', async () => {
  const preview = await imports.readImport({ fileName: 'teams.csv', content: 'id,name,country\r\n01,"A, team",BR', encoding: 'utf8', delimiter: ',', mapping, countries: {} });
  expect(preview.rows[0].name).toBe('A, team');
  await expect(imports.readImport({ fileName: 'teams.json', content: '[{"id": {"nested":1}}]', encoding: 'utf8', delimiter: ',', mapping, countries: {} })).rejects.toThrow();
  await expect(imports.readImport({ fileName: 'teams.txt', content: 'id,name,country\n1,"broken,BR', encoding: 'utf8', delimiter: ',', mapping, countries: {} })).rejects.toThrow();
});
