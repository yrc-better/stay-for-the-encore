import type { ActionId } from "../game/content/actions";
import type { GameState } from "../game/types";
import { ActionPanel } from "./ActionPanel";

export function GameLayout({
  state,
  onAction,
  onNextMonth,
  onEnding,
  onReset
}: {
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
        <p className="month-label">{state.month}</p>
        <p>体力 {state.player.stamina}</p>
        <p>
          技术 {state.player.technique} / 创作 {state.player.creativity} / 舞台 {state.player.stage}
        </p>
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
        {state.history.length === 0 ? (
          <p>尚无履历</p>
        ) : (
          state.history.map((entry) => <p key={entry.id}>{entry.title}</p>)
        )}
      </aside>
    </section>
  );
}
