import assert from "node:assert/strict";
import test from "node:test";
import { appendTokenParam } from "../lib/auth-url.js";

test("appends token query parameters to plugin URLs", () => {
  assert.equal(
    appendTokenParam("/api/plugins/demo/assets/panel.js", "abc123"),
    "/api/plugins/demo/assets/panel.js?token=abc123",
  );
  assert.equal(
    appendTokenParam("/api/plugins/demo/api/projects?mode=list", "abc 123&next=<bad>"),
    "/api/plugins/demo/api/projects?mode=list&token=abc+123%26next%3D%3Cbad%3E",
  );
});

test("leaves plugin URLs unchanged when token is missing", () => {
  assert.equal(appendTokenParam("/api/plugins/demo/assets/panel.js", ""), "/api/plugins/demo/assets/panel.js");
  assert.equal(appendTokenParam("/api/plugins/demo/assets/panel.js", null), "/api/plugins/demo/assets/panel.js");
});
