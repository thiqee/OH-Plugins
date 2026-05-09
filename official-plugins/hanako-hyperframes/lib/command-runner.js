import { spawn } from "node:child_process";

export class CommandRunner {
  constructor({
    command = "npx --yes hyperframes",
    env = {},
    disableTelemetry = true,
    spawn: spawnImpl = spawnPromise,
  } = {}) {
    this.command = command;
    this.env = env;
    this.disableTelemetry = disableTelemetry;
    this.spawn = spawnImpl;
  }

  async run(args = [], { cwd } = {}) {
    const [file, ...baseArgs] = parseCommandLine(this.command);
    if (!file) throw new Error("HyperFrames command is empty");
    const finalArgs = [...baseArgs, ...args.map(String)];
    const env = {
      ...process.env,
      ...this.env,
      ...(this.disableTelemetry ? { HYPERFRAMES_NO_TELEMETRY: "1" } : {}),
    };

    const result = await this.spawn(file, finalArgs, { cwd, env });
    const ok = result.code === 0;
    const stderr = result.stderr || "";
    const stdout = result.stdout || "";
    return {
      ok,
      code: result.code,
      stdout,
      stderr,
      error: ok ? null : (stderr.trim() || stdout.trim() || `Command failed with exit code ${result.code}`),
      command: [file, ...finalArgs],
    };
  }

  async diagnostics({ cwd } = {}) {
    const version = await this.run(["--version"], { cwd });
    return {
      ok: version.ok,
      checks: [
        {
          id: "hyperframes",
          label: "HyperFrames CLI",
          ok: version.ok,
          detail: version.ok ? version.stdout.trim() : version.error,
        },
      ],
    };
  }
}

export function parseCommandLine(input) {
  const parts = [];
  let current = "";
  let quote = null;
  let escaping = false;

  for (const char of String(input || "").trim()) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }
    if (char === "\\") {
      escaping = true;
      continue;
    }
    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }
    if (char === "\"" || char === "'") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) {
        parts.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }
  if (escaping) current += "\\";
  if (quote) throw new Error("Unclosed quote in command");
  if (current) parts.push(current);
  return parts;
}

function spawnPromise(file, args, options) {
  return new Promise((resolve) => {
    const child = spawn(file, args, {
      ...options,
      shell: false,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      resolve({ code: 127, stdout, stderr: error.message });
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}
