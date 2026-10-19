import { useRef } from "react";

import type { TeamRepSummary } from "../../shared/types";
import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";

interface TeamSummaryProps {
  /** Changes whenever the summary should be fetched again, e.g. after a task is completed. */
  refreshKey: number;
}

export function TeamSummary({ refreshKey }: TeamSummaryProps) {
  const summary = useAsync(async () => (await api.teamSummary()).reps, [refreshKey]);
  // Keep showing the last counts while a refresh loads, so the strip does not flicker.
  const lastReps = useRef<TeamRepSummary[] | null>(null);
  if (summary.status === "success") {
    lastReps.current = summary.data;
  }

  if (summary.status === "error") {
    return <p className="muted">Could not load the team summary. {summary.error.message}</p>;
  }
  if (!lastReps.current) {
    return null;
  }

  return (
    <div className="task-summary" role="group" aria-label="Team summary">
      {lastReps.current.map((rep) => (
        <div key={rep.id}>
          <strong>{rep.name}</strong>{" "}
          <span className={rep.overdueCount > 0 ? "badge badge-overdue" : "badge badge-open"}>
            {rep.overdueCount} overdue
          </span>{" "}
          <span className="muted">{rep.openCount} open</span>
        </div>
      ))}
    </div>
  );
}
