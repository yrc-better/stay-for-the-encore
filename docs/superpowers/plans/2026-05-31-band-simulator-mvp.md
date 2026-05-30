# Band Simulator MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable React/Vite web MVP of 《乐队模拟器》 covering route selection, four monthly turns, actions, feedback, work creation, recording, storage, and callable ending evaluation.

**Architecture:** Keep game rules in pure TypeScript modules under `src/game`, with React components only dispatching actions and rendering state. Data tables live in config/content files so balance and narrative can be edited without changing reducers. UI state, including the feedback modal and route selection, lives in a thin `useGameController` hook.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, localStorage, plain CSS.

---

## Source Specs

- Product design: `docs/superpowers/specs/2026-05-31-band-simulator-design.md`
- Data spec: `docs/superpowers/specs/2026-05-31-band-simulator-data-spec.md`

## File Structure

Create this structure:

```text
index.html
package.json
tsconfig.json
vite.config.ts
vitest.setup.ts
src/main.tsx
src/App.tsx
src/styles.css
src/game/types.ts
src/game/config/balance.ts
src/game/config/equipment.ts
src/game/config/endingRules.ts
src/game/content/actions.ts
src/game/content/events.ts
src/game/content/feedback.ts
src/game/state/createInitialState.ts
src/game/state/month.ts
src/game/rules/clamp.ts
src/game/rules/effects.ts
src/game/rules/actions.ts
src/game/rules/events.ts
src/game/rules/recording.ts
src/game/rules/ending.ts
src/game/storage/saveGame.ts
src/game/ui/useGameController.ts
src/components/RouteSelect.tsx
src/components/GameLayout.tsx
src/components/ActionPanel.tsx
src/components/FeedbackModal.tsx
src/components/EndingView.tsx
src/game/**/*.test.ts
src/components/**/*.test.tsx
```

Responsibilities:

- `src/game/types.ts`: shared domain types copied from the data spec and tightened for implementation.
- `src/game/config/*`: balance tables, default equipment, ending title rules.
- `src/game/content/*`: action definitions, fixed MVP events, reusable feedback lines.
- `src/game/rules/*`: pure functions for action resolution, effects, events, recording, month advancement, and ending scoring.
- `src/game/state/*`: initial state and month lifecycle.
- `src/game/storage/*`: save/load/clear with schema version validation.
- `src/components/*`: presentational React components.
- `src/game/ui/useGameController.ts`: UI-facing orchestration hook that connects pure game functions to React state and localStorage.

## Execution Notes

- Use TDD for game logic and storage. For UI, write interaction tests before component implementation.
- Keep commits small: one task, one commit.
- Do not add routing, server APIs, account systems, cloud saves, animation libraries, or UI component libraries in this MVP.
- Do not display hidden ending title tendencies during gameplay.

---

### Task 1: Project Scaffold And Test Harness

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create package and config files**

Create `package.json`:

```json
{
  "name": "band-simulator",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "vite": "^7.0.0",
    "typescript": "^5.9.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "jsdom": "^26.0.0",
    "vitest": "^3.0.0"
  }
}
```

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>乐队模拟器</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals"]
  },
  "include": ["src", "vite.config.ts", "vitest.setup.ts"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true
  }
});
```

Create `vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

Create `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <h1>乐队模拟器</h1>
      <p>准备开始你的吉他手生涯。</p>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  color: #f4f1ea;
  background: #121212;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100dvh;
}

button {
  font: inherit;
}

.app-shell {
  min-height: 100dvh;
  padding: 24px;
  background: #121212;
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 3: Verify scaffold builds**

Run: `npm run typecheck`

Expected: exit 0.

Run: `npm run build`

Expected: exit 0 and `dist/` is created.

- [ ] **Step 4: Commit scaffold**

```bash
git add package.json package-lock.json index.html tsconfig.json vite.config.ts vitest.setup.ts src
git commit -m "chore: scaffold band simulator app"
```

---

### Task 2: Domain Types, Balance Tables, And Initial State

**Files:**
- Create: `src/game/types.ts`
- Create: `src/game/config/balance.ts`
- Create: `src/game/config/equipment.ts`
- Create: `src/game/state/createInitialState.ts`
- Test: `src/game/state/createInitialState.test.ts`

- [ ] **Step 1: Write failing initial-state tests**

Create `src/game/state/createInitialState.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialState } from "./createInitialState";

describe("createInitialState", () => {
  it("creates writer route stats from the data spec", () => {
    const state = createInitialState("writer");

    expect(state.month).toBe("2027-05");
    expect(state.route).toBe("writer");
    expect(state.player.creativity).toBe(62);
    expect(state.player.stress).toBe(28);
    expect(state.player.stamina).toBe(100);
    expect(state.band.funds).toBe(1200);
    expect(state.relationships.vocal).toBe(46);
    expect(state.monthly.actionCounts).toEqual({});
    expect(state.counters.overdraftActions).toBe(0);
    expect(state.equipment.guitar.name).toBe("二手 Jazzmaster");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/game/state/createInitialState.test.ts --run`

Expected: FAIL because `createInitialState` does not exist.

- [ ] **Step 3: Add domain types and balance config**

Create `src/game/types.ts`:

```ts
export type RouteId = "technician" | "writer" | "performer" | "rebel";
export type MonthId = `${number}-${string}`;
export type CharacterId = "vocal" | "bass" | "drums";

export type PlayerStatKey =
  | "stamina"
  | "technique"
  | "creativity"
  | "stage"
  | "health"
  | "stress"
  | "fame"
  | "wealth";

export type BandStatKey = "cohesion" | "workQuality" | "fans" | "reputation" | "funds";

export type DerivedModifierKey =
  | "recordingQuality"
  | "performanceStability"
  | "riffQuality"
  | "styleDiscovery";

export type EquipmentModifierKey = PlayerStatKey | BandStatKey | DerivedModifierKey;

export interface EquipmentItem {
  id: string;
  name: string;
  tags: string[];
  modifiers?: Partial<Record<EquipmentModifierKey, number>>;
}

export interface EquipmentLoadout {
  guitar: EquipmentItem;
  pedals: EquipmentItem[];
  amp: EquipmentItem;
}

export interface MonthlyState {
  actionCounts: Record<string, number>;
  staminaCapPenalty: number;
  riskEventsThisMonth: number;
}

export interface GameCounters {
  overdraftActions: number;
  missedOpportunities: number;
  healthCrises: number;
  iconicPerformances: number;
  contractCompromises: number;
}

export interface Riff {
  id: string;
  createdAt: MonthId;
  titleSeed: string;
  quality: number;
  styleTags: string[];
  source: "write_riff" | "event" | "equipment";
}

export interface Work {
  id: string;
  title: string;
  stage: "draft" | "song";
  sourceRiffIds: string[];
  completion: number;
  quality: number;
  rehearsal: number;
  styleTags: string[];
  authorship: "player_led" | "shared" | "vocal_led" | "fragmented";
  tension: number;
}

export interface Recording {
  id: string;
  createdAt: MonthId;
  workId: string;
  type: "demo" | "single" | "album_track";
  quality: number;
  rawness: number;
  released: boolean;
}

export interface Release {
  id: string;
  month: MonthId;
  type: "demo" | "single" | "ep" | "album";
  title: string;
  recordingIds: string[];
  sales: number;
  criticalScore: number;
  fameImpact: number;
  awards: string[];
}

export interface HistoryEntry {
  id: string;
  month: MonthId;
  type: "event" | "performance" | "recording" | "release" | "contract" | "award" | "equipment" | "member";
  title: string;
  description: string;
  weight: number;
  tags: string[];
}

export interface GameState {
  month: MonthId;
  route: RouteId;
  player: Record<PlayerStatKey, number>;
  band: Record<BandStatKey, number>;
  relationships: Record<CharacterId, number>;
  equipment: EquipmentLoadout;
  monthly: MonthlyState;
  counters: GameCounters;
  flags: Record<string, boolean | number | string>;
  riffs: Riff[];
  works: Work[];
  recordings: Recording[];
  releases: Release[];
  history: HistoryEntry[];
  queuedEvents: string[];
}
```

Create `src/game/config/balance.ts`:

```ts
import type { BandStatKey, CharacterId, PlayerStatKey, RouteId } from "../types";

export const PLAYER_INITIAL_STATS: Record<RouteId, Record<PlayerStatKey, number>> = {
  technician: { stamina: 100, technique: 62, creativity: 38, stage: 28, health: 78, stress: 22, fame: 5, wealth: 800 },
  writer: { stamina: 100, technique: 42, creativity: 62, stage: 34, health: 76, stress: 28, fame: 6, wealth: 860 },
  performer: { stamina: 100, technique: 38, creativity: 36, stage: 62, health: 74, stress: 32, fame: 10, wealth: 700 },
  rebel: { stamina: 100, technique: 45, creativity: 46, stage: 48, health: 70, stress: 38, fame: 8, wealth: 650 }
};

export const BAND_INITIAL_STATS: Record<BandStatKey, number> = {
  cohesion: 52,
  workQuality: 20,
  fans: 18,
  reputation: 12,
  funds: 1200
};

export const RELATIONSHIP_INITIAL_STATS: Record<RouteId, Record<CharacterId, number>> = {
  technician: { vocal: 48, bass: 56, drums: 50 },
  writer: { vocal: 46, bass: 54, drums: 48 },
  performer: { vocal: 58, bass: 50, drums: 56 },
  rebel: { vocal: 42, bass: 48, drums: 45 }
};

export const STAMINA = {
  baseCap: 100,
  monthlyRecovery: 80,
  min: -60,
  lowHealthCapPenalty: 10
} as const;
```

Create `src/game/config/equipment.ts`:

```ts
import type { EquipmentLoadout } from "../types";

export const DEFAULT_EQUIPMENT: EquipmentLoadout = {
  guitar: {
    id: "guitar.used-jazzmaster",
    name: "二手 Jazzmaster",
    tags: ["noise", "alternative", "offset"],
    modifiers: { riffQuality: 2 }
  },
  pedals: [
    { id: "pedal.overdrive", name: "Overdrive", tags: ["drive"], modifiers: { performanceStability: 1 } },
    { id: "pedal.chorus", name: "Chorus", tags: ["chorus"], modifiers: { styleDiscovery: 1 } },
    { id: "pedal.delay", name: "Delay", tags: ["delay"], modifiers: { recordingQuality: 1 } }
  ],
  amp: {
    id: "amp.practice-combo",
    name: "练习室共用 Combo",
    tags: ["practice"],
    modifiers: { recordingQuality: -2, performanceStability: 0 }
  }
};
```

- [ ] **Step 4: Add minimal initial state implementation**

Create `src/game/state/createInitialState.ts`:

```ts
import { BAND_INITIAL_STATS, PLAYER_INITIAL_STATS, RELATIONSHIP_INITIAL_STATS } from "../config/balance";
import { DEFAULT_EQUIPMENT } from "../config/equipment";
import type { GameState, RouteId } from "../types";

export function createInitialState(route: RouteId): GameState {
  return {
    month: "2027-05",
    route,
    player: { ...PLAYER_INITIAL_STATS[route] },
    band: { ...BAND_INITIAL_STATS },
    relationships: { ...RELATIONSHIP_INITIAL_STATS[route] },
    equipment: {
      guitar: { ...DEFAULT_EQUIPMENT.guitar },
      pedals: DEFAULT_EQUIPMENT.pedals.map((pedal) => ({ ...pedal })),
      amp: { ...DEFAULT_EQUIPMENT.amp }
    },
    monthly: { actionCounts: {}, staminaCapPenalty: 0, riskEventsThisMonth: 0 },
    counters: {
      overdraftActions: 0,
      missedOpportunities: 0,
      healthCrises: 0,
      iconicPerformances: 0,
      contractCompromises: 0
    },
    flags: {},
    riffs: [],
    works: [],
    recordings: [],
    releases: [],
    history: [],
    queuedEvents: []
  };
}
```

- [ ] **Step 5: Verify test passes**

Run: `npm test -- src/game/state/createInitialState.test.ts --run`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game
git commit -m "feat: add initial game state"
```

---

### Task 3: Month Advancement And Stamina Rules

**Files:**
- Create: `src/game/rules/clamp.ts`
- Create: `src/game/state/month.ts`
- Test: `src/game/state/month.test.ts`

- [ ] **Step 1: Write failing month tests**

Create `src/game/state/month.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialState } from "./createInitialState";
import { advanceMonth, getEffectiveStaminaCap } from "./month";

describe("month advancement", () => {
  it("recovers stamina, clears monthly counters, and moves to the next month", () => {
    const state = createInitialState("writer");
    state.player.stamina = 20;
    state.monthly.actionCounts.rest = 2;
    state.monthly.riskEventsThisMonth = 1;

    const next = advanceMonth(state);

    expect(next.month).toBe("2027-06");
    expect(next.player.stamina).toBe(100);
    expect(next.monthly.actionCounts).toEqual({});
    expect(next.monthly.riskEventsThisMonth).toBe(0);
  });

  it("uses effective stamina cap when health is low", () => {
    const state = createInitialState("writer");
    state.player.health = 35;
    state.player.stamina = 50;

    const next = advanceMonth(state);

    expect(next.monthly.staminaCapPenalty).toBe(10);
    expect(getEffectiveStaminaCap(next)).toBe(90);
    expect(next.player.stamina).toBe(90);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/game/state/month.test.ts --run`

Expected: FAIL because `advanceMonth` does not exist.

- [ ] **Step 3: Implement clamp and month advancement**

Create `src/game/rules/clamp.ts`:

```ts
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
```

Create `src/game/state/month.ts`:

```ts
import { STAMINA } from "../config/balance";
import { clamp } from "../rules/clamp";
import type { GameState, MonthId } from "../types";

export function getEffectiveStaminaCap(state: GameState): number {
  return STAMINA.baseCap - state.monthly.staminaCapPenalty;
}

export function nextMonth(month: MonthId): MonthId {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  const date = new Date(Date.UTC(year, monthNumber, 1));
  const nextYear = date.getUTCFullYear();
  const nextMonthNumber = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonthNumber}` as MonthId;
}

export function advanceMonth(state: GameState): GameState {
  const staminaCapPenalty = state.player.health < 40 ? STAMINA.lowHealthCapPenalty : 0;
  const effectiveCap = STAMINA.baseCap - staminaCapPenalty;
  const recoveredStamina = clamp(state.player.stamina + STAMINA.monthlyRecovery, STAMINA.min, effectiveCap);

  return {
    ...state,
    month: nextMonth(state.month),
    player: { ...state.player, stamina: recoveredStamina },
    monthly: { actionCounts: {}, staminaCapPenalty, riskEventsThisMonth: 0 }
  };
}
```

- [ ] **Step 4: Verify month tests pass**

Run: `npm test -- src/game/state/month.test.ts --run`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/rules/clamp.ts src/game/state/month.ts src/game/state/month.test.ts
git commit -m "feat: add month advancement rules"
```

---

### Task 4: Effects Reducer

**Files:**
- Create: `src/game/rules/effects.ts`
- Test: `src/game/rules/effects.test.ts`
- Modify: `src/game/types.ts`

- [ ] **Step 1: Add Effect types**

Modify `src/game/types.ts` by appending:

```ts
export type Effect =
  | { kind: "playerStat"; key: PlayerStatKey; amount: number }
  | { kind: "bandStat"; key: BandStatKey; amount: number }
  | { kind: "relationship"; character: CharacterId; amount: number }
  | { kind: "flag"; key: string; value: boolean | number | string }
  | { kind: "counter"; key: keyof GameCounters; amount: number }
  | { kind: "addRiff"; riff: Omit<Riff, "id" | "createdAt"> }
  | {
      kind: "advanceWork";
      workId?: string;
      amount: number;
      qualityAmount?: number;
      rehearsalAmount?: number;
      sourceRiffId?: string;
      authorship?: Work["authorship"];
      tensionAmount?: number;
      styleTags?: string[];
    }
  | { kind: "addRecording"; recording: Omit<Recording, "id" | "createdAt"> }
  | { kind: "addRelease"; release: Omit<Release, "id" | "month"> }
  | { kind: "addHistory"; entry: Omit<HistoryEntry, "id" | "month"> }
  | { kind: "queueEvent"; eventId: string };

export interface Feedback {
  title: string;
  body: string;
  memberReactions?: Partial<Record<CharacterId, string>>;
  followUpEventId?: string;
}

export interface ActionResult {
  effects: Effect[];
  feedback: Feedback;
}
```

- [ ] **Step 2: Write failing effects tests**

Create `src/game/rules/effects.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { applyEffects } from "./effects";

describe("applyEffects", () => {
  it("clamps stats and increments overdraft counter when stamina goes below zero", () => {
    const state = createInitialState("writer");
    state.player.stamina = 10;

    const next = applyEffects(state, [{ kind: "playerStat", key: "stamina", amount: -35 }]);

    expect(next.player.stamina).toBe(-25);
    expect(next.counters.overdraftActions).toBe(1);
  });

  it("adds riffs and queues history entries with generated ids", () => {
    const state = createInitialState("writer");

    const next = applyEffects(state, [
      { kind: "addRiff", riff: { titleSeed: "雨后的失真", quality: 24, styleTags: ["delay"], source: "write_riff" } },
      { kind: "addHistory", entry: { type: "event", title: "练习室夜谈", description: "主唱没有离开。", weight: 2, tags: ["member"] } }
    ]);

    expect(next.riffs).toHaveLength(1);
    expect(next.riffs[0].createdAt).toBe("2027-05");
    expect(next.history[0].month).toBe("2027-05");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/game/rules/effects.test.ts --run`

Expected: FAIL because `applyEffects` does not exist.

- [ ] **Step 4: Implement effect reducer**

Create `src/game/rules/effects.ts`:

```ts
import { STAMINA } from "../config/balance";
import type { Effect, GameState, PlayerStatKey } from "../types";
import { clamp } from "./clamp";

function id(prefix: string, count: number): string {
  return `${prefix}.${count + 1}`;
}

function clampPlayerStat(state: GameState, key: PlayerStatKey, value: number): number {
  if (key === "stamina") {
    const effectiveCap = STAMINA.baseCap - state.monthly.staminaCapPenalty;
    return clamp(value, STAMINA.min, effectiveCap);
  }
  if (key === "wealth") return Math.max(0, value);
  return clamp(value, 0, 100);
}

export function applyEffects(state: GameState, effects: Effect[]): GameState {
  return effects.reduce<GameState>((current, effect) => {
    if (effect.kind === "playerStat") {
      const nextValue = clampPlayerStat(current, effect.key, current.player[effect.key] + effect.amount);
      const overdraft = effect.key === "stamina" && nextValue < 0 && current.player.stamina >= 0 ? 1 : 0;
      return {
        ...current,
        player: { ...current.player, [effect.key]: nextValue },
        counters: { ...current.counters, overdraftActions: current.counters.overdraftActions + overdraft }
      };
    }
    if (effect.kind === "bandStat") {
      return { ...current, band: { ...current.band, [effect.key]: clamp(current.band[effect.key] + effect.amount, 0, 100000) } };
    }
    if (effect.kind === "relationship") {
      return {
        ...current,
        relationships: { ...current.relationships, [effect.character]: clamp(current.relationships[effect.character] + effect.amount, 0, 100) }
      };
    }
    if (effect.kind === "flag") {
      return { ...current, flags: { ...current.flags, [effect.key]: effect.value } };
    }
    if (effect.kind === "counter") {
      return { ...current, counters: { ...current.counters, [effect.key]: current.counters[effect.key] + effect.amount } };
    }
    if (effect.kind === "addRiff") {
      return {
        ...current,
        riffs: [...current.riffs, { ...effect.riff, id: id("riff", current.riffs.length), createdAt: current.month }]
      };
    }
    if (effect.kind === "addHistory") {
      return {
        ...current,
        history: [...current.history, { ...effect.entry, id: id("history", current.history.length), month: current.month }]
      };
    }
    if (effect.kind === "queueEvent") {
      return { ...current, queuedEvents: [...current.queuedEvents, effect.eventId] };
    }
    return current;
  }, state);
}
```

- [ ] **Step 5: Verify effects tests pass**

Run: `npm test -- src/game/rules/effects.test.ts --run`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/types.ts src/game/rules/effects.ts src/game/rules/effects.test.ts
git commit -m "feat: add effect reducer"
```

---

### Task 5: Work Pipeline And Recording

**Files:**
- Modify: `src/game/rules/effects.ts`
- Create: `src/game/rules/recording.ts`
- Test: `src/game/rules/workPipeline.test.ts`

- [ ] **Step 1: Write failing work pipeline tests**

Create `src/game/rules/workPipeline.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { applyEffects } from "./effects";
import { createRecording } from "./recording";

describe("work pipeline", () => {
  it("creates a draft from a riff, advances completion, and turns it into a song", () => {
    let state = createInitialState("writer");
    state = applyEffects(state, [{ kind: "addRiff", riff: { titleSeed: "雨后的失真", quality: 24, styleTags: ["delay"], source: "write_riff" } }]);

    state = applyEffects(state, [{ kind: "advanceWork", amount: 35, sourceRiffId: state.riffs[0].id, qualityAmount: 0, authorship: "player_led", styleTags: ["delay"] }]);
    expect(state.works[0].completion).toBe(35);
    expect(state.works[0].quality).toBeGreaterThanOrEqual(42);

    state = applyEffects(state, [{ kind: "advanceWork", workId: state.works[0].id, amount: 70, qualityAmount: 16 }]);
    expect(state.works[0].stage).toBe("song");
    expect(state.works[0].completion).toBe(100);
  });

  it("creates a demo recording from a completed and rehearsed song", () => {
    let state = createInitialState("writer");
    state.works.push({
      id: "work.1",
      title: "雨后的失真",
      stage: "song",
      sourceRiffIds: ["riff.1"],
      completion: 100,
      quality: 58,
      rehearsal: 30,
      styleTags: ["delay"],
      authorship: "shared",
      tension: 0
    });

    const recording = createRecording(state, "work.1");

    expect(recording.type).toBe("demo");
    expect(recording.quality).toBeGreaterThanOrEqual(43);
    expect(recording.released).toBe(false);
  });

  it("can increase rehearsal through advanceWork", () => {
    let state = createInitialState("writer");
    state.works.push({
      id: "work.1",
      title: "雨后的失真",
      stage: "song",
      sourceRiffIds: ["riff.1"],
      completion: 100,
      quality: 58,
      rehearsal: 0,
      styleTags: ["delay"],
      authorship: "shared",
      tension: 0
    });

    state = applyEffects(state, [{ kind: "advanceWork", workId: "work.1", amount: 0, rehearsalAmount: 15 }]);

    expect(state.works[0].rehearsal).toBe(15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/game/rules/workPipeline.test.ts --run`

Expected: FAIL because `advanceWork` returns unchanged state and `createRecording` does not exist.

- [ ] **Step 3: Extend effects for advanceWork**

Modify `src/game/rules/effects.ts` so the `advanceWork` branch appears before the final `return current`:

```ts
    if (effect.kind === "addRecording") {
      return {
        ...current,
        recordings: [...current.recordings, { ...effect.recording, id: id("recording", current.recordings.length), createdAt: current.month }]
      };
    }

    if (effect.kind === "addRelease") {
      return {
        ...current,
        releases: [...current.releases, { ...effect.release, id: id("release", current.releases.length), month: current.month }]
      };
    }

    if (effect.kind === "advanceWork") {
      const existing = effect.workId ? current.works.find((work) => work.id === effect.workId) : undefined;
      if (!existing) {
        if (!effect.sourceRiffId && effect.amount <= 0) return current;
        const sourceRiff = current.riffs.find((riff) => riff.id === effect.sourceRiffId) ?? current.riffs[0];
        const baseQuality = sourceRiff ? sourceRiff.quality : 20;
        const created = {
          id: id("work", current.works.length),
          title: sourceRiff?.titleSeed ?? "未命名的歌",
          stage: "draft" as const,
          sourceRiffIds: sourceRiff ? [sourceRiff.id] : [],
          completion: clamp(effect.amount, 0, 100),
          quality: clamp(baseQuality + current.player.creativity * 0.25 + current.band.cohesion * 0.1 + (effect.qualityAmount ?? 0), 0, 100),
          rehearsal: clamp(effect.rehearsalAmount ?? 0, 0, 100),
          styleTags: effect.styleTags ?? sourceRiff?.styleTags ?? [],
          authorship: effect.authorship ?? "shared",
          tension: Math.max(0, effect.tensionAmount ?? 0)
        };
        return { ...current, works: [...current.works, created] };
      }

      const works = current.works.map((work) => {
        if (work.id !== existing.id) return work;
        const completion = clamp(work.completion + effect.amount, 0, 100);
        return {
          ...work,
          completion,
          stage: completion >= 100 ? "song" as const : work.stage,
          quality: clamp(work.quality + (effect.qualityAmount ?? 8), 0, 100),
          rehearsal: clamp(work.rehearsal + (effect.rehearsalAmount ?? 0), 0, 100),
          authorship: effect.authorship ?? work.authorship,
          tension: clamp(work.tension + (effect.tensionAmount ?? 0), 0, 100),
          styleTags: Array.from(new Set([...work.styleTags, ...(effect.styleTags ?? [])]))
        };
      });
      return { ...current, works };
    }
```

- [ ] **Step 4: Implement recording formula**

Create `src/game/rules/recording.ts`:

```ts
import type { GameState, Recording } from "../types";
import { clamp } from "./clamp";

export function equipmentRecordingBonus(state: GameState): number {
  const items = [state.equipment.guitar, ...state.equipment.pedals, state.equipment.amp];
  return clamp(items.reduce((sum, item) => sum + (item.modifiers?.recordingQuality ?? 0), 0), -10, 15);
}

export function createRecording(state: GameState, workId: string): Omit<Recording, "id" | "createdAt"> {
  const work = state.works.find((candidate) => candidate.id === workId);
  if (!work) throw new Error(`Work not found: ${workId}`);
  if (work.stage !== "song") throw new Error(`Work is not complete: ${workId}`);
  if (work.rehearsal < 30) throw new Error(`Work rehearsal is too low: ${workId}`);

  const quality = Math.round(clamp(
    work.quality * 0.45 +
      work.rehearsal * 0.25 +
      state.player.technique * 0.15 +
      state.band.cohesion * 0.1 +
      equipmentRecordingBonus(state),
    0,
    100
  ));

  return {
    workId,
    type: "demo",
    quality,
    rawness: clamp(100 - quality, 0, 100),
    released: false
  };
}
```

- [ ] **Step 5: Verify work pipeline tests pass**

Run: `npm test -- src/game/rules/workPipeline.test.ts --run`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/rules/effects.ts src/game/rules/recording.ts src/game/rules/workPipeline.test.ts
git commit -m "feat: add work and recording pipeline"
```

---

### Task 6: Action Definitions And Resolver

**Files:**
- Create: `src/game/content/actions.ts`
- Create: `src/game/content/feedback.ts`
- Create: `src/game/rules/actions.ts`
- Test: `src/game/rules/actions.test.ts`

- [ ] **Step 1: Write failing action tests**

Create `src/game/rules/actions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { performAction } from "./actions";

describe("performAction", () => {
  it("practice guitar consumes stamina, improves technique, and returns feedback", () => {
    const state = createInitialState("writer");
    const result = performAction(state, "practice");

    expect(result.state.player.stamina).toBe(85);
    expect(result.state.player.technique).toBe(45);
    expect(result.feedback.title).toBe("练到指尖发烫");
  });

  it("rest only gives full benefits twice per month", () => {
    let state = createInitialState("writer");
    state.player.stamina = 40;

    state = performAction(state, "rest").state;
    state = performAction(state, "rest").state;
    state = performAction(state, "rest").state;

    expect(state.monthly.actionCounts.rest).toBe(3);
    expect(state.player.stamina).toBe(90);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/game/rules/actions.test.ts --run`

Expected: FAIL because `performAction` does not exist.

- [ ] **Step 3: Define action content and feedback**

Create `src/game/content/feedback.ts`:

```ts
import type { Feedback } from "../types";

export const FEEDBACK: Record<string, Feedback> = {
  practice: {
    title: "练到指尖发烫",
    body: "你把同一段过门弹到深夜。它终于不再像借来的句子，而像你自己的声音。"
  },
  write_riff: {
    title: "一段新的 Riff",
    body: "你在失真的尾音里抓到一个动机。它还不像歌，但已经有了方向。"
  },
  study_style: {
    title: "唱片和现场录像",
    body: "你把陌生曲风拆成和弦、音色和节奏。下一次写歌时，它会悄悄冒出来。"
  },
  part_time_job: {
    title: "换来一笔现金",
    body: "你用半天体力换来能继续排练的钱。回去的路上，手腕比早上更沉。"
  },
  rest: {
    title: "把琴放回架上",
    body: "你睡了一个完整的下午。醒来时，排练室的噪音还在脑子里，但身体终于不再发沉。"
  },
  restDiminished: {
    title: "休息也变得焦躁",
    body: "你试着休息，但脑子仍在排练毕业演出的每一处失误。"
  },
  socialize: {
    title: "人脉从闲聊开始",
    body: "你在吧台旁认识了几个常去 Livehouse 的人。没人承诺什么，但他们记住了乐队名。"
  },
  visit_guitar_shop: {
    title: "二手琴墙前",
    body: "你试了几把负担不起的琴。回到练习室时，你更清楚自己想要什么声音。"
  },
  breakthrough: {
    title: "把自己逼过界",
    body: "你连续练到天亮。某个瞬间手指跟上了脑子，代价是整个人像被掏空。"
  },
  rehearse: {
    title: "排练室里的统一",
    body: "你们终于在同一个重拍上落下。短暂的一秒里，这支乐队像是真的。"
  },
  band_write: {
    title: "团体创作",
    body: "你的 Riff 被鼓点推着向前，贝斯补上了空白。它开始从个人片段变成乐队作品。"
  },
  record: {
    title: "录下此刻",
    body: "录音不会原谅犹豫。每一次没弹稳的地方，都被清楚地留了下来。"
  },
  perform: {
    title: "灯亮之前",
    body: "你听见台下说话声逐渐低下去。第一下扫弦之后，排练室以外的世界终于回应了你。"
  },
  member_talk: {
    title: "把话说开",
    body: "你们没有解决所有问题，但至少这一次没有让沉默替你们做决定。"
  },
  promote: {
    title: "把歌推向人群",
    body: "海报、短视频和朋友转发把乐队推到更多人面前。随之而来的还有更多期待。"
  },
  negotiate: {
    title: "合作的门缝",
    body: "对方没有立刻答应，但留下了联系方式。你知道这可能是机会，也可能是另一种束缚。"
  },
  band_rest: {
    title: "乐队休整",
    body: "你们没有排练，也没有争论。只是一起吃了顿饭，像四个普通朋友。"
  },
  noRecordableWork: {
    title: "还录不了",
    body: "现在还没有排练度足够的完整歌曲。录音灯亮起之前，你们还需要把歌弹稳。"
  }
};
```

Create `src/game/content/actions.ts`:

```ts
import type { Effect } from "../types";

export type ActionId =
  | "practice"
  | "write_riff"
  | "study_style"
  | "part_time_job"
  | "rest"
  | "socialize"
  | "visit_guitar_shop"
  | "breakthrough"
  | "rehearse"
  | "band_write"
  | "record"
  | "perform"
  | "member_talk"
  | "promote"
  | "negotiate"
  | "band_rest";

export interface ActionDefinition {
  id: ActionId;
  label: string;
  group: "personal" | "band";
  staminaCost: number;
  effects: Effect[];
}

export const ACTIONS: Record<ActionId, ActionDefinition> = {
  practice: { id: "practice", label: "练琴", group: "personal", staminaCost: 15, effects: [{ kind: "playerStat", key: "technique", amount: 3 }, { kind: "playerStat", key: "stress", amount: 2 }] },
  write_riff: {
    id: "write_riff",
    label: "写 Riff",
    group: "personal",
    staminaCost: 18,
    effects: [
      { kind: "playerStat", key: "creativity", amount: 2 },
      { kind: "playerStat", key: "stress", amount: 2 },
      { kind: "addRiff", riff: { titleSeed: "雨后的失真", quality: 24, styleTags: ["delay"], source: "write_riff" } }
    ]
  },
  study_style: { id: "study_style", label: "研究风格", group: "personal", staminaCost: 12, effects: [{ kind: "playerStat", key: "creativity", amount: 1 }, { kind: "playerStat", key: "wealth", amount: -150 }] },
  part_time_job: { id: "part_time_job", label: "打工", group: "personal", staminaCost: 22, effects: [{ kind: "playerStat", key: "wealth", amount: 450 }, { kind: "playerStat", key: "stress", amount: 3 }, { kind: "playerStat", key: "health", amount: -1 }] },
  rest: { id: "rest", label: "休息", group: "personal", staminaCost: 0, effects: [{ kind: "playerStat", key: "stamina", amount: 25 }, { kind: "playerStat", key: "stress", amount: -8 }, { kind: "playerStat", key: "health", amount: 2 }] },
  socialize: { id: "socialize", label: "社交", group: "personal", staminaCost: 12, effects: [{ kind: "playerStat", key: "fame", amount: 1 }] },
  visit_guitar_shop: { id: "visit_guitar_shop", label: "逛乐器店", group: "personal", staminaCost: 10, effects: [{ kind: "playerStat", key: "stress", amount: -1 }] },
  breakthrough: { id: "breakthrough", label: "自我突破", group: "personal", staminaCost: 35, effects: [{ kind: "playerStat", key: "creativity", amount: 6 }, { kind: "playerStat", key: "stress", amount: 10 }, { kind: "playerStat", key: "health", amount: -4 }] },
  rehearse: {
    id: "rehearse",
    label: "排练",
    group: "band",
    staminaCost: 25,
    effects: [
      { kind: "bandStat", key: "cohesion", amount: 4 },
      { kind: "advanceWork", amount: 0, rehearsalAmount: 15 },
      { kind: "playerStat", key: "stage", amount: 1 },
      { kind: "playerStat", key: "stress", amount: 3 }
    ]
  },
  band_write: {
    id: "band_write",
    label: "团体创作",
    group: "band",
    staminaCost: 30,
    effects: [
      { kind: "advanceWork", amount: 35, qualityAmount: 8, authorship: "shared" },
      { kind: "bandStat", key: "workQuality", amount: 4 },
      { kind: "bandStat", key: "cohesion", amount: 1 }
    ]
  },
  record: { id: "record", label: "录音", group: "band", staminaCost: 35, effects: [{ kind: "bandStat", key: "funds", amount: -300 }, { kind: "playerStat", key: "fame", amount: 3 }] },
  perform: { id: "perform", label: "演出", group: "band", staminaCost: 40, effects: [{ kind: "playerStat", key: "fame", amount: 6 }, { kind: "playerStat", key: "wealth", amount: 300 }, { kind: "bandStat", key: "fans", amount: 10 }, { kind: "playerStat", key: "stage", amount: 2 }, { kind: "playerStat", key: "health", amount: -3 }] },
  member_talk: { id: "member_talk", label: "成员谈话", group: "band", staminaCost: 12, effects: [{ kind: "playerStat", key: "stress", amount: -2 }] },
  promote: { id: "promote", label: "宣传", group: "band", staminaCost: 18, effects: [{ kind: "playerStat", key: "fame", amount: 4 }, { kind: "bandStat", key: "fans", amount: 8 }, { kind: "playerStat", key: "wealth", amount: -100 }, { kind: "playerStat", key: "stress", amount: 2 }] },
  negotiate: { id: "negotiate", label: "谈合作", group: "band", staminaCost: 20, effects: [{ kind: "flag", key: "contract.hasLabelIntro", value: true }] },
  band_rest: { id: "band_rest", label: "休整", group: "band", staminaCost: 0, effects: [{ kind: "bandStat", key: "cohesion", amount: 2 }, { kind: "playerStat", key: "stress", amount: -6 }, { kind: "playerStat", key: "health", amount: 2 }] }
};
```

- [ ] **Step 4: Implement resolver**

Create `src/game/rules/actions.ts`:

```ts
import { ACTIONS, type ActionId } from "../content/actions";
import { FEEDBACK } from "../content/feedback";
import type { Feedback, GameState } from "../types";
import { applyEffects } from "./effects";
import { createRecording } from "./recording";

export interface PerformedAction {
  state: GameState;
  feedback: Feedback;
}

function incrementActionCount(state: GameState, actionId: ActionId): GameState {
  return {
    ...state,
    monthly: {
      ...state.monthly,
      actionCounts: {
        ...state.monthly.actionCounts,
        [actionId]: (state.monthly.actionCounts[actionId] ?? 0) + 1
      }
    }
  };
}

export function performAction(state: GameState, actionId: ActionId): PerformedAction {
  const action = ACTIONS[actionId];
  const count = state.monthly.actionCounts[actionId] ?? 0;
  const dynamicEffects = [...action.effects];
  if (actionId === "record") {
    const target = state.works.find((work) => work.stage === "song" && work.rehearsal >= 30);
    if (!target) {
      return { state, feedback: FEEDBACK.noRecordableWork };
    }
    dynamicEffects.push({ kind: "addRecording" as const, recording: createRecording(state, target.id) });
  }
  const fullEffects = [{ kind: "playerStat" as const, key: "stamina" as const, amount: -action.staminaCost }, ...dynamicEffects];
  const effects = actionId === "rest" && count >= 2 ? [{ kind: "playerStat" as const, key: "stamina" as const, amount: 0 }] : fullEffects;
  const next = incrementActionCount(applyEffects(state, effects), actionId);
  return { state: next, feedback: actionId === "rest" && count >= 2 ? FEEDBACK.restDiminished : FEEDBACK[actionId] };
}
```

- [ ] **Step 5: Verify action tests pass**

Run: `npm test -- src/game/rules/actions.test.ts --run`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/content src/game/rules/actions.ts src/game/rules/actions.test.ts
git commit -m "feat: add action resolver"
```

---

### Task 7: Events And Event Triggers

**Files:**
- Create: `src/game/content/events.ts`
- Create: `src/game/rules/events.ts`
- Test: `src/game/rules/events.test.ts`
- Modify: `src/game/types.ts`

- [ ] **Step 1: Add event types**

Append to `src/game/types.ts`:

```ts
export interface EventTrigger {
  months?: MonthId[];
  flagsAll?: string[];
  flagsNone?: string[];
  minPlayer?: Partial<Record<PlayerStatKey, number>>;
  maxPlayer?: Partial<Record<PlayerStatKey, number>>;
  minBand?: Partial<Record<BandStatKey, number>>;
  minRelationship?: Partial<Record<CharacterId, number>>;
  hasRiff?: boolean;
  hasCompletedSong?: boolean;
  hasDemo?: boolean;
  minRecordings?: number;
  randomWeight?: number;
}

export interface EventChoice {
  id: string;
  label: string;
  requirements?: EventTrigger;
  effects: Effect[];
  feedback: Feedback;
}

export interface GameEvent {
  id: string;
  title: string;
  tags: string[];
  priority: number;
  once: boolean;
  trigger: EventTrigger;
  body: string;
  choices: EventChoice[];
}
```

- [ ] **Step 2: Write failing event tests**

Create `src/game/rules/events.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { getAvailableEvents, triggerMatches } from "./events";

describe("event triggers", () => {
  it("matches the prologue rehearsal event in 2027-05", () => {
    const state = createInitialState("writer");
    const events = getAvailableEvents(state);

    expect(events[0].id).toBe("prologue.rehearsal_argument");
  });

  it("supports hasDemo and minRecordings predicates", () => {
    const state = createInitialState("writer");
    state.recordings.push({ id: "recording.1", createdAt: "2027-08", workId: "work.1", type: "demo", quality: 45, rawness: 55, released: false });

    expect(triggerMatches(state, { hasDemo: true, minRecordings: 1 })).toBe(true);
    expect(triggerMatches(state, { minRecordings: 2 })).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/game/rules/events.test.ts --run`

Expected: FAIL because event functions do not exist.

- [ ] **Step 4: Create MVP events**

Create `src/game/content/events.ts`:

```ts
import type { GameEvent } from "../types";

export const EVENTS: GameEvent[] = [
  {
    id: "prologue.rehearsal_argument",
    title: "毕业演出前的排练争执",
    tags: ["prologue", "member", "songwriting"],
    priority: 100,
    once: true,
    trigger: { months: ["2027-05"], flagsNone: ["prologue.rehearsalArgumentDone"] },
    body: "主唱认为新歌副歌应该更直接，你却觉得那会毁掉整首歌的阴影感。鼓手开始烦躁，贝斯手没有表态。",
    choices: [
      {
        id: "insist_arrangement",
        label: "坚持你的编曲",
        effects: [
          { kind: "playerStat", key: "creativity", amount: 4 },
          { kind: "relationship", character: "vocal", amount: -4 },
          { kind: "playerStat", key: "stress", amount: 5 },
          { kind: "flag", key: "songwriting.playerInsisted", value: true },
          { kind: "flag", key: "prologue.rehearsalArgumentDone", value: true }
        ],
        feedback: { title: "间奏保住了", body: "你把那段刺耳的和弦又弹了一遍。主唱没有再争，但排练室的空气明显冷了下去。" }
      },
      {
        id: "compromise",
        label: "妥协并保留间奏",
        effects: [
          { kind: "relationship", character: "vocal", amount: 3 },
          { kind: "bandStat", key: "workQuality", amount: 1 },
          { kind: "flag", key: "prologue.rehearsalArgumentDone", value: true }
        ],
        feedback: { title: "暂时达成一致", body: "你把副歌改得更直接，只留下间奏里最锋利的两小节。" }
      }
    ]
  },
  {
    id: "career.first_livehouse_offer",
    title: "第一次 Livehouse 机会",
    tags: ["career", "livehouse"],
    priority: 70,
    once: true,
    trigger: { flagsAll: ["career.hasLivehouseOffer"], flagsNone: ["career.firstLivehouseDone"] },
    body: "一个小型 Livehouse 给了你们暖场的机会，报酬很低，但台下会有真正听独立摇滚的人。",
    choices: [
      {
        id: "accept_low_pay",
        label: "接受低报酬演出",
        effects: [
          { kind: "playerStat", key: "fame", amount: 6 },
          { kind: "bandStat", key: "fans", amount: 12 },
          { kind: "playerStat", key: "wealth", amount: 200 },
          { kind: "playerStat", key: "health", amount: -3 },
          { kind: "flag", key: "career.firstLivehouseDone", value: true }
        ],
        feedback: { title: "第一盏真正的灯", body: "台下的人不多，但他们没有聊天。第一首歌结束后，你听见有人喊了乐队名。" }
      },
      {
        id: "miss_offer",
        label: "暂缓演出继续打磨",
        effects: [
          { kind: "bandStat", key: "workQuality", amount: 3 },
          { kind: "counter", key: "missedOpportunities", amount: 1 },
          { kind: "flag", key: "career.firstLivehouseDone", value: true }
        ],
        feedback: { title: "机会从门缝里溜走", body: "你说现在还不是时候。没人反驳，但鼓手把鼓棒收得很用力。" }
      }
    ]
  }
];
```

- [ ] **Step 5: Implement event matching**

Create `src/game/rules/events.ts`:

```ts
import { EVENTS } from "../content/events";
import type { EventTrigger, GameEvent, GameState } from "../types";

export function triggerMatches(state: GameState, trigger: EventTrigger): boolean {
  if (trigger.months && !trigger.months.includes(state.month)) return false;
  if (trigger.flagsAll?.some((flag) => !state.flags[flag])) return false;
  if (trigger.flagsNone?.some((flag) => state.flags[flag])) return false;
  if (trigger.hasRiff && state.riffs.length === 0) return false;
  if (trigger.hasCompletedSong && !state.works.some((work) => work.stage === "song")) return false;
  if (trigger.hasDemo && !state.recordings.some((recording) => recording.type === "demo")) return false;
  if (trigger.minRecordings && state.recordings.length < trigger.minRecordings) return false;
  if (trigger.minPlayer && Object.entries(trigger.minPlayer).some(([key, value]) => state.player[key as keyof typeof state.player] < value!)) return false;
  if (trigger.maxPlayer && Object.entries(trigger.maxPlayer).some(([key, value]) => state.player[key as keyof typeof state.player] > value!)) return false;
  if (trigger.minBand && Object.entries(trigger.minBand).some(([key, value]) => state.band[key as keyof typeof state.band] < value!)) return false;
  if (trigger.minRelationship && Object.entries(trigger.minRelationship).some(([key, value]) => state.relationships[key as keyof typeof state.relationships] < value!)) return false;
  return true;
}

export function getAvailableEvents(state: GameState): GameEvent[] {
  return EVENTS
    .filter((event) => triggerMatches(state, event.trigger))
    .sort((a, b) => b.priority - a.priority);
}
```

- [ ] **Step 6: Verify event tests pass**

Run: `npm test -- src/game/rules/events.test.ts --run`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/game/types.ts src/game/content/events.ts src/game/rules/events.ts src/game/rules/events.test.ts
git commit -m "feat: add event trigger system"
```

---

### Task 8: Ending Scoring

**Files:**
- Create: `src/game/config/endingRules.ts`
- Create: `src/game/rules/ending.ts`
- Test: `src/game/rules/ending.test.ts`

- [ ] **Step 1: Write failing ending tests**

Create `src/game/rules/ending.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { evaluateEnding } from "./ending";

describe("evaluateEnding", () => {
  it("selects technical master when technique dominates", () => {
    const state = createInitialState("technician");
    state.player.technique = 88;
    state.recordings.push({ id: "recording.1", createdAt: "2027-08", workId: "work.1", type: "demo", quality: 70, rawness: 30, released: false });

    const ending = evaluateEnding(state, "retirement");

    expect(ending.titleId).toBe("technical_master");
    expect(ending.trigger).toBe("retirement");
  });

  it("does not need gameplay UI tendency state", () => {
    const state = createInitialState("writer");
    state.player.creativity = 82;
    state.band.workQuality = 70;

    const ending = evaluateEnding(state, "preview");

    expect(ending.titleId).toBe("sound_shaper");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/game/rules/ending.test.ts --run`

Expected: FAIL because `evaluateEnding` does not exist.

- [ ] **Step 3: Create ending rules**

Create `src/game/config/endingRules.ts`:

```ts
import type { BandStatKey, GameCounters, PlayerStatKey } from "../types";

export type EndingTrigger = "retirement" | "farewell" | "lifespan" | "preview";

export type EndingRequirement =
  | { kind: "playerMin"; key: PlayerStatKey; value: number }
  | { kind: "playerMax"; key: PlayerStatKey; value: number }
  | { kind: "anyPlayerMin"; keys: PlayerStatKey[]; value: number }
  | { kind: "bandMin"; key: BandStatKey; value: number }
  | { kind: "relationshipAvgMin"; value: number }
  | { kind: "counterMin"; key: keyof GameCounters; value: number }
  | { kind: "uniqueStyleTagsMin"; value: number }
  | { kind: "totalSalesMin"; value: number }
  | { kind: "totalSalesMax"; value: number }
  | { kind: "historyTagMin"; tag: string; count: number };

export type EndingWeight =
  | { kind: "player"; key: PlayerStatKey; weight: number }
  | { kind: "band"; key: BandStatKey; weight: number }
  | { kind: "relationshipAverage"; weight: number }
  | { kind: "counter"; key: keyof GameCounters; weight: number }
  | { kind: "uniqueStyleTags"; weight: number }
  | { kind: "totalSales"; weight: number }
  | { kind: "recordingQualityMax"; weight: number }
  | { kind: "releaseCriticalScoreMax"; weight: number }
  | { kind: "historyTag"; tag: string; weight: number };

export interface EndingTitleRule {
  id: string;
  label: string;
  priority: number;
  requiredAll?: EndingRequirement[];
  requiredAny?: EndingRequirement[][];
  weights: EndingWeight[];
}

export const ENDING_RULES: EndingTitleRule[] = [
  { id: "technical_master", label: "技术宗师", priority: 80, requiredAll: [{ kind: "playerMin", key: "technique", value: 80 }], weights: [{ kind: "player", key: "technique", weight: 1.4 }, { kind: "recordingQualityMax", weight: 0.5 }] },
  { id: "guitar_hero", label: "吉他英雄", priority: 80, requiredAll: [{ kind: "playerMin", key: "stage", value: 80 }], weights: [{ kind: "player", key: "stage", weight: 1.3 }, { kind: "band", key: "fans", weight: 0.5 }] },
  { id: "sound_shaper", label: "声音塑造者", priority: 85, requiredAll: [{ kind: "playerMin", key: "creativity", value: 78 }], weights: [{ kind: "player", key: "creativity", weight: 1.4 }, { kind: "band", key: "workQuality", weight: 0.7 }] },
  { id: "unknown_craftsman", label: "无名匠人", priority: 40, requiredAll: [{ kind: "playerMax", key: "fame", value: 40 }], requiredAny: [[{ kind: "playerMin", key: "technique", value: 65 }], [{ kind: "playerMin", key: "creativity", value: 65 }]], weights: [{ kind: "player", key: "technique", weight: 0.8 }, { kind: "player", key: "creativity", weight: 0.8 }, { kind: "player", key: "fame", weight: -0.5 }] }
];
```

- [ ] **Step 4: Implement ending evaluation**

Create `src/game/rules/ending.ts`:

```ts
import { ENDING_RULES, type EndingRequirement, type EndingTitleRule, type EndingTrigger, type EndingWeight } from "../config/endingRules";
import type { GameState } from "../types";

export interface EndingResult {
  trigger: EndingTrigger;
  titleId: string;
  titleLabel: string;
  score: number;
  summary: string;
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function totalSales(state: GameState): number {
  return state.releases.reduce((sum, release) => sum + release.sales, 0);
}

function uniqueStyleTags(state: GameState): number {
  return new Set(state.works.flatMap((work) => work.styleTags)).size;
}

function historyTagCount(state: GameState, tag: string): number {
  return state.history.filter((entry) => entry.tags.includes(tag)).length;
}

function requirementMet(state: GameState, requirement: EndingRequirement): boolean {
  if (requirement.kind === "playerMin") return state.player[requirement.key] >= requirement.value;
  if (requirement.kind === "playerMax") return state.player[requirement.key] <= requirement.value;
  if (requirement.kind === "anyPlayerMin") return requirement.keys.some((key) => state.player[key] >= requirement.value);
  if (requirement.kind === "bandMin") return state.band[requirement.key] >= requirement.value;
  if (requirement.kind === "relationshipAvgMin") return average(Object.values(state.relationships)) >= requirement.value;
  if (requirement.kind === "counterMin") return state.counters[requirement.key] >= requirement.value;
  if (requirement.kind === "uniqueStyleTagsMin") return uniqueStyleTags(state) >= requirement.value;
  if (requirement.kind === "totalSalesMin") return totalSales(state) >= requirement.value;
  if (requirement.kind === "totalSalesMax") return totalSales(state) <= requirement.value;
  if (requirement.kind === "historyTagMin") return historyTagCount(state, requirement.tag) >= requirement.count;
  return false;
}

function ruleEligible(state: GameState, rule: EndingTitleRule): boolean {
  const all = rule.requiredAll?.every((requirement) => requirementMet(state, requirement)) ?? true;
  const any = rule.requiredAny ? rule.requiredAny.some((group) => group.every((requirement) => requirementMet(state, requirement))) : true;
  return all && any;
}

function weightScore(state: GameState, weight: EndingWeight): number {
  if (weight.kind === "player") return state.player[weight.key] * weight.weight;
  if (weight.kind === "band") return state.band[weight.key] * weight.weight;
  if (weight.kind === "relationshipAverage") return average(Object.values(state.relationships)) * weight.weight;
  if (weight.kind === "counter") return state.counters[weight.key] * 10 * weight.weight;
  if (weight.kind === "uniqueStyleTags") return uniqueStyleTags(state) * 10 * weight.weight;
  if (weight.kind === "totalSales") return Math.min(totalSales(state) / 1000, 100) * weight.weight;
  if (weight.kind === "recordingQualityMax") return Math.max(0, ...state.recordings.map((recording) => recording.quality)) * weight.weight;
  if (weight.kind === "releaseCriticalScoreMax") return Math.max(0, ...state.releases.map((release) => release.criticalScore)) * weight.weight;
  if (weight.kind === "historyTag") return historyTagCount(state, weight.tag) * 10 * weight.weight;
  return 0;
}

export function evaluateEnding(state: GameState, trigger: EndingTrigger): EndingResult {
  const ranked = ENDING_RULES
    .filter((rule) => ruleEligible(state, rule))
    .map((rule) => ({
      rule,
      score: rule.weights.reduce((sum, weight) => sum + weightScore(state, weight), 0)
    }))
    .sort((a, b) => b.score - a.score || b.rule.priority - a.rule.priority);

  const winner = ranked[0] ?? { rule: ENDING_RULES[0], score: 0 };
  return {
    trigger,
    titleId: winner.rule.id,
    titleLabel: winner.rule.label,
    score: Math.round(winner.score),
    summary: `你以「${winner.rule.label}」的身份结束了这一段乐队人生。`
  };
}
```

- [ ] **Step 5: Verify ending tests pass**

Run: `npm test -- src/game/rules/ending.test.ts --run`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/config/endingRules.ts src/game/rules/ending.ts src/game/rules/ending.test.ts
git commit -m "feat: add ending evaluation"
```

---

### Task 9: Local Storage

**Files:**
- Create: `src/game/storage/saveGame.ts`
- Test: `src/game/storage/saveGame.test.ts`

- [ ] **Step 1: Write failing storage tests**

Create `src/game/storage/saveGame.test.ts`:

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { createInitialState } from "../state/createInitialState";
import { clearSave, loadSave, saveGame, SAVE_VERSION } from "./saveGame";

describe("saveGame storage", () => {
  beforeEach(() => localStorage.clear());

  it("saves and loads versioned game state", () => {
    const state = createInitialState("writer");

    saveGame(state);
    const loaded = loadSave();

    expect(loaded?.version).toBe(SAVE_VERSION);
    expect(loaded?.state.route).toBe("writer");
  });

  it("rejects missing version saves", () => {
    localStorage.setItem("band-simulator-save", JSON.stringify({ state: createInitialState("writer") }));

    expect(loadSave()).toBeNull();
  });

  it("clears saves", () => {
    saveGame(createInitialState("writer"));
    clearSave();

    expect(loadSave()).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/game/storage/saveGame.test.ts --run`

Expected: FAIL because storage module does not exist.

- [ ] **Step 3: Implement save storage**

Create `src/game/storage/saveGame.ts`:

```ts
import type { GameState } from "../types";

export const SAVE_VERSION = 1;
export const SAVE_KEY = "band-simulator-save";

export interface SaveGame {
  version: typeof SAVE_VERSION;
  createdAt: string;
  updatedAt: string;
  state: GameState;
}

export function saveGame(state: GameState): void {
  const existing = loadSave();
  const now = new Date().toISOString();
  const payload: SaveGame = {
    version: SAVE_VERSION,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    state
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
}

export function loadSave(): SaveGame | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SaveGame>;
    if (parsed.version !== SAVE_VERSION || !parsed.state) return null;
    return parsed as SaveGame;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
```

- [ ] **Step 4: Verify storage tests pass**

Run: `npm test -- src/game/storage/saveGame.test.ts --run`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/storage
git commit -m "feat: add local save storage"
```

---

### Task 10: React Controller And Main UI

**Files:**
- Create: `src/game/ui/useGameController.ts`
- Create: `src/components/RouteSelect.tsx`
- Create: `src/components/GameLayout.tsx`
- Create: `src/components/ActionPanel.tsx`
- Create: `src/components/FeedbackModal.tsx`
- Create: `src/components/EndingView.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Write failing app interaction test**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach } from "vitest";
import App from "./App";

describe("App", () => {
  beforeEach(() => localStorage.clear());

  it("starts a writer game and shows feedback after an action", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /创作型/ }));
    expect(screen.getByText("2027-05")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /练琴/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("练到指尖发烫");
  });

  it("can open ending preview without showing title tendency in main UI", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /创作型/ }));
    expect(screen.queryByText("称号倾向")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "结局预览" }));
    expect(screen.getByText(/你以「/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx --run`

Expected: FAIL because the UI does not contain route buttons.

- [ ] **Step 3: Implement controller hook**

Create `src/game/ui/useGameController.ts`:

```tsx
import { useMemo, useState } from "react";
import type { ActionId } from "../content/actions";
import type { EndingTrigger } from "../config/endingRules";
import { createInitialState } from "../state/createInitialState";
import { advanceMonth } from "../state/month";
import { clearSave, loadSave, saveGame } from "../storage/saveGame";
import type { Feedback, GameState, RouteId } from "../types";
import { performAction } from "../rules/actions";
import { evaluateEnding, type EndingResult } from "../rules/ending";

export function useGameController() {
  const loaded = useMemo(() => loadSave(), []);
  const [state, setState] = useState<GameState | null>(loaded?.state ?? null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [ending, setEnding] = useState<EndingResult | null>(null);

  function start(route: RouteId) {
    const next = createInitialState(route);
    saveGame(next);
    setState(next);
    setEnding(null);
  }

  function act(actionId: ActionId) {
    if (!state) return;
    const result = performAction(state, actionId);
    saveGame(result.state);
    setState(result.state);
    setFeedback(result.feedback);
  }

  function nextMonth() {
    if (!state) return;
    const next = advanceMonth(state);
    saveGame(next);
    setState(next);
  }

  function showEnding(trigger: EndingTrigger) {
    if (!state) return;
    setEnding(evaluateEnding(state, trigger));
  }

  function reset() {
    clearSave();
    setState(null);
    setFeedback(null);
    setEnding(null);
  }

  return {
    state,
    feedback,
    ending,
    start,
    act,
    nextMonth,
    showEnding,
    closeFeedback: () => setFeedback(null),
    closeEnding: () => setEnding(null),
    reset
  };
}
```

- [ ] **Step 4: Implement components**

Create compact components that render the required data and buttons. Use these exact labels for tested buttons: `创作型`, `练琴`, `结局预览`.

`src/components/RouteSelect.tsx`:

```tsx
import type { RouteId } from "../game/types";

const routes: Array<{ id: RouteId; label: string; description: string }> = [
  { id: "technician", label: "技术宅", description: "技术高，舞台弱。" },
  { id: "writer", label: "创作型", description: "创作高，容易触发创作冲突。" },
  { id: "performer", label: "舞台型", description: "舞台高，名声增长快。" },
  { id: "rebel", label: "叛逆型", description: "冲突多，风险高。" }
];

export function RouteSelect({ onStart }: { onStart: (route: RouteId) => void }) {
  return (
    <section className="route-select">
      <h1>乐队模拟器</h1>
      <div className="route-grid">
        {routes.map((route) => (
          <button key={route.id} className="route-card" onClick={() => onStart(route.id)}>
            <strong>{route.label}</strong>
            <span>{route.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
```

`src/components/ActionPanel.tsx`:

```tsx
import { ACTIONS, type ActionId } from "../game/content/actions";

export function ActionPanel({ onAction }: { onAction: (action: ActionId) => void }) {
  const actions = Object.values(ACTIONS);
  return (
    <section className="action-grid">
      <div className="action-group personal">
        <h2>个人行动</h2>
        {actions.filter((action) => action.group === "personal").map((action) => (
          <button key={action.id} onClick={() => onAction(action.id)}>{action.label} -{action.staminaCost}</button>
        ))}
      </div>
      <div className="action-group band">
        <h2>乐队行动</h2>
        {actions.filter((action) => action.group === "band").map((action) => (
          <button key={action.id} onClick={() => onAction(action.id)}>{action.label} -{action.staminaCost}</button>
        ))}
      </div>
    </section>
  );
}
```

Create the remaining components as simple renderers:

```tsx
// src/components/FeedbackModal.tsx
import type { Feedback } from "../game/types";

export function FeedbackModal({ feedback, onClose }: { feedback: Feedback; onClose: () => void }) {
  return (
    <div role="dialog" className="feedback-modal">
      <h2>{feedback.title}</h2>
      <p>{feedback.body}</p>
      <button onClick={onClose}>继续</button>
    </div>
  );
}
```

```tsx
// src/components/EndingView.tsx
import type { EndingResult } from "../game/rules/ending";

export function EndingView({ ending, onClose }: { ending: EndingResult; onClose: () => void }) {
  return (
    <section className="ending-view">
      <h2>{ending.titleLabel}</h2>
      <p>{ending.summary}</p>
      <button onClick={onClose}>返回</button>
    </section>
  );
}
```

```tsx
// src/components/GameLayout.tsx
import type { ActionId } from "../game/content/actions";
import type { GameState } from "../game/types";
import { ActionPanel } from "./ActionPanel";

export function GameLayout({ state, onAction, onNextMonth, onEnding, onReset }: {
  state: GameState;
  onAction: (action: ActionId) => void;
  onNextMonth: () => void;
  onEnding: () => void;
  onReset: () => void;
}) {
  return (
    <section className="game-layout">
      <aside className="side-panel">
        <h1>夜行反馈</h1>
        <p>{state.month}</p>
        <p>体力 {state.player.stamina}</p>
        <p>技术 {state.player.technique} / 创作 {state.player.creativity} / 舞台 {state.player.stage}</p>
        <h2>装备</h2>
        <p>{state.equipment.guitar.name}</p>
        <p>{state.equipment.pedals.map((pedal) => pedal.name).join(" / ")}</p>
        <p>{state.equipment.amp.name}</p>
      </aside>
      <main className="main-panel">
        <h2>当前事件</h2>
        <p>毕业演出前的一个月，排练室里的每一次沉默都变得很响。</p>
        <ActionPanel onAction={onAction} />
        <div className="toolbar">
          <button onClick={onNextMonth}>进入下个月</button>
          <button onClick={onEnding}>结局预览</button>
          <button onClick={onReset}>重开</button>
        </div>
      </main>
      <aside className="side-panel">
        <h2>成员关系</h2>
        <p>主唱 {state.relationships.vocal}</p>
        <p>贝斯 {state.relationships.bass}</p>
        <p>鼓手 {state.relationships.drums}</p>
        <h2>履历</h2>
        {state.history.length === 0 ? <p>尚无履历</p> : state.history.map((entry) => <p key={entry.id}>{entry.title}</p>)}
      </aside>
    </section>
  );
}
```

- [ ] **Step 5: Wire App**

Modify `src/App.tsx`:

```tsx
import { EndingView } from "./components/EndingView";
import { FeedbackModal } from "./components/FeedbackModal";
import { GameLayout } from "./components/GameLayout";
import { RouteSelect } from "./components/RouteSelect";
import { useGameController } from "./game/ui/useGameController";

export default function App() {
  const controller = useGameController();

  if (!controller.state) {
    return <RouteSelect onStart={controller.start} />;
  }

  return (
    <main className="app-shell">
      <GameLayout
        state={controller.state}
        onAction={controller.act}
        onNextMonth={controller.nextMonth}
        onEnding={() => controller.showEnding("preview")}
        onReset={controller.reset}
      />
      {controller.feedback && <FeedbackModal feedback={controller.feedback} onClose={controller.closeFeedback} />}
      {controller.ending && <EndingView ending={controller.ending} onClose={controller.closeEnding} />}
    </main>
  );
}
```

- [ ] **Step 6: Add MVP CSS**

Replace `src/styles.css` with CSS that supports three columns, different action colors, and modal overlay:

```css
:root {
  color: #f4f1ea;
  background: #121212;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100dvh;
}

button {
  cursor: pointer;
  border: 1px solid #4a4036;
  background: #1f1f1f;
  color: #f4f1ea;
  padding: 10px 12px;
  border-radius: 6px;
}

.app-shell,
.route-select {
  min-height: 100dvh;
  padding: 24px;
  background: linear-gradient(180deg, #211713, #121212 38%);
}

.route-grid,
.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.route-card {
  text-align: left;
  min-height: 110px;
}

.route-card span {
  display: block;
  margin-top: 8px;
  color: #b9b1a7;
}

.game-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 260px;
  gap: 16px;
}

.side-panel,
.main-panel,
.action-group {
  border: 1px solid #3f332b;
  background: rgba(255, 255, 255, 0.045);
  padding: 16px;
  border-radius: 8px;
}

.action-group {
  display: grid;
  gap: 8px;
}

.action-group.personal {
  background: #23180f;
}

.action-group.personal button {
  border-color: #a16207;
  background: #3a2511;
  color: #fde68a;
}

.action-group.band {
  background: #251111;
}

.action-group.band button {
  border-color: #b91c1c;
  background: #3b1212;
  color: #fecaca;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.feedback-modal,
.ending-view {
  position: fixed;
  inset: auto 24px 24px 24px;
  max-width: 720px;
  margin: 0 auto;
  border: 1px solid #c6a15b;
  background: #171717;
  padding: 18px;
  border-radius: 8px;
  box-shadow: 0 24px 80px rgb(0 0 0 / 0.45);
}

@media (max-width: 900px) {
  .game-layout {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: Verify app tests pass**

Run: `npm test -- src/App.test.tsx --run`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src
git commit -m "feat: add playable game shell"
```

---

### Task 11: End-To-End Verification And Polish

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/GameLayout.tsx`
- Modify: `src/styles.css`
- Test: all existing tests

- [ ] **Step 1: Run full automated checks**

Run: `npm run typecheck`

Expected: exit 0.

Run: `npm test -- --run`

Expected: all tests pass.

Run: `npm run build`

Expected: exit 0 and Vite prints a built `dist/`.

- [ ] **Step 2: Start dev server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite prints a local URL, usually `http://127.0.0.1:5173/`.

- [ ] **Step 3: Browser verification**

Open the local URL in the in-app browser and verify:

- Route selection is the first screen.
- Choosing `创作型` enters the game.
- Main UI shows month `2027-05`.
- No text `称号倾向` appears in the main UI.
- Equipment panel shows guitar, pedals, and amp.
- Personal action buttons use a different color family from band action buttons.
- Clicking `练琴` opens a feedback dialog.
- Clicking `继续` closes the feedback dialog.
- Clicking `进入下个月` moves to `2027-06`.
- Clicking `结局预览` shows an ending view.

- [ ] **Step 4: Fix only verified UI issues**

If browser verification finds text overflow, broken layout, or missing labels, fix the smallest affected component or CSS rule, then rerun:

```bash
npm run typecheck
npm test -- --run
npm run build
```

Expected: all exit 0.

- [ ] **Step 5: Commit verification polish**

```bash
git add src
git commit -m "fix: polish mvp gameplay flow"
```

If Step 4 required no file changes, skip this commit and record the verification output in the final response.

---

## Self-Review Checklist

- The plan implements route selection, monthly loop, stamina, actions, feedback, equipment, member relationships, work pipeline, recording, ending preview, and local storage.
- The plan does not implement rhythm gameplay, cloud storage, full lifespan simulation, release/sales generation, routing, or 3D.
- Data-spec edge cases are mapped: `Work.quality`, `Work.rehearsal`, `EventTrigger.hasDemo`, `advanceWork.authorship`, monthly action counts, and ending weights.
- Every game logic task starts with a failing test.
- The UI task has interaction tests before component implementation.
- The final task requires typecheck, tests, build, and browser verification.
