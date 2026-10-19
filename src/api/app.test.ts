import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "./app";
import { fixedClock } from "./domain/clock";

function api() {
  return request(createApp({ clock: fixedClock("2026-03-10T15:00:00.000Z") }));
}

const dana = { Authorization: "Bearer demo-dana" };
const marcus = { Authorization: "Bearer demo-marcus" };

describe("HTTP API", () => {
  it("returns 401 when the session token is missing", async () => {
    const res = await api().get("/api/tasks");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("unauthenticated");
  });

  it("returns 401 when the session token is unknown", async () => {
    const res = await api().get("/api/tasks").set({ Authorization: "Bearer demo-nobody" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("unauthenticated");
  });

  it("returns 400 for a malformed status filter", async () => {
    const res = await api().get("/api/tasks?status=late").set(dana);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_request");
  });

  it.each(["/api/tasks", "/api/tasks/overdue"])("returns 403 on %s for a rep outside the user's visibility", async (path) => {
    const manager = await api().get(`${path}?repId=u-sam`).set(dana);
    const rep = await api().get(`${path}?repId=u-alicia`).set(marcus);

    expect([manager.status, manager.body.error.code]).toEqual([403, "forbidden"]);
    expect([rep.status, rep.body.error.code]).toEqual([403, "forbidden"]);
  });

  it("returns 404 for an unknown route", async () => {
    const res = await api().get("/api/nope").set(dana);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });

  it("returns 404 when completing a task outside the user's visibility", async () => {
    const res = await api().post("/api/tasks/task-1004/complete").set(marcus);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });

  it("returns 409 when completing a task twice", async () => {
    const app = api();
    const first = await app.post("/api/tasks/task-1006/complete").set(dana);
    const second = await app.post("/api/tasks/task-1006/complete").set(dana);

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe("conflict");
  });

  it("narrows /tasks/overdue to the requested rep", async () => {
    const res = await api().get("/api/tasks/overdue?repId=u-alicia").set(dana);

    expect(res.status).toBe(200);
    expect(res.body.tasks.map((task: { id: string }) => task.id)).toEqual(["task-1004"]);
  });

  it("returns 400 for a malformed JSON body", async () => {
    const res = await api().post("/api/tasks/task-1006/complete").set(dana).type("json").send("{bad");
    expect([res.status, res.body.error.code]).toEqual([400, "invalid_request"]);
  });
});
