import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export function shouldRunMigrations(vercelEnv = process.env.VERCEL_ENV) {
  return vercelEnv === "production";
}

function run(name, args) {
  const windowsEntrypoints = {
    next: ["next", "dist", "bin", "next"],
    prisma: ["prisma", "build", "index.js"],
  };
  const command = process.platform === "win32"
    ? process.execPath
    : join(process.cwd(), "node_modules", ".bin", name);
  const commandArgs = process.platform === "win32"
    ? [join(process.cwd(), "node_modules", ...windowsEntrypoints[name]), ...args]
    : args;
  const result = spawnSync(command, commandArgs, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

export function runVercelBuild(vercelEnv = process.env.VERCEL_ENV) {
  if (shouldRunMigrations(vercelEnv)) {
    run("prisma", ["migrate", "deploy"]);
  } else {
    console.info(`Skipping database migrations for Vercel environment: ${vercelEnv ?? "unknown"}`);
  }

  run("next", ["build", "--webpack"]);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) runVercelBuild();
