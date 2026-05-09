export const name = "create-project";
export const description = "Create a HyperFrames video project in the Hanako HyperFrames workspace.";

export const parameters = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Project title.",
    },
  },
  required: ["title"],
};

export async function execute(input, ctx) {
  const runtime = requireRuntime(ctx);
  const project = await runtime.projects.createProject({ title: input.title });
  return {
    content: [
      {
        type: "text",
        text: `已创建 HyperFrames 项目：${project.title}（${project.id}）。`,
      },
    ],
    details: { project },
  };
}

function requireRuntime(ctx) {
  if (!ctx._hyperframes?.projects) {
    throw new Error("HyperFrames 插件尚未初始化，请确认 full-access 插件已启用。");
  }
  return ctx._hyperframes;
}
