import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";
import { EVENTS } from "../data";
import type { EventContent } from "../data/types";
import { useGameStore } from "../store";
import { HomeScreen } from "./HomeScreen";
import { MonthEventDialog } from "./MonthEventDialog";
import {
  countMonthOpportunities,
  MonthOpportunityDialog,
} from "./MonthOpportunityDialog";
import { RulesDialog } from "./RulesDialog";
import { selectBandAttributes } from "../domain";
import "./app.css";

type AppView = "home" | "opening" | "workstation";

const OpeningFlow = lazy(() =>
  import("../features/opening/OpeningFlow").then((module) => ({
    default: module.OpeningFlow,
  })),
);
const Workstation = lazy(() => import("../features/workstation/Workstation"));

function LoadingView({ label }: { label: string }) {
  return (
    <main className="app-loading" aria-live="polite">
      <span />
      <strong>{label}</strong>
      <p>正在整理排练清单和本月消息。</p>
    </main>
  );
}

export function App() {
  const game = useGameStore((state) => state.game);
  const hydrated = useGameStore((state) => state.hydrated);
  const loadSavedGame = useGameStore((state) => state.loadSavedGame);
  const startNewGame = useGameStore((state) => state.startNewGame);
  const prepareEvent = useGameStore((state) => state.prepareEvent);
  const acknowledgeOpportunities = useGameStore(
    (state) => state.acknowledgeOpportunities,
  );
  const lastError = useGameStore((state) => state.lastError);
  const clearSavedGame = useGameStore((state) => state.clearSavedGame);
  const clearCurrentGame = useGameStore((state) => state.clearCurrentGame);
  const exportSave = useGameStore((state) => state.exportSave);
  const importSave = useGameStore((state) => state.importSave);
  const [view, setView] = useState<AppView>("home");
  const [rulesOpen, setRulesOpen] = useState(false);
  const [eventPresentationOpen, setEventPresentationOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      loadSavedGame();
    }
  }, [hydrated, loadSavedGame]);

  useEffect(() => {
    if (view !== "workstation" || !game || game.month.eventPrepared) {
      return;
    }

    const currentMonth = game.calendar.completedMonths + 1;
    const attributes = selectBandAttributes(game);
    const memberIds = new Set(game.members.map((member) => member.id));
    const storyTags = new Set(
      game.members.flatMap((member) => member.hiddenTags),
    );
    const scheduledIds = new Set(
      game.scheduledEvents
        .filter((event) => event.dueMonth <= currentMonth)
        .map((event) => event.eventId),
    );
    const eventCatalog: readonly EventContent[] = EVENTS;
    const eligibleEventIds = eventCatalog.filter((event) => {
      if (scheduledIds.has(event.id)) {
        return true;
      }
      if (event.minMonth && currentMonth < event.minMonth) {
        return false;
      }
      if (event.maxMonth && currentMonth > event.maxMonth) {
        return false;
      }
      if (event.genres && !event.genres.includes(game.band.genre)) {
        return false;
      }
      if (
        event.minPopularity !== undefined &&
        attributes.popularity < event.minPopularity
      ) {
        return false;
      }
      if (
        event.maxPopularity !== undefined &&
        attributes.popularity > event.maxPopularity
      ) {
        return false;
      }
      if (
        event.minReleasedAlbums !== undefined &&
        game.releasedAlbums.length < event.minReleasedAlbums
      ) {
        return false;
      }
      if (
        event.minVenueLevel !== undefined &&
        game.band.unlockedVenueLevel < event.minVenueLevel
      ) {
        return false;
      }
      if (
        event.requiresMemberIds &&
        !event.requiresMemberIds.some((memberId) => memberIds.has(memberId))
      ) {
        return false;
      }
      if (
        event.requiresTags &&
        !event.requiresTags.every((tag) => storyTags.has(tag))
      ) {
        return false;
      }
      if (
        event.excludesTags &&
        event.excludesTags.some((tag) => storyTags.has(tag))
      ) {
        return false;
      }
      if (event.requiresActiveAlbum && !game.activeAlbum) {
        return false;
      }
      return true;
    }).map((event) => event.id);

    prepareEvent(eligibleEventIds);
  }, [
    game,
    game?.activeAlbum,
    game?.band.genre,
    game?.calendar.completedMonths,
    game?.month.eventPrepared,
    prepareEvent,
    view,
  ]);

  useLayoutEffect(() => {
    if (view === "workstation" && game?.pendingEvent) {
      setEventPresentationOpen(true);
    }
  }, [game?.pendingEvent, view]);

  if (view === "opening") {
    return (
      <Suspense fallback={<LoadingView label="正在准备组队资料" />}>
        <OpeningFlow
          onCancel={() => setView("home")}
          onComplete={(input) => {
            startNewGame(input);
            setView("workstation");
          }}
        />
        <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
      </Suspense>
    );
  }

  if (view === "workstation" && game) {
    return (
      <Suspense fallback={<LoadingView label="正在打开后台工作站" />}>
        <Workstation
          onOpenRules={() => setRulesOpen(true)}
          onReturnHome={() => setView("home")}
        />
        <MonthEventDialog
          game={game}
          onPresentationComplete={() => setEventPresentationOpen(false)}
        />
        <MonthOpportunityDialog
          game={game}
          open={
            game.month.opportunitiesPrepared &&
            !game.month.opportunitiesAcknowledged &&
            countMonthOpportunities(game) > 0 &&
            game.pendingEvent === null &&
            !eventPresentationOpen
          }
          required
          onClose={() => {
            acknowledgeOpportunities();
          }}
        />
        <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
      </Suspense>
    );
  }

  return (
    <>
      <HomeScreen
        hasSave={Boolean(game)}
        isReady={hydrated}
        onContinue={() => {
          if (game) {
            setView("workstation");
          }
        }}
        onNewGame={() => {
          setView("opening");
        }}
        onOpenRules={() => setRulesOpen(true)}
        loadError={lastError}
        onExportSave={exportSave}
        onImportSave={(text) => {
          const result = importSave(text);
          if (result.ok) setView("workstation");
          return result;
        }}
        onClearSave={() => {
          const result = clearSavedGame();
          if (result.ok) clearCurrentGame();
          return result;
        }}
      />
      <RulesDialog open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </>
  );
}
