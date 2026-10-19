// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TeamRepSummary } from "../../shared/types";
import { TeamSummary } from "./TeamSummary";

const reps: TeamRepSummary[] = [
  { id: "u-jordan", name: "Jordan Pike", teamId: "team-north", overdueCount: 2, openCount: 3 },
  { id: "u-alicia", name: "Alicia Chen", teamId: "team-north", overdueCount: 0, openCount: 1 },
];

function mockFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("TeamSummary", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows each rep's overdue and open counts in the order the API returns", async () => {
    const fetchMock = mockFetch({ reps });

    render(<TeamSummary refreshKey={0} />);

    const rows = (await screen.findByLabelText("Team summary")).children;
    expect([...rows].map((row) => row.textContent)).toEqual(["Jordan Pike 2 overdue 3 open", "Alicia Chen 0 overdue 1 open"]);
    expect(fetchMock).toHaveBeenCalledWith("/api/team/summary", expect.anything());
  });

  it("fetches again when the refresh key changes", async () => {
    const fetchMock = mockFetch({ reps });

    const { rerender } = render(<TeamSummary refreshKey={0} />);
    await screen.findByLabelText("Team summary");
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ reps: [{ ...reps[0]!, overdueCount: 1 }] }), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    rerender(<TeamSummary refreshKey={1} />);

    expect(await screen.findByText("1 overdue")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows an error message instead of the strip when the request fails", async () => {
    mockFetch({ error: { code: "forbidden", message: "Only managers can view the team summary" } }, 403);

    render(<TeamSummary refreshKey={0} />);

    expect(await screen.findByText(/Could not load the team summary/)).toBeTruthy();
    expect(screen.queryByLabelText("Team summary")).toBeNull();
  });
});
