import { api } from "../api/client";
import { useAsync } from "../hooks/useAsync";

interface TeamSummaryProps {
  /** Changes whenever the summary should be fetched again, e.g. after a task is completed. */
  refreshKey: number;
}

export function TeamSummary({ refreshKey }: TeamSummaryProps) {
  const summary = useAsync(async () => (await api.teamSummary()).reps, [refreshKey]);

  if (summary.status === "loading") {
    return null;
  }
  if (summary.status === "error") {
    return <p className="muted">Could not load the team summary. {summary.error.message}</p>;
  }

  return (
    <div className="task-summary" aria-label="Team summary">
      {summary.data.map((rep) => (
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
