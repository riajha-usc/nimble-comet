# CLAUDE.md
- Stack: Express 5 API in src/api, React 19 + Vite in src/web, shared types in src/shared. Vitest, Testing Library, Supertest.
- Read before writing. Do not change files until told "go".
- Small, surgical diffs. No new dependencies, no tooling, no reformatting, no refactors beyond the fix.
- Claims of a bug come with the exact lines and a command or test that proves it.
- Code must match docs/domain.md and docs/api.md. If they disagree, stop and ask which is right.
- After every change run `npm run typecheck && npm test` and report the summary line.
- Tests sit next to the code they cover. Assert on status and error code, not message text.
