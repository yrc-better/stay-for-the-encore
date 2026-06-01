import type { ActionId } from "../game/content/actions";
import type { GameEvent, GameState } from "../game/types";
import { ActionPanel } from "./ActionPanel";

export function GameLayout({
  state,
  activeEvent,
  onAction,
  onEventChoice,
  onNextMonth,
  onEnding,
  onReset
}: {
  state: GameState;
  activeEvent: GameEvent | null;
  onAction: (action: ActionId) => void;
  onEventChoice: (choiceId: string) => void;
  onNextMonth: () => void;
  onEnding: () => void;
  onReset: () => void;
}) {
  return (
    <section className="game-layout" aria-label="游戏主界面">
      <section className="summary-panel layout-card" aria-label="状态摘要">
        <h1>{state.bandName}</h1>
        <p className="month-label">{state.month}</p>
        <div className="stat-strip">
          <span>体力 {state.player.stamina}</span>
          <span>技术 {state.player.technique}</span>
          <span>创作 {state.player.creativity}</span>
          <span>舞台 {state.player.stage}</span>
        </div>
      </section>

      <section className="event-section layout-card" aria-label="当前事件">
        <h2>当前事件</h2>
        {activeEvent ? (
          <section className="event-panel">
            <h3>{activeEvent.title}</h3>
            <p>{activeEvent.body}</p>
            <div className="event-choices">
              {activeEvent.choices.map((choice) => (
                <button key={choice.id} onClick={() => onEventChoice(choice.id)}>
                  {choice.label}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <p>这个月暂时没有新的事件。</p>
        )}
      </section>

      <section className="actions-section" aria-label="行动选择">
        <ActionPanel onAction={onAction} />
        <div className="toolbar">
          <button onClick={onNextMonth}>进入下个月</button>
          <button onClick={onEnding}>结局预览</button>
          <button onClick={onReset}>重开</button>
        </div>
      </section>

      <section className="equipment-panel layout-card" aria-label="装备">
        <h2>装备</h2>
        <p>{state.equipment.guitar.name}</p>
        <p>{state.equipment.pedals.map((pedal) => pedal.name).join(" / ")}</p>
        <p>{state.equipment.amp.name}</p>
      </section>

      <section className="relationships-panel layout-card" aria-label="成员关系">
        <h2>成员关系</h2>
        <p>主唱 {state.relationships.vocal}</p>
        <p>贝斯 {state.relationships.bass}</p>
        <p>鼓手 {state.relationships.drums}</p>
      </section>

      <section className="history-panel layout-card" aria-label="履历">
        <h2>履历</h2>
        {state.history.length === 0 ? (
          <p>尚无履历</p>
        ) : (
          state.history.map((entry) => <p key={entry.id}>{entry.title}</p>)
        )}
      </section>
    </section>
  );
}
