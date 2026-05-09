import fs from "node:fs/promises";
import path from "node:path";

export const name = "render-project";
export const description = "Render a HyperFrames project to MP4 or WebM and attach the output to the current Hanako session when possible.";

export const parameters = {
  type: "object",
  properties: {
    projectId: {
      type: "string",
      description: "HyperFrames project id.",
    },
    format: {
      type: "string",
      enum: ["mp4", "webm"],
      description: "Output format. Defaults to mp4.",
    },
    fps: {
      type: "number",
      enum: [24, 30, 60],
      description: "Render FPS. Defaults to 30.",
    },
    quality: {
      type: "string",
      enum: ["draft", "standard", "high"],
      description: "Render quality. Defaults to standard.",
    },
  },
  required: ["projectId"],
};

export async function execute(input, ctx) {
  const runtime = requireRuntime(ctx);
  const project = runtime.projects.getProject(input.projectId);
  const options = normalizeOptions(input);
  const outputPath = runtime.projects.resolveProjectPath(
    project.id,
    path.join("renders", `${safeName(project.title)}-${Date.now()}.${options.format}`),
  );
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const args = [
    "render",
    "--output",
    outputPath,
    "--format",
    options.format,
    "--fps",
    String(options.fps),
    "--quality",
    options.quality,
  ];
  const task = await runtime.tasks.create({
    type: "render",
    projectId: project.id,
    command: ["hyperframes", ...args],
  });
  const result = await (await runtime.getRunner()).run(args, { cwd: project.root });

  if (!result.ok) {
    await runtime.tasks.fail(task.id, result.error);
    return {
      content: [{ type: "text", text: `HyperFrames 渲染失败：${result.error}` }],
      details: { task: runtime.tasks.get(task.id), result },
    };
  }

  const stat = await fs.stat(outputPath).catch(() => null);
  const output = await runtime.projects.addOutput(project.id, {
    filePath: outputPath,
    label: path.basename(outputPath),
    format: options.format,
    bytes: stat?.size ?? null,
  });
  await runtime.tasks.complete(task.id, { output, stdout: result.stdout, stderr: result.stderr });

  const response = {
    content: [{ type: "text", text: `已渲染 HyperFrames 视频：${output.label}` }],
    details: {
      task: runtime.tasks.get(task.id),
      output,
    },
  };

  if (ctx.sessionPath && typeof ctx.stageFile === "function") {
    const staged = ctx.stageFile({
      sessionPath: ctx.sessionPath,
      filePath: output.filePath,
      label: output.label,
    });
    response.details.media = { items: [staged.mediaItem] };
  }

  return response;
}

function requireRuntime(ctx) {
  if (!ctx._hyperframes?.projects || !ctx._hyperframes?.tasks) {
    throw new Error("HyperFrames 插件尚未初始化，请确认 full-access 插件已启用。");
  }
  return ctx._hyperframes;
}

function normalizeOptions(input) {
  return {
    format: input.format === "webm" ? "webm" : "mp4",
    fps: [24, 30, 60].includes(Number(input.fps)) ? Number(input.fps) : 30,
    quality: ["draft", "standard", "high"].includes(input.quality) ? input.quality : "standard",
  };
}

function safeName(value) {
  return String(value || "video")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "video";
}
