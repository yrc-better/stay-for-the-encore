# Phase 1 Graduation And Content Checks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Continue phase 1 by adding content validation, route-specific campus random events, and a graduation show anchor with dynamic settlement.

**Architecture:** Keep validation in tests over content data. Extend event metadata with optional route filters in the pure selector. Add graduation settlement as a single dynamic effect so the static event table can trigger a state-derived result without embedding logic in React.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, localStorage.

---

### Task 1: Content Validation And Route Events

**Files:**
- Create: `src/game/content/events.test.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/rules/eventSelection.ts`
- Modify: `src/game/rules/eventSelection.test.ts`
- Modify: `src/game/content/events.ts`

- [x] **Step 1: Write failing tests for content completeness and route filtering**
- [x] **Step 2: Run targeted tests and verify RED**
- [x] **Step 3: Add route event metadata support and four route-specific campus events**
- [x] **Step 4: Run targeted tests and verify GREEN**

### Task 2: Graduation Show Anchor

**Files:**
- Create: `src/game/rules/graduation.ts`
- Create: `src/game/rules/graduation.test.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/rules/effects.ts`
- Modify: `src/game/rules/events.test.ts`
- Modify: `src/game/content/events.ts`
- Modify: `src/App.test.tsx`

- [x] **Step 1: Write failing graduation settlement and event availability tests**
- [x] **Step 2: Run targeted tests and verify RED**
- [x] **Step 3: Implement `resolveGraduationShow`, dynamic effect handling, and event content**
- [x] **Step 4: Run targeted tests and verify GREEN**

### Task 3: Verification

**Files:**
- No additional code changes.

- [x] **Step 1: Run full test suite**
- [x] **Step 2: Run typecheck**
- [x] **Step 3: Run production build**
- [x] **Step 4: Run `git diff --check`**
