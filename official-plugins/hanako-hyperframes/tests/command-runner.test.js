import assert from "node:assert/strict";
import test from "node:test";
import { CommandRunner, parseCommandLine } from "../lib/command-runner.js";

test("parses command strings without using a shell", () => {
  assert.deepEqual(parseCommandLine("npx --yes hyperframes"), ["npx", "--yes", "hyperframes"]);
  assert.deepEqual(parseCommandLine("node \"/tmp/with space/cli.js\""), ["node", "/tmp/with space/cli.js"]);
});

test("runs hyperframes commands with telemetry disabled by default", async () => {
  const calls = [];
  const runner = new CommandRunner({
    command: "npx --yes hyperframes",
    spawn: async (file, args, options) => {
      calls.push({ file, args, options });
      return { code: 0, stdout: "ok", stderr: "" };
    },
  });

  const result = await runner.run(["lint", "--json"], { cwd: "/tmp/project" });

  assert.equal(result.ok, true);
  assert.equal(result.stdout, "ok");
  assert.equal(calls[0].file, "npx");
  assert.deepEqual(calls[0].args, ["--yes", "hyperframes", "lint", "--json"]);
  assert.equal(calls[0].options.cwd, "/tmp/project");
  assert.equal(calls[0].options.env.HYPERFRAMES_NO_TELEMETRY, "1");
});

test("returns structured command failures", async () => {
  const runner = new CommandRunner({
    command: "hyperframes",
    spawn: async () => ({ code: 2, stdout: "", stderr: "lint failed" }),
  });

  const result = await runner.run(["lint"], { cwd: "/tmp/project" });

  assert.equal(result.ok, false);
  assert.equal(result.code, 2);
  assert.equal(result.error, "lint failed");
});
