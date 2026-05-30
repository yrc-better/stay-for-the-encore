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
        activeEvent={controller.activeEvent}
        onAction={controller.act}
        onEventChoice={controller.chooseEvent}
        onNextMonth={controller.nextMonth}
        onEnding={() => controller.showEnding("preview")}
        onReset={controller.reset}
      />
      {controller.feedback && <FeedbackModal feedback={controller.feedback} onClose={controller.closeFeedback} />}
      {controller.ending && <EndingView ending={controller.ending} onClose={controller.closeEnding} />}
    </main>
  );
}
