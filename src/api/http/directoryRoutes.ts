import { Router } from "express";

import type { TeamRepsResponse, TeamSummaryResponse } from "../../shared/types";
import { requestContext } from "../auth/authenticate";
import type { DirectoryService } from "../domain/directoryService";
import type { TaskService } from "../domain/taskService";

export function directoryRoutes(directoryService: DirectoryService, taskService: TaskService): Router {
  const router = Router();

  router.get("/me", async (_req, res) => {
    res.json(await directoryService.currentUser(requestContext(res)));
  });

  router.get("/team/reps", async (_req, res) => {
    const reps = await directoryService.listTeamReps(requestContext(res));
    res.json({ reps } satisfies TeamRepsResponse);
  });

  router.get("/team/summary", async (_req, res) => {
    const reps = await taskService.teamSummary(requestContext(res));
    res.json({ reps } satisfies TeamSummaryResponse);
  });

  return router;
}
