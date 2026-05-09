import fs from "node:fs";
import { CommandRunner } from "./lib/command-runner.js";
import { PreviewManager } from "./lib/preview-manager.js";
import { ProjectStore } from "./lib/project-store.js";
import { TaskStore } from "./lib/task-store.js";

export default class HanakoHyperFramesPlugin {
  async onload() {
    const { dataDir, log } = this.ctx;
    fs.mkdirSync(dataDir, { recursive: true });

    const projects = new ProjectStore({ dataDir });
    const tasks = new TaskStore({ dataDir });
    await projects.init();
    await tasks.init();

    const runtime = {
      projects,
      tasks,
      getRunner: async () => new CommandRunner({
        command: await readConfig(this.ctx, "hyperframesCommand", "npx --yes hyperframes"),
        disableTelemetry: await readConfig(this.ctx, "disableTelemetry", true),
      }),
      getPreviewManager: async () => {
        if (!runtime.previewManager) {
          runtime.previewManager = new PreviewManager({
            command: await readConfig(this.ctx, "hyperframesCommand", "npx --yes hyperframes"),
            disableTelemetry: await readConfig(this.ctx, "disableTelemetry", true),
            log,
          });
        }
        return runtime.previewManager;
      },
    };

    this.ctx._hyperframes = runtime;

    this.register(() => {
      runtime.previewManager?.stopAll();
      delete this.ctx._hyperframes;
    });

    log.info("hanako-hyperframes plugin loaded");
  }
}

async function readConfig(ctx, key, fallback) {
  try {
    const value = await ctx.config?.get?.(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}
