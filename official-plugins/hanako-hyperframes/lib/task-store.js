import fs from "node:fs/promises";
import path from "node:path";

export class TaskStore {
  constructor({ dataDir, now = () => Date.now() }) {
    if (!dataDir) throw new Error("TaskStore requires dataDir");
    this.dataDir = path.resolve(dataDir);
    this.filePath = path.join(this.dataDir, "tasks.json");
    this.now = now;
    this.tasks = new Map();
  }

  async init() {
    await fs.mkdir(this.dataDir, { recursive: true });
    await this.#load();
  }

  list() {
    return Array.from(this.tasks.values())
      .map(cloneTask)
      .sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id));
  }

  get(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Unknown HyperFrames task: ${taskId}`);
    return cloneTask(task);
  }

  async create(input = {}) {
    const now = this.now();
    const task = {
      id: this.#nextId(now),
      type: input.type || "task",
      projectId: input.projectId || null,
      command: Array.isArray(input.command) ? input.command.map(String) : [],
      status: "running",
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      result: null,
      error: null,
    };
    this.tasks.set(task.id, task);
    await this.#save();
    return cloneTask(task);
  }

  async complete(taskId, result = null) {
    const task = this.#require(taskId);
    const now = this.now();
    task.status = "completed";
    task.result = result;
    task.error = null;
    task.updatedAt = now;
    task.completedAt = now;
    await this.#save();
    return cloneTask(task);
  }

  async fail(taskId, error) {
    const task = this.#require(taskId);
    const now = this.now();
    task.status = "failed";
    task.result = null;
    task.error = error instanceof Error ? error.message : String(error || "Task failed");
    task.updatedAt = now;
    task.completedAt = now;
    await this.#save();
    return cloneTask(task);
  }

  async #load() {
    try {
      const data = JSON.parse(await fs.readFile(this.filePath, "utf8"));
      const tasks = Array.isArray(data.tasks) ? data.tasks : [];
      this.tasks = new Map(tasks.map((task) => [task.id, normalizeTask(task)]));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      this.tasks = new Map();
      await this.#save();
    }
  }

  async #save() {
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.writeFile(this.filePath, `${JSON.stringify({ schemaVersion: 1, tasks: this.list() }, null, 2)}\n`);
  }

  #nextId(now) {
    const base = `task-${now}`;
    if (!this.tasks.has(base)) return base;
    let index = 2;
    while (this.tasks.has(`${base}-${index}`)) {
      index += 1;
    }
    return `${base}-${index}`;
  }

  #require(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Unknown HyperFrames task: ${taskId}`);
    return task;
  }
}

function normalizeTask(task) {
  if (!task?.id) throw new Error("Task metadata entry is missing id");
  return {
    id: String(task.id),
    type: task.type || "task",
    projectId: task.projectId || null,
    command: Array.isArray(task.command) ? task.command.map(String) : [],
    status: task.status || "running",
    createdAt: Number(task.createdAt) || Date.now(),
    updatedAt: Number(task.updatedAt) || Number(task.createdAt) || Date.now(),
    completedAt: task.completedAt == null ? null : Number(task.completedAt),
    result: task.result ?? null,
    error: task.error ?? null,
  };
}

function cloneTask(task) {
  return {
    ...task,
    command: [...task.command],
    result: cloneJson(task.result),
  };
}

function cloneJson(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}
