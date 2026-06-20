import type { ActionId } from "../game/content/actions";
import { MEMBER_IDS, MEMBER_PROFILES, MEMBER_STATUS_LABELS } from "../game/config/members";
import type { EndingTrigger } from "../game/config/endingRules";
import type { GameEvent, GameState } from "../game/types";
import { ActionPanel } from "./ActionPanel";

const PHASE_LABELS: Record<GameState["phase"], string> = {
  campus: "校园阶段",
  career: "正式生涯"
};

const CAREER_STAGE_LABELS: Record<GameState["careerStage"], string> = {
  campus: "毕业筹备",
  early: "起步期",
  rising: "上升期",
  mature: "成熟期",
  late: "后期生涯"
};

const GRADUATION_OUTCOME_LABELS = {
  breakthrough: "毕业结果：礼堂被点燃",
  steady: "毕业结果：留下回声",
  rough: "毕业结果：勉强收场"
} as const;

const RELEASE_TYPE_LABELS: Record<GameState["releases"][number]["type"], string> = {
  demo: "Demo",
  single: "单曲",
  ep: "EP",
  album: "专辑"
};

function getGraduationOutcomeLabel(state: GameState): string | null {
  const outcome = state.flags["campus.graduationOutcome"];
  if (typeof outcome !== "string") return null;
  return GRADUATION_OUTCOME_LABELS[outcome as keyof typeof GRADUATION_OUTCOME_LABELS] ?? null;
}

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
  onEnding: (trigger: EndingTrigger) => void;
  onReset: () => void;
}) {
  const graduationOutcomeLabel = getGraduationOutcomeLabel(state);

  return (
    <section className="game-layout" aria-label="游戏主界面">
      <section className="summary-panel layout-card" aria-label="状态摘要">
        <p className="section-kicker">乐队档案</p>
        <div className="summary-title">
          <h1>{state.bandName}</h1>
          <p className="month-label">{state.month}</p>
        </div>
        <div className="career-context" aria-label="生涯状态">
          <span>{PHASE_LABELS[state.phase]}</span>
          <span>{CAREER_STAGE_LABELS[state.careerStage]}</span>
          {graduationOutcomeLabel && <span>{graduationOutcomeLabel}</span>}
        </div>
        <div className="stat-strip">
          <span>体力 {state.player.stamina}</span>
          <span>技术 {state.player.technique}</span>
          <span>创作 {state.player.creativity}</span>
          <span>舞台 {state.player.stage}</span>
        </div>
      </section>

      <section className="event-section layout-card" aria-label="当前事件">
        <div className="section-heading">
          <p className="section-kicker">主舞台</p>
          <h2>当前事件</h2>
        </div>
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
        <div className="action-board-title">
          <p className="section-kicker">排练计划</p>
          <h2>本月行动</h2>
        </div>
        <ActionPanel onAction={onAction} />
        <div className="toolbar">
          <button onClick={onNextMonth}>进入下个月</button>
          {state.phase === "career" && (
            <>
              <button onClick={() => onEnding("retirement")}>退役</button>
              <button onClick={() => onEnding("farewell")}>告别演出</button>
            </>
          )}
          <button onClick={onReset}>重开</button>
        </div>
      </section>

      <section className="equipment-panel layout-card" aria-label="装备">
        <p className="section-kicker">器材角</p>
        <h2>装备</h2>
        <p>{state.equipment.guitar.name}</p>
        <p>{state.equipment.pedals.map((pedal) => pedal.name).join(" / ")}</p>
        <p>{state.equipment.amp.name}</p>
      </section>

      <section className="relationships-panel members-panel layout-card" aria-label="队友状态">
        <p className="section-kicker">后台成员</p>
        <h2>队友状态</h2>
        <div className="member-list">
          {MEMBER_IDS.map((memberId) => {
            const profile = MEMBER_PROFILES[memberId];
            const memberState = state.memberStates[memberId];

            return (
              <article className="member-card" key={memberId}>
                <header className="member-card-header">
                  <div>
                    <strong>{profile.name}</strong>
                    <span>{profile.role}</span>
                  </div>
                  <span className={`member-status member-status-${memberState.status}`}>
                    {MEMBER_STATUS_LABELS[memberState.status]}
                  </span>
                </header>
                <p className="member-intro">{profile.intro}</p>
                <p className="member-meta">
                  关系 {state.relationships[memberId]} · 更新 {memberState.updatedAt}
                </p>
                <p className="member-note">{memberState.note}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="history-panel layout-card" aria-label="履历">
        <p className="section-kicker">后台记录</p>
        <h2>履历</h2>
        {state.history.length === 0 ? (
          <p>尚无履历</p>
        ) : (
          state.history.map((entry) => <p key={entry.id}>{entry.title}</p>)
        )}
      </section>

      <section className="release-panel layout-card" aria-label="发行作品">
        <p className="section-kicker">发行台账</p>
        <h2>发行作品</h2>
        {state.releases.length === 0 ? (
          <p>尚无发行</p>
        ) : (
          state.releases.map((release) => (
            <p key={release.id}>
              《{release.title}》 {RELEASE_TYPE_LABELS[release.type]} · 销量 {release.sales} · 媒体评分{" "}
              {release.criticalScore}
            </p>
          ))
        )}
      </section>

      <section className="annual-panel layout-card" aria-label="年度摘要">
        <p className="section-kicker">年度回声</p>
        <h2>年度摘要</h2>
        {state.annualSummaries.length === 0 ? (
          <p>尚无年度摘要</p>
        ) : (
          state.annualSummaries.map((summary) => (
            <article className="annual-summary" key={summary.year}>
              <h3>{summary.year} 年</h3>
              <p>
                发行 {summary.releases} · 演出 {summary.performances} · 销量 {summary.totalReleaseSales}
              </p>
              <p>
                媒体峰值 {summary.bestReleaseCriticalScore} · 关系 {summary.averageRelationship} · 健康债{" "}
                {summary.healthDebt}
              </p>
              <p>{summary.note}</p>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
