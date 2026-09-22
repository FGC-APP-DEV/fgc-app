// PGlite is a disposable test dependency, never an application persistence layer.
// Usage: node supabase/tests/run-pglite.mjs /absolute/path/to/pglite/dist/index.js
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await db.exec(`create role anon;create role authenticated;create role service_role;
create schema auth;create table auth.users(id uuid primary key,email text);create table auth.sessions(id uuid primary key,user_id uuid references auth.users,not_after timestamptz);
create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
create function auth.uid() returns uuid language sql stable as $$select (auth.jwt()->>'sub')::uuid$$;
grant usage on schema auth to authenticated;grant execute on all functions in schema auth to authenticated;`);
for (const file of (await readdir(path.join(root, 'migrations'))).sort()) {
  if (!file.endsWith('.sql')) continue;
  try { await db.exec(await readFile(path.join(root,'migrations',file),'utf8')); console.log(`PASS migration ${file}`); }
  catch(error) { console.error(`FAIL migration ${file}: ${error.message}`); process.exitCode=1; await db.close(); process.exit(); }
}
for (const file of (await readdir(path.join(root,'tests'))).sort()) {
 if(!file.endsWith('.sql')) continue;
 try { await db.exec(await readFile(path.join(root,'tests',file),'utf8')); console.log(`PASS suite ${file}`); }
 catch(error) { console.error(`FAIL suite ${file}: ${error.message}\n${error.where ?? ''}`); process.exitCode=1;break; }
}
await db.close();
