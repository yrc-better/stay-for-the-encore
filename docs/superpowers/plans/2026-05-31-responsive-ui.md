# Responsive UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the playable game layout so it adapts cleanly across desktop, tablet, and phone browsers.

**Architecture:** Keep game state and rules untouched. Update `GameLayout.tsx` to expose stable layout regions, then update `styles.css` with explicit desktop, tablet, and phone grid behavior.

**Tech Stack:** React, TypeScript, CSS Grid, Vitest, Testing Library, Vite.

---

### Task 1: Add Layout Structure Test

**Files:**
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write the failing test**

Add a test that starts a game and expects named responsive sections:

```tsx
it("renders responsive gameplay regions for desktop and mobile layouts", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /创作型/ }));

  expect(screen.getByRole("region", { name: "状态摘要" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "当前事件" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "行动选择" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "装备" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "成员关系" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "履历" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
PATH="/private/tmp/codex-node-v24.14.0-darwin-arm64/bin:$PATH" npm test -- src/App.test.tsx --run
```

Expected: FAIL because the named region landmarks do not exist yet.

### Task 2: Restructure Game Layout

**Files:**
- Modify: `src/components/GameLayout.tsx`

- [ ] **Step 1: Implement region markup**

Split existing content into these sections:

- `<section className="summary-panel layout-card" aria-label="状态摘要">`
- `<section className="event-section layout-card" aria-label="当前事件">`
- `<section className="actions-section" aria-label="行动选择">`
- `<section className="equipment-panel layout-card" aria-label="装备">`
- `<section className="relationships-panel layout-card" aria-label="成员关系">`
- `<section className="history-panel layout-card" aria-label="履历">`

Keep the existing text and callbacks unchanged.

- [ ] **Step 2: Run the targeted test**

Run:

```bash
PATH="/private/tmp/codex-node-v24.14.0-darwin-arm64/bin:$PATH" npm test -- src/App.test.tsx --run
```

Expected: PASS.

### Task 3: Add Responsive CSS

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Implement desktop grid**

Use `.game-layout` with named grid areas:

```css
.game-layout {
  width: min(1320px, 100%);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 280px;
  grid-template-areas:
    "summary event relationships"
    "equipment actions history";
  gap: 16px;
}
```

- [ ] **Step 2: Implement tablet grid**

At `max-width: 1099px`, switch to two columns:

```css
@media (max-width: 1099px) {
  .game-layout {
    grid-template-columns: minmax(220px, 0.9fr) minmax(0, 1.3fr);
    grid-template-areas:
      "summary event"
      "equipment actions"
      "relationships actions"
      "history actions";
  }

  .action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

- [ ] **Step 3: Implement phone grid**

At `max-width: 759px`, switch to one column:

```css
@media (max-width: 759px) {
  .game-layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      "summary"
      "event"
      "actions"
      "equipment"
      "relationships"
      "history";
  }

  .action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

- [ ] **Step 4: Verify CSS behavior in browser**

Use browser viewport checks at:

- `390x844` phone.
- `820x1180` tablet.
- `1280x720` desktop.

Expected: no horizontal overflow, no obvious overlap, and action buttons remain usable.

### Task 4: Final Verification

**Files:**
- No new source files.

- [ ] **Step 1: Run full automated verification**

Run:

```bash
git diff --check
PATH="/private/tmp/codex-node-v24.14.0-darwin-arm64/bin:$PATH" npm test -- --run
PATH="/private/tmp/codex-node-v24.14.0-darwin-arm64/bin:$PATH" npm run typecheck
PATH="/private/tmp/codex-node-v24.14.0-darwin-arm64/bin:$PATH" npm run build
```

Expected: all commands exit 0.

- [ ] **Step 2: Commit**

Run:

```bash
git add docs/superpowers/specs/2026-05-31-responsive-ui-design.md docs/superpowers/plans/2026-05-31-responsive-ui.md src/App.test.tsx src/components/GameLayout.tsx src/styles.css
git commit -m "feat: add responsive game layout"
```

### Task 5: Band Name At Start

**Files:**
- Modify: `src/components/RouteSelect.tsx`
- Modify: `src/components/GameLayout.tsx`
- Modify: `src/game/state/createInitialState.ts`
- Modify: `src/game/storage/saveGame.ts`
- Test: `src/App.test.tsx`
- Test: `src/game/state/createInitialState.test.ts`
- Test: `src/game/storage/saveGame.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that expect a `乐队名` input on the route screen, `GameState.bandName` in initial state, and old saves without `bandName` to load with `未命名乐队`.

- [ ] **Step 2: Implement state and UI**

Add `bandName` to `GameState`, pass the route-screen input into `createInitialState`, display it in `GameLayout`, and normalize blank names to `未命名乐队`.

- [ ] **Step 3: Preserve old saves**

Update save loading so a save missing `state.bandName` is normalized to `未命名乐队` instead of being rejected.

- [ ] **Step 4: Verify**

Run:

```bash
PATH="/private/tmp/codex-node-v24.14.0-darwin-arm64/bin:$PATH" npm test -- src/App.test.tsx src/game/state/createInitialState.test.ts src/game/storage/saveGame.test.ts --run
```

Expected: all targeted tests pass.
