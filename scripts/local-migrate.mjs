import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
const sql = (s) =>
  execFileSync(
    'docker',
    ['exec', '-i', 'bdc-db', 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At'],
    { input: s, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  );
// GoTrue's initial bootstrap includes legacy helpers; use the modern JWT claims helpers.
sql(
  `create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claims',true)::jsonb->>'sub','')::uuid $$;create or replace function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claims',true)::jsonb->>'role' $$;create schema if not exists bdc_migrations;create table if not exists bdc_migrations.applied(name text primary key,applied_at timestamptz default now());`,
);
for (const file of readdirSync('supabase/migrations')
  .filter((x) => x.endsWith('.sql'))
  .sort()) {
  if (sql(`select 1 from bdc_migrations.applied where name='${file}'`).trim() === '1') continue;
  try {
    sql(
      'begin;\n' +
        readFileSync('supabase/migrations/' + file, 'utf8') +
        `\ninsert into bdc_migrations.applied(name) values('${file}');commit;`,
    );
    console.log('Applied ' + file);
  } catch (e) {
    console.error(e.stderr?.toString() ?? e.message);
    process.exit(1);
  }
}
sql("notify pgrst,'reload schema';");
