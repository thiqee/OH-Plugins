import assert from "node:assert/strict";
import test from "node:test";
import registerStudioRoutes from "../routes/studio.js";

test("carries iframe token into studio asset URLs", () => {
  const html = renderStudio({ token: "abc123" });

  assert.match(
    html,
    /href="\/api\/plugins\/hanako-hyperframes\/assets\/panel\.css\?token=abc123"/,
  );
  assert.match(
    html,
    /src="\/api\/plugins\/hanako-hyperframes\/assets\/panel\.js\?token=abc123"/,
  );
});

test("encodes studio asset token values", () => {
  const html = renderStudio({ token: "abc 123&next=<bad>" });

  assert.match(
    html,
    /href="\/api\/plugins\/hanako-hyperframes\/assets\/panel\.css\?token=abc\+123%26next%3D%3Cbad%3E"/,
  );
  assert.match(
    html,
    /src="\/api\/plugins\/hanako-hyperframes\/assets\/panel\.js\?token=abc\+123%26next%3D%3Cbad%3E"/,
  );
});

function renderStudio(query = {}) {
  const handlers = new Map();
  const app = {
    get(route, handler) {
      handlers.set(route, handler);
    },
  };
  registerStudioRoutes(app, { pluginId: "hanako-hyperframes" });
  const handler = handlers.get("/studio");
  assert.equal(typeof handler, "function");
  return handler({
    req: {
      query(key) {
        return query[key] || "";
      },
    },
    html(body) {
      return body;
    },
  });
}
