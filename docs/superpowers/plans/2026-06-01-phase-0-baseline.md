# Phase 0 Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the phase 0 baseline work from the engineering schedule so the MVP has clear bad-save recovery, no exposed debug ending entry, documentation links, and a verified build baseline.

**Architecture:** Keep behavior changes small and local. Storage validation remains in `src/game/storage/saveGame.ts`; UI-facing recovery state belongs in `src/game/ui/useGameController.ts`; `RouteSelect` displays the recovery notice when the controller detects an invalid saved payload.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, localStorage.

---

### Task 1: Bad Save Recovery Notice

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/game/storage/saveGame.ts`
- Modify: `src/game/ui/useGameController.ts`
- Modify: `src/components/RouteSelect.tsx`

- [x] **Step 1: Write the failing UI test**

Add this test to `src/App.test.tsx`:

```tsx
it("shows a recovery notice when a saved game is corrupt", () => {
  localStorage.setItem(SAVE_KEY, "{not valid json");

  render(<App />);

  expect(screen.getByRole("status")).toHaveTextContent("存档已损坏，已回到新游戏。");
  expect(screen.getByRole("button", { name: /创作型/ })).toBeInTheDocument();
});
```

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
PATH="/Users/yanrongchen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" node_modules/.bin/vitest run src/App.test.tsx -t "shows a recovery notice"
```

Expected: FAIL because no `role="status"` notice exists.

- [x] **Step 3: Implement minimal recovery detection**

Export `hasStoredSave` from `src/game/storage/saveGame.ts`, call it before `loadSave()` in `useGameController`, return `saveRecoveryMessage`, and pass it into `RouteSelect`.

Expected UI text:

```tsx
<p role="status" className="save-recovery-notice">存档已损坏，已回到新游戏。</p>
```

- [x] **Step 4: Run targeted test**

Run:

```bash
PATH="/Users/yanrongchen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" node_modules/.bin/vitest run src/App.test.tsx -t "shows a recovery notice"
```

Expected: PASS.

### Task 2: Engineering Documentation Index

**Files:**
- Create: `docs/engineering/README.md`

- [x] **Step 1: Create documentation index**

Create `docs/engineering/README.md` with links to the engineering schedule, implementation plan, product spec, data spec, and responsive UI plan.

- [x] **Step 2: Review links**

Run:

```bash
rg -n "engineering-schedule|band-simulator-design|band-simulator-data-spec|responsive-ui|band-simulator-mvp" docs/engineering/README.md
```

Expected: all key documents are linked.

### Task 3: Verification

**Files:**
- No additional code changes.

- [x] **Step 1: Run full test suite**

Run:

```bash
PATH="/Users/yanrongchen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" node_modules/.bin/vitest run
```

Expected: all tests pass.

- [x] **Step 2: Run typecheck**

Run:

```bash
PATH="/Users/yanrongchen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" node_modules/.bin/tsc --noEmit
```

Expected: exit 0.

- [x] **Step 3: Run production build**

Run:

```bash
PATH="/Users/yanrongchen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" node_modules/.bin/vite build
```

Expected: build completes.
