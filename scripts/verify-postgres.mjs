import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";
import { requirePostgresTestTarget } from "./postgres-test-guard.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
assert.equal(JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).name, "qbl-platform");
const context = "desktop-linux";
const runId = randomBytes(12).toString("hex");
const name = `qbl-pg-verify-${runId}`;
const database = `qbl_test_${runId}`;
const password = randomBytes(32).toString("hex");
const label = "com.qbl.postgres-test-run";
// Never inherit database/provider secrets, NODE_OPTIONS, or a remote Docker override.
const osKeys = /^(path|systemroot|windir|comspec|pathext|temp|tmp|userprofile|homedrive|homepath|appdata|localappdata|programdata|programfiles|programfiles\(x86\)|home|lang|lc_all)$/i;
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => osKeys.test(key)));
Object.assign(env, { NODE_ENV: "test", NEXT_TELEMETRY_DISABLED: "1", QBL_POSTGRES_TEST_RUN_ID: runId });
let connectionString = "";
let containerId;
let containerCreationAttempted = false;
let volumeCreationAttempted = false;
let volumeCreated = false;
let child;
let interrupted = false;
const redact = (value) => String(value ?? "").replaceAll(password, "[TEST_SECRET]").replace(/postgres(?:ql)?:\/\/[^\s"']+/g, "[TEST_DATABASE_URL]");

function docker(args, extraEnv = {}) {
  try {
    return execFileSync("docker", ["--context", context, ...args], {
      cwd: root, env: { ...env, ...extraEnv }, encoding: "utf8", timeout: 30_000,
      windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    throw new Error(`Docker ${args[0]} failed: ${redact(error.stderr || error.message)}`);
  }
}

async function node(args) {
  if (interrupted) throw new Error("TEST_INTERRUPTED");
  await new Promise((resolve, reject) => {
    child = spawn(process.execPath, args, { cwd: root, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    const timer = setTimeout(() => { child?.kill(); reject(new Error("TEST_CHILD_TIMEOUT")); }, 180_000);
    // Buffer complete lines so a credential split across stream chunks is still redacted.
    for (const [input, output] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
      let pending = "";
      input.setEncoding("utf8");
      input.on("data", (data) => {
        pending += data;
        const lines = pending.split("\n");
        pending = lines.pop();
        for (const line of lines) output.write(`${redact(line)}\n`);
      });
      input.on("end", () => { if (pending) output.write(redact(pending)); });
    }
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code) => {
      clearTimeout(timer); child = undefined;
      if (code === 0) resolve(); else reject(new Error(`Verification child failed (${code})`));
    });
  });
}

async function connect() {
  const client = new pg.Client({ connectionString, connectionTimeoutMillis: 3000, statement_timeout: 10_000 });
  try { await client.connect(); return client; } catch (error) { await client.end().catch(() => {}); throw error; }
}

async function waitForPostgres() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline && !interrupted) {
    try { const client = await connect(); await client.end(); return; } catch { /* startup only */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("POSTGRES_STARTUP_TIMEOUT");
}

function assertOwnedContainer() {
  const info = JSON.parse(docker(["inspect", containerId]))[0];
  assert.equal(info.Id, containerId);
  assert.equal(info.Config.Labels[label], runId);
  assert.equal(info.Name, `/${name}`);
  return info;
}

function configureConnection(info) {
  assert.deepEqual(info.Mounts.map((m) => [m.Type, m.Name, m.Destination]), [["volume", name, "/var/lib/postgresql/data"]]);
  const binding = info.NetworkSettings.Ports["5432/tcp"];
  assert.equal(binding.length, 1);
  assert.equal(binding[0].HostIp, "127.0.0.1");
  connectionString = `postgresql://qbl_test:${password}@127.0.0.1:${binding[0].HostPort}/${database}`;
  env.DATABASE_URL = connectionString;
  env.DIRECT_URL = connectionString;
  requirePostgresTestTarget(env);
  return binding[0].HostPort;
}

async function snapshot(client) {
  const result = {};
  // Static identifiers only. Fingerprints never expose row contents or credentials.
  for (const table of ["LogesTechsEvent", "DeliveryOrder", "OperationalCase", "DeliveryCommitment", "AuditLog", "IntegrationJobRun", "_prisma_migrations"]) {
    result[table] = (await client.query(`SELECT count(*)::int AS count, md5(COALESCE(string_agg(to_jsonb(t)::text, '' ORDER BY to_jsonb(t)::text), '')) AS fingerprint FROM "${table}" t`)).rows[0];
  }
  return result;
}

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => {
  interrupted = true;
  child?.kill();
});

try {
  const endpoint = JSON.parse(docker(["context", "inspect", context, "--format", "{{json .Endpoints.docker.Host}}"]));
  assert.equal(endpoint, "npipe:////./pipe/dockerDesktopLinuxEngine", "Not the approved local engine");
  const beforeContainers = docker(["container", "ls", "--all", "--format", "{{.ID}}"]).split(/\r?\n/).filter(Boolean);
  const beforeVolumes = docker(["volume", "ls", "--format", "{{.Name}}"]).split(/\r?\n/).filter(Boolean);
  assert.ok(!beforeVolumes.includes(name));
  const image = JSON.parse(docker(["image", "inspect", "postgres:16-alpine"]))[0];
  const digest = image.RepoDigests.find((value) => value.startsWith("postgres@sha256:"));
  assert.ok(digest, "An existing digest-pinned official PostgreSQL image is required; no pull is performed");
  console.log(`PostgreSQL image: ${digest}`);
  volumeCreationAttempted = true;
  docker(["volume", "create", "--label", `${label}=${runId}`, name]);
  volumeCreated = true;
  containerCreationAttempted = true;
  containerId = docker([
    "run", "--detach", "--pull=never", "--name", name, "--label", `${label}=${runId}`,
    "--memory", "512m", "--cpus", "1", "--publish", "127.0.0.1::5432",
    "--mount", `type=volume,source=${name},target=/var/lib/postgresql/data`,
    "--env", "POSTGRES_USER", "--env", "POSTGRES_PASSWORD", "--env", "POSTGRES_DB",
    digest,
  ], { POSTGRES_USER: "qbl_test", POSTGRES_PASSWORD: password, POSTGRES_DB: database });
  assert.match(containerId, /^[a-f0-9]{64}$/);
  const info = assertOwnedContainer();
  const initialPort = configureConnection(info);
  await waitForPostgres();
  let client = await connect();
  try {
    const identity = (await client.query("SELECT current_database() AS database, current_user AS username, current_setting('server_version') AS version, current_setting('server_version_num')::int AS version_num")).rows[0];
    assert.equal(identity.database, database); assert.equal(identity.username, "qbl_test");
    assert.ok(identity.version_num >= 160000 && identity.version_num < 170000);
    assert.equal((await client.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='public'")).rows[0].n, 0);
    console.log(`Verified isolated PostgreSQL ${identity.version}; loopback port ${initialPort}; empty database`);
  } finally { await client.end(); }
  const prismaCli = path.join(root, "node_modules/prisma/build/index.js");
  await node([prismaCli, "migrate", "deploy", "--config", "scripts/postgres-test-prisma.config.ts"]);
  // A second deploy must be a no-op, not a reset or duplicate migration.
  await node([prismaCli, "migrate", "deploy", "--config", "scripts/postgres-test-prisma.config.ts"]);
  client = await connect();
  try {
    const applied = (await client.query('SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY migration_name')).rows;
    const expected = readdirSync(path.join(root, "prisma/migrations"), { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => x.name).sort();
    assert.deepEqual(applied.map((x) => x.migration_name), expected);
    assert.ok(applied.every((x) => x.finished_at && !x.rolled_back_at));
    console.log(`PASS complete migration ledger (${applied.length} migrations), second deploy unchanged`);
  } finally { await client.end(); }
  await node(["--conditions=react-server", "--import", "tsx", "scripts/postgres-concurrency-suite.ts"]);
  client = await connect();
  let beforeRestart;
  try { beforeRestart = await snapshot(client); } finally { await client.end(); }
  // Restart only our test container, keeping its own new volume, then reconnect.
  assertOwnedContainer();
  docker(["restart", "--time", "10", containerId]);
  // Docker may allocate another ephemeral host port on restart. Verify it again.
  configureConnection(assertOwnedContainer());
  await waitForPostgres();
  client = await connect();
  try {
    assert.deepEqual(await snapshot(client), beforeRestart, "Persisted rows changed across PostgreSQL restart");
    const result = (await client.query('SELECT "processedCount" FROM "IntegrationJobRun" WHERE name=$1', [`postgres-verification-${runId}`])).rows[0];
    assert.ok(result?.processedCount >= 7, "Completed test marker did not survive PostgreSQL restart");
    assert.ok((await client.query('SELECT count(*)::int AS n FROM "LogesTechsEvent"')).rows[0].n > 0);
    assert.ok((await client.query('SELECT count(*)::int AS n FROM "OperationalCase"')).rows[0].n > 0);
    console.log("PASS database restart persistence (exact row counts/fingerprints across seven tables)");
  } finally { await client.end(); }
  assert.ok(beforeContainers.every((id) => docker(["container", "ls", "--all", "--format", "{{.ID}}"]).split(/\r?\n/).includes(id)));
  assert.ok(beforeVolumes.every((value) => docker(["volume", "ls", "--format", "{{.Name}}"]).split(/\r?\n/).includes(value)));
  console.log("POSTGRES_VERIFICATION_PASSED (local only; hosted staging and production remain unverified)");
} catch (error) {
  console.error(redact(error.stack || error));
  process.exitCode = 1;
} finally {
  try {
    // A timed-out docker run may have created the container before returning its ID.
    if (containerCreationAttempted && !containerId) {
      const matches = docker(["container", "ls", "--all", "--no-trunc", "--filter", `label=${label}=${runId}`, "--format", "{{.ID}}"]).split(/\r?\n/).filter(Boolean);
      assert.ok(matches.length <= 1);
      containerId = matches[0];
    }
    if (volumeCreationAttempted && !volumeCreated) {
      const matches = docker(["volume", "ls", "--filter", `label=${label}=${runId}`, "--format", "{{.Name}}"]).split(/\r?\n/).filter(Boolean);
      assert.ok(matches.length <= 1);
      if (matches.length) { assert.equal(matches[0], name); volumeCreated = true; }
    }
    if (containerId) { assertOwnedContainer(); docker(["rm", "--force", "--volumes", containerId]); }
    if (volumeCreated) {
      const volume = JSON.parse(docker(["volume", "inspect", name]))[0];
      assert.equal(volume.Name, name); assert.equal(volume.Labels[label], runId);
      docker(["volume", "rm", name]);
    }
    assert.equal(docker(["container", "ls", "--all", "--filter", `label=${label}=${runId}`, "--format", "{{.ID}}"]), "");
    assert.equal(docker(["volume", "ls", "--filter", `label=${label}=${runId}`, "--format", "{{.Name}}"]), "");
    console.log("CLEANUP_PASSED: removed only this run's labeled synthetic container/volume");
  } catch (error) {
    console.error(`CLEANUP_BLOCKED for ${name}: ${redact(error.message)}`);
    process.exitCode = 1;
  }
}
