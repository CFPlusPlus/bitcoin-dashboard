import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const useCloudflare = process.argv.includes("--cloudflare");

loadDevVars(path.join(process.cwd(), ".dev.vars"));

const nextBinPath = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBinPath, "dev"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_DEV_USE_CLOUDFLARE: useCloudflare ? "true" : "false",
  },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

function loadDevVars(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const fileContents = readFileSync(filePath, "utf8");

  for (const rawLine of fileContents.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    const value = line.slice(separatorIndex + 1).trim();
    process.env[key] = parseEnvValue(value);
  }
}

function parseEnvValue(value) {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    const quote = value[0];
    const innerValue = value.slice(1, -1);

    if (quote === '"') {
      try {
        return JSON.parse(value);
      } catch {
        return innerValue;
      }
    }

    return innerValue;
  }

  return value;
}
