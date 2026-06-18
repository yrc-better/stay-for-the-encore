# Phase 1 Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close phase 1 by making the campus-to-career transition depend on the resolved graduation show, and by showing the current career context in the main UI.

**Architecture:** Keep graduation as the single transition anchor. `resolveGraduationShow` writes the graduation outcome and moves the state into `career`; month advancement preserves that state instead of deriving phase from a hard-coded month boundary. `GameLayout` renders small career context labels from existing `phase`, `careerStage`, and `campus.graduationOutcome` state.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, localStorage.

---

### Task 1: Graduation-Driven Phase Transition

**Files:**
- Modify: `src/game/rules/graduation.test.ts`
- Modify: `src/game/rules/graduation.ts`
- Modify: `src/game/state/month.test.ts`
- Modify: `src/game/state/month.ts`

- [x] **Step 1: Write failing tests for graduation-driven phase transition**
- [x] **Step 2: Run targeted tests and verify RED**
- [x] **Step 3: Move phase transition into graduation resolution and preserve it during month advancement**
- [x] **Step 4: Run targeted tests and verify GREEN**

### Task 2: Career Context In Gameplay UI

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/components/GameLayout.tsx`
- Modify: `src/styles.css`

- [x] **Step 1: Write failing App test for full start-to-graduation flow and visible career context**
- [x] **Step 2: Run targeted App test and verify RED**
- [x] **Step 3: Render phase, career stage, and graduation outcome in the summary panel**
- [x] **Step 4: Run targeted App test and verify GREEN**

### Task 3: Documentation And Verification

**Files:**
- Modify: `docs/engineering/README.md`
- Modify: `docs/engineering/2026-06-01-engineering-schedule.md`

- [x] **Step 1: Link this closure plan from the engineering docs index**
- [x] **Step 2: Correct phase 1 acceptance wording from profession to start-route terminology**
- [x] **Step 3: Run full test suite**
- [x] **Step 4: Run typecheck**
- [x] **Step 5: Run production build**
- [x] **Step 6: Run `git diff --check`**
