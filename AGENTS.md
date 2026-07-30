## Long-running task execution

For long-running, multi-phase, or autonomous implementation work, use the following project documents:

- `TASKS.md` — implementation plan and execution state.
- `ACCEPTANCE.md` — user-facing acceptance criteria and end-to-end verification plan.
- `WORKLOG.md` — current execution status, completed work, validation evidence, and blockers.

These files must remain synchronized throughout the run.

### Source of truth

Treat `TASKS.md` as the source of truth for implementation scope, ordering, dependencies, and completion state.

Treat `ACCEPTANCE.md` as the source of truth for whether the resulting application is actually usable and complete from the user's perspective.

A task being implemented does not mean the feature is accepted. A feature is complete only when:

1. its implementation task is complete,
2. relevant technical validation passes,
3. its acceptance criteria pass,
4. and the result is recorded in `WORKLOG.md`.

### Working from TASKS.md

When working from `TASKS.md`:

- Work on the current unchecked task.
- Do not skip ahead unless:

  - the current task has an unmet dependency,
  - another task must be completed to unblock it,
  - or tasks can safely run in parallel without causing conflicting changes.

- Do not silently expand the requested scope.
- Add newly discovered required work to `TASKS.md` before implementing it.
- Preserve the existing task hierarchy, ordering, identifiers, and checkboxes where possible.
- Break overly broad tasks into smaller, verifiable subtasks.
- Never mark a task complete based only on partial implementation.
- Never stop merely because one phase, subphase, file, or feature is partially complete.
- After finishing each task:

  1. run the relevant validation,
  2. fix failures,
  3. mark the task complete in `TASKS.md`,
  4. update `WORKLOG.md`,
  5. then continue to the next unchecked task.

If implementation reveals that an already completed task is no longer valid, reopen it and document why.

### ACCEPTANCE.md

Maintain an `ACCEPTANCE.md` file containing the end-to-end acceptance requirements for the requested application scope.

`ACCEPTANCE.md` must describe how to verify the application as a real user, not only how to verify internal code behavior.

It should cover every user-facing feature documented in:

- the product requirements,
- `TASKS.md`,
- existing application behavior affected by the changes,
- and newly discovered critical workflows.

At minimum, include acceptance coverage for applicable areas such as:

- application startup and initial page load,
- account creation,
- login,
- logout,
- session persistence,
- authentication failures,
- password reset or account recovery,
- onboarding,
- navigation,
- permissions and authorization,
- every implemented feature,
- create, read, update, and delete flows,
- forms and validation,
- loading states,
- empty states,
- error states,
- retry behavior,
- destructive actions and confirmations,
- file upload or download,
- search, filtering, sorting, and pagination,
- responsive layouts,
- critical mobile and desktop flows,
- browser refresh and direct URL access,
- persistence across sessions,
- integrations with external services,
- accessibility-critical interactions,
- and regression checks for existing functionality.

Do not add acceptance items for features that are explicitly outside the requested scope. However, include regression checks when the implementation could reasonably affect existing critical behavior.

### Acceptance case format

Each acceptance case should include:

- a stable identifier,
- the feature or workflow name,
- prerequisites,
- test data or account requirements,
- exact steps,
- expected result,
- verification method,
- automation status,
- and current result.

Use a structure similar to:

```markdown
## Authentication

### ACC-AUTH-001 — User can log in successfully

**Priority:** Critical  
**Automation:** Playwright  
**Status:** Pending

**Prerequisites**

- The application is running.
- A valid test user exists.

**Steps**

1. Open the login page.
2. Enter a valid email address and password.
3. Submit the form.

**Expected result**

- The user is redirected to the authenticated home page.
- The authenticated navigation is visible.
- No authentication error is displayed.
- Refreshing the page preserves the authenticated session.

**Evidence**

- Playwright test: `tests/e2e/auth/login.spec.ts`
- Screenshot or trace: `<path or artifact reference>`

**Last result**

- Not run
```

Acceptance cases should be precise enough that another agent or developer can execute them without guessing.

Avoid vague criteria such as:

- “Login works.”
- “The page looks correct.”
- “Test the feature.”
- “Everything behaves normally.”

Describe observable user actions and results.

### Acceptance coverage mapping

Every user-facing feature must map to:

1. one or more implementation tasks in `TASKS.md`,
2. one or more acceptance cases in `ACCEPTANCE.md`,
3. and validation evidence in `WORKLOG.md`.

Where useful, reference acceptance identifiers directly from `TASKS.md`:

```markdown
- [ ] Implement email and password login
  - Acceptance: `ACC-AUTH-001`, `ACC-AUTH-002`, `ACC-AUTH-003`
```

A feature task must not be marked fully complete while its required critical acceptance cases are failing or untested.

### Verification method priority

Use the strongest practical verification method in this order:

1. deterministic automated tests,
2. Playwright browser tests,
3. browser-use or computer-use execution,
4. manual inspection as a last resort.

Prefer Playwright for repeatable application workflows.

Use browser-use or computer-use when:

- the workflow cannot reasonably be scripted,
- browser APIs or operating-system interactions are involved,
- a third-party interface must be exercised,
- visual or interactive behavior requires direct inspection,
- or Playwright is temporarily blocked.

Do not claim a workflow passed based only on reading the code.

Do not substitute unit tests for end-to-end acceptance tests when the acceptance criterion describes a user-facing workflow.

### Playwright requirements

When Playwright is available or can reasonably be added:

- place tests in the repository's established end-to-end test location,
- reuse existing fixtures and helpers,
- use stable semantic selectors,
- prefer role, label, placeholder, or test ID selectors,
- avoid brittle CSS selectors and timing-based waits,
- create isolated and repeatable test data,
- avoid dependencies on unrelated existing user data,
- capture traces, screenshots, videos, or logs on failure where practical,
- test both successful and important failure paths,
- and ensure tests can run from a documented command.

Document the relevant commands, such as:

```bash
pnpm test:e2e
pnpm playwright test
pnpm playwright test tests/e2e/auth/login.spec.ts
```

Use the repository's actual package manager and commands rather than assuming the examples above.

If browser tests require environment variables, seed data, credentials, ports, or external services, document them in `ACCEPTANCE.md` or the relevant test setup documentation.

Never commit real production credentials or secrets.

### Browser-use and computer-use verification

When using browser-use or computer-use:

- follow the exact steps documented in `ACCEPTANCE.md`,
- verify the observable expected result,
- record the result for each acceptance case,
- capture useful evidence where supported,
- distinguish between passed, failed, blocked, and not run,
- and note any nondeterministic behavior.

Computer-use verification should not be treated as permanent automation unless the workflow is repeatable and preserved as an executable test or documented procedure.

When a browser-use or computer-use case is stable and important, convert it into a Playwright test where practical.

### Test accounts and data

Use dedicated test accounts and test data when available.

Acceptance documentation should specify:

- required user roles,
- required account state,
- required subscription or permission level,
- required seed records,
- and cleanup expectations.

Tests must not depend on production user data.

For destructive workflows:

- use disposable test data,
- verify confirmation behavior,
- verify the final deletion or mutation,
- and clean up created data where practical.

If a required test account, credential, external service, or environment is unavailable, mark the case as blocked rather than passed.

### Validation after each task

After each implementation task or meaningful milestone, run the narrowest relevant checks first.

Examples include:

- formatting,
- linting,
- static analysis,
- type checking,
- unit tests,
- component tests,
- integration tests,
- build validation,
- database migration checks,
- Playwright tests,
- and targeted acceptance cases.

Before declaring the requested scope complete, run the full relevant validation suite.

If validation fails:

1. determine whether the failure is caused by the current work,
2. fix failures caused by the current work,
3. rerun the failed validation,
4. rerun related regression checks,
5. and do not move on while a required check remains failing.

Do not suppress, skip, weaken, or delete a failing test merely to make validation pass unless the test is demonstrably invalid. If a test is changed, document the reason.

### Acceptance execution

Run acceptance checks incrementally rather than waiting until the very end.

After completing a feature:

1. run its targeted technical validation,
2. run its associated acceptance cases,
3. fix any failures,
4. update `ACCEPTANCE.md`,
5. update `WORKLOG.md`,
6. and then proceed.

Before final completion:

- run all critical acceptance cases,
- run all acceptance cases affected by the changes,
- run relevant regression cases,
- and confirm that no required case remains in `Pending`, `Failed`, or unjustified `Not Run` state.

Recommended statuses are:

- `Pending`
- `Passed`
- `Failed`
- `Blocked`
- `Not Run`
- `Not Applicable`

A blocked case must include:

- the exact blocker,
- what was attempted,
- why the agent cannot resolve it independently,
- and the minimum user input or external action required.

### Visual verification

For features with meaningful visual behavior, verify more than page availability.

Check applicable details such as:

- major layout structure,
- responsive behavior,
- visible text,
- component state,
- overflow,
- clipping,
- overlapping elements,
- loading indicators,
- error messages,
- disabled controls,
- modal behavior,
- keyboard focus,
- and navigation transitions.

Use screenshot comparison or visual regression testing when the repository already supports it or when visual accuracy is a core requirement.

Do not claim pixel-level correctness without image-based verification.

### WORKLOG.md

Keep `WORKLOG.md` updated throughout the run.

It must include:

- current phase,
- current task,
- current acceptance case where applicable,
- completed implementation work,
- files or areas changed,
- validation commands executed,
- validation results,
- acceptance cases executed,
- acceptance results,
- evidence or artifact locations,
- next unchecked task,
- known risks,
- assumptions,
- and blockers.

Use a structure similar to:

```markdown
## Current status

**Phase:** Authentication  
**Current task:** Implement login form  
**Current acceptance:** ACC-AUTH-001

## Completed

- Added login route.
- Added form validation.
- Added authenticated redirect.
- Added Playwright login coverage.

## Validation

- `pnpm lint` — Passed
- `pnpm typecheck` — Passed
- `pnpm playwright test tests/e2e/auth/login.spec.ts` — Passed

## Acceptance

- `ACC-AUTH-001` — Passed
- `ACC-AUTH-002` — Passed
- `ACC-AUTH-003` — Pending

## Evidence

- Trace: `test-results/auth-login/trace.zip`
- Screenshot: `test-results/auth-login/success.png`

## Next

- `ACC-AUTH-003` — Invalid password error
- Next task: Add logout flow

## Blockers

- None
```

Update the worklog after every meaningful milestone and before stopping.

The worklog must reflect the repository's actual state. Do not leave it claiming that a task is in progress after that task has been completed or replaced.

### Handling failures and blockers

When something fails:

- inspect the actual failure,
- preserve useful logs,
- determine the root cause,
- attempt reasonable fixes,
- and rerun the relevant checks.

Do not classify an ordinary implementation failure as a blocker merely because the first approach did not work.

A real blocker is something the agent cannot resolve within the repository or available environment, such as:

- missing credentials,
- unavailable external services,
- required product decisions,
- inaccessible infrastructure,
- missing legal or business information,
- or destructive actions requiring explicit authorization.

When blocked:

- document the blocker in `WORKLOG.md`,
- mark affected acceptance cases as `Blocked`,
- continue with other independent tasks when possible,
- and request only the minimum information needed to proceed.

### Scope completion rules

Do not declare the requested scope complete until all of the following are true:

1. all required `TASKS.md` items are checked,
2. all newly discovered required tasks are resolved,
3. formatting, linting, type checking, tests, and builds pass where applicable,
4. every critical acceptance case passes,
5. all acceptance cases affected by the changes pass or have an explicitly justified status,
6. relevant regression checks pass,
7. `TASKS.md`, `ACCEPTANCE.md`, and `WORKLOG.md` reflect the final state,
8. no unresolved implementation placeholders remain,
9. no required feature is represented only by mocks unless mocks were explicitly requested,
10. and the application has been exercised through its critical user journeys.

Implementation completion without acceptance verification is not completion.

### Final report

At the end of the run, provide a concise report containing:

- completed scope,
- key implementation changes,
- validation commands and results,
- acceptance coverage and results,
- any acceptance cases not run,
- any remaining blockers or risks,
- and the location of relevant evidence.

Do not state that “all tests pass” unless the documented required tests were actually executed successfully.

Do not state that the application is fully working when critical user journeys were not exercised.

### Stop conditions

Stop only when one of the following is true:

1. all required `TASKS.md` items for the requested scope are complete,
2. all required validation passes,
3. all critical and relevant acceptance criteria pass,
4. a real blocker requires user input or unavailable external access,
5. the user explicitly pauses or stops the run,
6. or the available execution budget prevents further progress.

Running out of an intermediate plan, phase, context window, or convenient stopping point is not a valid reason to stop.

When stopped because of a blocker or budget:

- leave the repository in a coherent state,
- update all tracking documents,
- record exact continuation steps,
- identify the next unchecked task,
- identify the next acceptance case,
- and avoid marking incomplete work as complete.
