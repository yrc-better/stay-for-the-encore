# Phase 1 Random Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start phase 1 by adding campus/career state, save migration, deterministic random event selection, and a first campus random event pool.

**Architecture:** Game state owns phase, career stage, event history, and event cooldowns. Event definitions gain sandbox metadata, while event selection lives in a pure rule module with injectable randomness for tests. React keeps using `getAvailableEvents`, but event resolution removes handled queued events and records cooldown/history.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, localStorage.

---

### Task 1: Phase State And Save Migration

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/state/createInitialState.ts`
- Modify: `src/game/state/month.ts`
- Modify: `src/game/storage/saveGame.ts`
- Test: `src/game/state/createInitialState.test.ts`
- Test: `src/game/state/month.test.ts`
- Test: `src/game/storage/saveGame.test.ts`

- [x] **Step 1: Write failing tests**

Add tests that expect new games to start in `phase: "campus"` and `careerStage: "campus"`, month advancement from `2027-05` to enter `phase: "career"` and `careerStage: "early"`, and version 1 saves to migrate into the new fields.

- [x] **Step 2: Run tests and verify RED**

Run:

```bash
PATH="/Users/yanrongchen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" node_modules/.bin/vitest run src/game/state/createInitialState.test.ts src/game/state/month.test.ts src/game/storage/saveGame.test.ts
```

Expected: FAIL because phase fields and version migration are missing.

- [x] **Step 3: Implement minimal state and migration**

Add `GamePhase`, `CareerStage`, `EventLogEntry`, `eventLog`, and `eventCooldowns`, bump `SAVE_VERSION`, and migrate version 1 payloads by deriving phase from month.

- [x] **Step 4: Run targeted tests and verify GREEN**

Run the same targeted command. Expected: PASS.

### Task 2: Random Event Selection Rule

**Files:**
- Modify: `src/game/types.ts`
- Create: `src/game/rules/eventSelection.ts`
- Test: `src/game/rules/eventSelection.test.ts`
- Modify: `src/game/rules/events.ts`

- [x] **Step 1: Write failing tests**

Add tests proving weighted random selection can pick deterministic candidates with injected random values, excludes events on cooldown, excludes one-time events already in `eventLog`, and keeps fixed anchor events first.

- [x] **Step 2: Run tests and verify RED**

Run:

```bash
PATH="/Users/yanrongchen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" node_modules/.bin/vitest run src/game/rules/eventSelection.test.ts
```

Expected: FAIL because the selector does not exist.

- [x] **Step 3: Implement selector**

Create a pure `selectMonthlyEventIds(state, options)` function and update event availability helpers to understand event metadata.

- [x] **Step 4: Run targeted tests and verify GREEN**

Run the same targeted command. Expected: PASS.

### Task 3: Campus Random Event Pool And UI Resolution

**Files:**
- Modify: `src/game/content/events.ts`
- Modify: `src/game/ui/useGameController.ts`
- Test: `src/game/rules/events.test.ts`
- Test: `src/App.test.tsx`

- [x] **Step 1: Write failing tests**

Add tests that campus random event ids are selectable after the prologue anchor is resolved, and that resolving a queued event removes it from the active queue.

- [x] **Step 2: Run tests and verify RED**

Run:

```bash
PATH="/Users/yanrongchen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" node_modules/.bin/vitest run src/game/rules/events.test.ts src/App.test.tsx
```

Expected: FAIL until random event metadata and queue resolution are implemented.

- [x] **Step 3: Implement event metadata and resolution**

Mark the existing prologue as an anchor, add several campus random events, and update event choice handling to remove the active queued event and record cooldown/history.

- [x] **Step 4: Run targeted tests and verify GREEN**

Run the same targeted command. Expected: PASS.

### Task 4: Verification

**Files:**
- No additional code changes.

- [x] **Step 1: Run full test suite**

```bash
PATH="/Users/yanrongchen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" node_modules/.bin/vitest run
```

- [x] **Step 2: Run typecheck**

```bash
PATH="/Users/yanrongchen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" node_modules/.bin/tsc --noEmit
```

- [x] **Step 3: Run production build**

```bash
PATH="/Users/yanrongchen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" node_modules/.bin/vite build
```
