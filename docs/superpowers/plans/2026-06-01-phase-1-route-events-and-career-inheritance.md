# Phase 1 Route Events And Career Inheritance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish phase 1's next content slice by expanding campus route-specific random events and making graduation results affect post-graduation starting resources.

**Architecture:** Keep route-specific content in the event table using `routes` metadata. Keep graduation result logic in `resolveGraduationShow`, where the graduation outcome already computes state-derived rewards and writes history.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, localStorage.

---

### Task 1: Route-Specific Campus Event Count

**Files:**
- Modify: `src/game/content/events.test.ts`
- Modify: `src/game/content/events.ts`

- [x] **Step 1: Write failing tests requiring three campus random events per route**
- [x] **Step 2: Run targeted tests and verify RED**
- [x] **Step 3: Add two more campus random events for each start route**
- [x] **Step 4: Run targeted tests and verify GREEN**

### Task 2: Graduation Resource Inheritance

**Files:**
- Modify: `src/game/rules/graduation.test.ts`
- Modify: `src/game/rules/graduation.ts`

- [x] **Step 1: Write failing tests for post-graduation resource rewards**
- [x] **Step 2: Run targeted tests and verify RED**
- [x] **Step 3: Add graduation outcome flags and resource rewards**
- [x] **Step 4: Run targeted tests and verify GREEN**

### Task 3: Verification

**Files:**
- No additional code changes.

- [x] **Step 1: Run full test suite**
- [x] **Step 2: Run typecheck**
- [x] **Step 3: Run production build**
- [x] **Step 4: Run `git diff --check`**
