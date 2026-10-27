import { execFileSync, spawn } from 'node:child_process';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { randomBytes, createHmac } from 'node:crypto';
const run = (...args) =>
  execFileSync('docker', args, { stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf8' });
mkdirSync('.local', { recursive: true });
let config;
if (existsSync('.local/config.json'))
  config = JSON.parse(readFileSync('.local/config.json', 'utf8'));
else {
  config = { password: randomBytes(24).toString('hex'), jwt: randomBytes(40).toString('hex') };
  writeFileSync('.local/config.json', JSON.stringify(config), { mode: 0o600 });
}
function token(role) {
  const head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    body = Buffer.from(
      JSON.stringify({
        role,
        iss: 'supabase-local',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 315360000,
      }),
    ).toString('base64url');
  return `${head}.${body}.${createHmac('sha256', config.jwt)
    .update(head + '.' + body)
    .digest('base64url')}`;
}
const anon = token('anon'),
  service = token('service_role');
if (!existsSync('.env.local'))
  writeFileSync(
    '.env.local',
    `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}\nSUPABASE_SERVICE_ROLE_KEY=${service}\nSITE_URL=http://localhost:3000\nPAYHERE_MODE=sandbox\n`,
    { mode: 0o600 },
  );
try {
  run('network', 'inspect', 'bdc-local');
} catch {
  run('network', 'create', 'bdc-local');
}
async function container(name, image, ports, vars, extra = []) {
  try {
    const state = run('inspect', '--format', '{{.State.Running}}', name).trim();
    if (state === 'true') return;
    run('start', name);
    return;
  } catch {}
  const envPath = `.local/${name}.env`;
  writeFileSync(
    envPath,
    Object.entries(vars)
      .map(([k, v]) => k + '=' + v)
      .join('\n'),
    { mode: 0o600 },
  );
  console.log('Starting ' + name + '…');
  run(
    'run',
    '-d',
    '--name',
    name,
    '--network',
    'bdc-local',
    ...ports.flatMap(([a, b]) => ['-p', `127.0.0.1:${a}:${b}`]),
    '--env-file',
    envPath,
    ...extra,
    image,
  );
}
await container(
  'bdc-db',
  'postgres:17-alpine',
  [[54322, 5432]],
  { POSTGRES_PASSWORD: config.password, POSTGRES_DB: 'postgres' },
  ['-v', 'bdc-pg:/var/lib/postgresql/data'],
);
for (let i = 0; i < 60; i++) {
  try {
    run('exec', 'bdc-db', 'pg_isready', '-U', 'postgres');
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 500));
  }
}
const bootstrap = `do $$ begin if not exists(select from pg_roles where rolname='anon') then create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; create role authenticator login password '${config.password}'; grant anon,authenticated,service_role to authenticator; create role supabase_auth_admin login createrole password '${config.password}'; create role supabase_storage_admin login password '${config.password}'; end if; end $$;
create schema if not exists auth authorization supabase_auth_admin;create schema if not exists storage authorization supabase_storage_admin;create extension if not exists pgcrypto;create extension if not exists "uuid-ossp";
grant all on schema public to postgres,service_role;grant usage on schema public,auth,storage to anon,authenticated,service_role;
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claims',true)::jsonb->>'sub','')::uuid $$;
create or replace function auth.role() returns text language sql stable as $$ select coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role',current_setting('role',true)) $$;
alter function auth.uid() owner to supabase_auth_admin;alter function auth.role() owner to supabase_auth_admin;
grant execute on all functions in schema auth to anon,authenticated,service_role;
alter default privileges for role postgres in schema public grant all on tables to service_role;alter default privileges for role postgres in schema public grant all on sequences to service_role;alter default privileges for role postgres in schema public grant execute on functions to service_role;`;
execFileSync(
  'docker',
  ['exec', '-i', 'bdc-db', 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1'],
  { input: bootstrap, stdio: ['pipe', 'pipe', 'pipe'] },
);
await container('bdc-mail', 'axllent/mailpit:v1.22.3', [[54324, 8025]], {});
await container('bdc-auth', 'supabase/gotrue:v2.188.1', [[54325, 9999]], {
  GOTRUE_API_HOST: '0.0.0.0',
  GOTRUE_API_PORT: '9999',
  API_EXTERNAL_URL: 'http://127.0.0.1:54321/auth/v1',
  GOTRUE_DB_DRIVER: 'postgres',
  GOTRUE_DB_DATABASE_URL: `postgres://supabase_auth_admin:${config.password}@bdc-db:5432/postgres?search_path=auth`,
  GOTRUE_SITE_URL: 'http://localhost:3000',
  GOTRUE_URI_ALLOW_LIST: 'http://localhost:3000/**,http://127.0.0.1:3000/**',
  GOTRUE_JWT_SECRET: config.jwt,
  GOTRUE_JWT_EXP: '3600',
  GOTRUE_JWT_AUD: 'authenticated',
  GOTRUE_JWT_DEFAULT_GROUP_NAME: 'authenticated',
  GOTRUE_JWT_ADMIN_ROLES: 'service_role',
  GOTRUE_DISABLE_SIGNUP: 'false',
  GOTRUE_MAILER_AUTOCONFIRM: 'false',
  GOTRUE_SMTP_HOST: 'bdc-mail',
  GOTRUE_SMTP_PORT: '1025',
  GOTRUE_SMTP_ADMIN_EMAIL: 'hello@local.blinddateclub.test',
  GOTRUE_SMTP_SENDER_NAME: 'Blind Date Club (local)',
  GOTRUE_MAILER_URLPATHS_CONFIRMATION: '/verify',
  GOTRUE_MAILER_URLPATHS_RECOVERY: '/verify',
  GOTRUE_SECURITY_CAPTCHA_ENABLED: 'false',
  GOTRUE_PASSWORD_MIN_LENGTH: '12',
  GOTRUE_RATE_LIMIT_EMAIL_SENT: '100',
  GOTRUE_SMS_AUTOCONFIRM: 'false',
});
await container('bdc-rest', 'postgrest/postgrest:v14.10', [[54326, 3000]], {
  PGRST_DB_URI: `postgres://authenticator:${config.password}@bdc-db:5432/postgres`,
  PGRST_DB_SCHEMAS: 'public',
  PGRST_DB_ANON_ROLE: 'anon',
  PGRST_JWT_SECRET: config.jwt,
  PGRST_DB_MAX_ROWS: '1000',
});
await container(
  'bdc-storage',
  'supabase/storage-api:v1.54.1',
  [[54327, 5000]],
  {
    ANON_KEY: anon,
    SERVICE_KEY: service,
    PGRST_JWT_SECRET: config.jwt,
    DATABASE_URL: `postgres://postgres:${config.password}@bdc-db:5432/postgres`,
    FILE_SIZE_LIMIT: '5242880',
    STORAGE_BACKEND: 'file',
    FILE_STORAGE_BACKEND_PATH: '/var/lib/storage',
    TENANT_ID: 'bdc-local',
    REGION: 'local',
    GLOBAL_S3_BUCKET: 'local',
    ENABLE_IMAGE_TRANSFORMATION: 'false',
    AUTH_JWT_SECRET: config.jwt,
  },
  ['-v', 'bdc-storage:/var/lib/storage'],
);
for (let i = 0; i < 60; i++) {
  try {
    const a = await fetch('http://127.0.0.1:54325/health');
    const s = await fetch('http://127.0.0.1:54327/status');
    if (a.ok && s.ok) break;
  } catch {}
  if (i === 59)
    throw Error(
      'Local Auth or Storage did not become healthy. Inspect docker logs bdc-auth / bdc-storage.',
    );
  await new Promise((r) => setTimeout(r, 1000));
}
let gatewayReady = false;
try {
  const response = await fetch('http://127.0.0.1:54321/auth/v1/health', {
    signal: AbortSignal.timeout(2000),
  });
  gatewayReady = response.ok && (await response.json()).name === 'GoTrue';
} catch {}
if (!gatewayReady) {
  const log = await import('node:fs').then((fs) => fs.openSync('.local/gateway.log', 'a'));
  const child = spawn(process.execPath, ['--env-file=.env.local', 'scripts/local-gateway.mjs'], {
    detached: true,
    stdio: ['ignore', log, log],
  });
  child.unref();
  writeFileSync('.local/gateway.pid', String(child.pid));
}
for (let i = 0; i < 30; i++) {
  try {
    const r = await fetch('http://127.0.0.1:54321/auth/v1/health', {
      signal: AbortSignal.timeout(2000),
    });
    if (r.ok) break;
  } catch {}
  if (i === 29)
    throw Error('The local API gateway did not become ready; check .local/gateway.log.');
  await new Promise((r) => setTimeout(r, 200));
}
console.log(
  'Local services started. Configuration is in ignored .env.local. No credentials were printed.',
);
