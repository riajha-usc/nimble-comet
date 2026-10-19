# Submission

Start time: 17:09 PDT, 2026-10-18
End time: 18:15 PDT, 2026-10-18

## Opportunities, ranked
A short ranked list of the opportunities you noticed, most valuable first.
For each: one line on what it is, whether you worked on it, and why.

1. **Reps could complete teammates' tasks.** Worked on it. My original list had this at #2, citing "authorization bug, contradicts domain.md, small fix". Claude suggested moving it above the overdue filter because it changes data: a rep's wrong click hides a teammate's task from the manager's Overdue view, and the 409 leaks that the task exists. I agree.
2. **Overdue view ignored the rep filter and skipped the 403 rule.** Worked on it: it breaks the app's core use case, it's a one-line fix, and it's testable.
3. **No HTTP-level tests even though supertest was installed.** Worked on it: these tests would have caught #2, and they lock in the documented error contract.
4. **Per-rep "who is behind" summary for managers.** Worked on it. Reason: The Overdue view is a flat list. The stated weekly-check-in use case wants counts per rep (overdue / open). `styles.css` already defines unused `.task-summary` and `.badge-warning` classes, which strongly suggests a summary strip and a "due soon" badge were planned and never shipped.
5. **README listed a `lint` script that doesn't exist.** Worked on it. Reason: Adding ESLint: README drift is real, but tooling eats time and adds noise to the diff. Remove the row instead.
6. **Overdue rows don't show how late they are.** Not worked on: nice-to-have.
7. **Malformed JSON request body returned 500 instead of 400.** Worked on it. Reason: To cover, most from the list: 
- 401 missing token, 401 unknown token, 
- 400 bad status, 
- 403 rep filter outside scope on /tasks AND /tasks/overdue, 
- 404 unknown route, 404 completing a task outside visibility, 409 completing twice, and the happy path for /tasks/overdue?repId= returning only that rep. 
8. **Unknown route without a token returns 401, not 404.** Not worked on. Time almost completed
9. **The Rep filter disappears silently if the rep list fails to load.** Not worked on. Time almost completed

## What you changed
What you changed and why, in a few sentences or bullets.

- **Rep visibility on completing a task** (`0ce8bfd`). `TaskService.canAccess` checked the rep's team instead of the assignee, so a rep could complete any task on their team (200), or got 409 on one already completed. It now checks `task.assigneeId === scope.userId`, matching how the task list decides what a rep can see (`scope.ts`). Tasks a rep can't see now return 404, as domain.md requires. One line in `taskService.ts`.
- **Overdue `repId` filter** (`0ce8bfd`). The overdue query listed `accepts: ["status"]`, so `normalizeFilters` dropped `repId` before the visibility check ran. The Rep filter on the Overdue tab did nothing, and out-of-scope reps got 200 instead of 403. Changed to `accepts: ["repId"]` in `definitions.ts`. Nothing on this query read `status` (no criterion reads it, the route never sends it, and api.md doesn't document it), so removing it doesn't change behavior.
- **HTTP contract tests** (`40347b5`). New `src/api/app.test.ts`: Supertest against `createApp` with a fixed clock. Covers 401 for a missing or unknown token, 400 for a bad `status`, 403 for an out-of-scope `repId` on `/tasks` and `/tasks/overdue` (asked by a manager and by a rep), 404 for an unknown route, 404 for completing a task the user can't see, 409 for completing twice, and the `/tasks/overdue?repId=` happy path. Tests assert on status and `error.code` only.
- **Malformed JSON returns 400** (`1fa44d4`). The error handler now maps Express's JSON-parse error to `400 invalid_request`. All other unexpected errors still log and return 500. Three lines in `errors.ts`.
- **README** (`1fa44d4`). Removed the `lint` row; there is no lint script or ESLint, and adding one would be new tooling.
- **Team summary for managers** (`9909887`, `c0556a5`).
  - **API:** new `GET /api/team/summary`, managers only (403 for reps). For each rep on the manager's teams it returns `overdueCount` and `openCount` (open includes overdue), sorted by overdue count descending, then name. Same route → service → repository shape as `/team/reps`: types in `src/shared/types.ts`, logic in `TaskService.teamSummary`, route in `directoryRoutes.ts`. Documented in `docs/api.md`. No existing endpoint changed.
  - **Web:** new `TeamSummary` strip above the Overdue table, shown to managers only. It uses the existing `.task-summary` class and the existing badge classes. `TaskList` got an optional `onCompleted` callback so the strip refreshes after a task is completed.
  - **Follow-up from self-review (`c0556a5`):** the strip keeps its last counts on screen while it refreshes, so it no longer flickers. It also now has `role="group"`, so screen readers announce its label.

## What you decided not to do
Things you noticed and deliberately left alone, and why.

- **Overdue lateness ("N days late").
- **Unknown route without a token returns 401, not 404.** api.md supports both readings.
- **The Rep filter hides silently when the rep list fails to load** (`App.tsx`). 
- **Unused code:** `formatDate`, `.badge-warning`, `TaskQueryRegistry.names()`, `User.email`, `Task.createdAt`. 
- **Other body-parser errors still return 500**, for example an oversized body (413). 
- **`directoryRoutes` now depends on `TaskService`.** A separate `teamRoutes.ts` would be cleaner. 
- **`teamSummary` reads the repository directly** instead of going through `TaskQueryEngine`. Its scoping matches the overdue list today, but it's a second place to update if visibility rules change.

## Verification
How you know your changes work and did not break existing behavior.

- **Reproduced each bug before fixing it**, against the running API (`PORT=3977 npm run start:api`) with curl:
  - Dana `GET /api/tasks/overdue?repId=u-alicia` returned 200 with all 3 North Metro overdue tasks; correct is only `task-1004`.
  - Dana `GET /api/tasks/overdue?repId=u-sam` returned 200; correct is 403. The same request on `/api/tasks` correctly returned 403.
  - Marcus `POST /api/tasks/task-1004/complete` (Alicia's task) returned 200 and completed it; correct is 404. Repeating it returned 409; correct is still 404.
- **Test-first for every fix and for the feature.** Each new test was run and seen failing for the right reason before the code changed:
  - The service returned the completed task instead of rejecting.
  - The overdue list returned `['task-1007','task-1001','task-1004']` instead of `['task-1004']`.
  - The bad-JSON test got `[500,'internal_error']`.
  - `/team/summary` returned 404.
  - The summary strip vanished during a refresh.
  - The strip's group role was missing.
- **Checked that the tests catch regressions:**
  - With both fixes reverted, `app.test.ts` failed exactly the 3 tests covering them, and the other 6 passed.
  - With `refreshKey` dropped from `TeamSummary`, the refresh test failed.
  - With the `onCompleted?.()` call removed from `TaskList`, the new `TaskList` test failed.
- **Full suite after every change:** `npm run typecheck && npm test`. Final result: `Test Files 6 passed (6) · Tests 36 passed (36)`, up from 4 files and 17 tests at baseline. `npm run build` also succeeds.
- **Self-review of the full diff, hunk by hunk.** For each hunk I asked whether an existing user would see a change, whether a test fails if it's reverted, and whether anything wasn't needed. This found the strip flicker and the unannounced `aria-label`, plus the missing test for `onCompleted`. All three were fixed in `c0556a5`.
- **Browser check:** `npm run dev`, driven with headless Chrome, with screenshots reviewed:
  - Dana → Overdue shows the strip above the table.
  - Completing Alicia's task drops her to 0 overdue, re-sorts the strip, and shrinks the table from 3 to 2 tasks. Sampled every 5 ms during the refresh, the strip never disappeared.
  - Rep filter = Marcus shows only his task.
  - Marcus → Overdue shows no strip and no Rep filter.
  - No console errors.
- **Not verified:** no test covers `App.tsx` itself (where the strip is mounted, and the completion counter); it was only checked in the browser. The app was run on Node v25.2.1, which the README lists as unsupported, although the tests pass.

## Working with AI
How you directed your AI tools, and at least one suggestion you accepted,
changed, rejected, or verified carefully: what it was, what you did, and why.
- Directed it with a ground-rules prompt (read first, small diffs, prove bugs with commands, run typecheck+test after every change).
- **Session rules up front:** read before writing, no file changes until "go", small diffs, evidence for every bug claim, `typecheck && test` after each change.
- **Read-only audit first:** you asked for the request path, every docs/code disagreement, untested behaviour and unused code, with no fixes. <TODO>
- **Ran every reproduction curl yourself** before approving any fix.
- **Ranking:** Claude pushed back by suggesting #2 above #1, folding #3 into #1 and #2, and making #4 depend on remaining time. I accepted the re-rankings only for the swap of #1 and #2 and also later I added my priority fixes too.
- **Required a failing test first** for each fix, shown failing for the right reason.
- **Skeptical review before the write-up:** found the flicker, the unannounced `aria-label`, and the untested `onCompleted`.
- **Suggestions to note:** 
  - Claude removed `"status"` from the overdue query's `accepts` beyond the minimal fix, and flagged it in its own review.
  - Claude put the summary route in `directoryRoutes` (smaller diff) rather than a new router, and flagged that as a design smell.
  - Claude kept the 401-vs-404 question open for me to decide rather than changing it.
- Claude suggested extras and I have my own rankings, from that #6 was remaining but there is another defect before that about "Add a summary strip above the task table for managers" more important so completed that first then asked claude to complete the rest, still 2 open fixes, not able to cmplete on time.
