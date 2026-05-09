import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { TaskStore } from "../lib/task-store.js";

async function makeStore() {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "hana-hyperframes-tasks-"));
  const store = new TaskStore({ dataDir, now: () => 1715200000000 });
  await store.init();
  return store;
}

test("creates and persists running tasks", async () => {
  const store = await makeStore();

  const task = await store.create({
    type: "render",
    projectId: "launch",
    command: ["hyperframes", "render"],
  });

  assert.equal(task.id, "task-1715200000000");
  assert.equal(task.status, "running");
  assert.equal(task.projectId, "launch");
  assert.deepEqual(store.list().map((item) => item.id), ["task-1715200000000"]);
});

test("completes and fails tasks with explicit state", async () => {
  const store = await makeStore();
  const first = await store.create({ type: "lint", projectId: "a" });
  const second = await store.create({ type: "render", projectId: "b" });

  await store.complete(first.id, { output: "ok" });
  await store.fail(second.id, new Error("render failed"));

  assert.equal(store.get(first.id).status, "completed");
  assert.deepEqual(store.get(first.id).result, { output: "ok" });
  assert.equal(store.get(second.id).status, "failed");
  assert.equal(store.get(second.id).error, "render failed");
});
