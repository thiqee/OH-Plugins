export const name = "lint-project";
export const description = "Run HyperFrames lint on a workspace project.";

export const parameters = {
  type: "object",
  properties: {
    projectId: {
      type: "string",
      description: "HyperFrames project id.",
    },
  },
  required: ["projectId"],
};

export async function execute(input, ctx) {
  const runtime = requireRuntime(ctx);
  const project = runtime.projects.getProject(input.projectId);
  const task = await runtime.tasks.create({
    type: "lint",
    projectId: project.id,
    command: ["hyperframes", "lint", "--json"],
  });
  const result = await (await runtime.getRunner()).run(["lint", "--json"], { cwd: project.root });
  if (result.ok) {
    await runtime.tasks.complete(task.id, { stdout: result.stdout, stderr: result.stderr });
  } else {
    await runtime.tasks.fail(task.id, result.error);
  }

  return {
    content: [
      {
        type: "text",
        text: result.ok
          ? `HyperFrames lint 通过：${project.title}。`
          : `HyperFrames lint 失败：${result.error}`,
      },
    ],
    details: { task: runtime.tasks.get(task.id), result },
  };
}

function requireRuntime(ctx) {
  if (!ctx._hyperframes?.projects || !ctx._hyperframes?.tasks) {
    throw new Error("HyperFrames 插件尚未初始化，请确认 full-access 插件已启用。");
  }
  return ctx._hyperframes;
}
