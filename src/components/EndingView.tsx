import type { EndingResult } from "../game/rules/ending";

const TRIGGER_LABELS: Record<EndingResult["trigger"], string> = {
  retirement: "退役",
  farewell: "告别演出",
  healthCollapse: "健康崩溃",
  bandBreakup: "乐队解散",
  lifespan: "生涯终点",
  preview: "预览"
};

export function EndingView({ ending, onClose }: { ending: EndingResult; onClose: () => void }) {
  return (
    <section className="ending-view" aria-label="结局评价">
      <h2>{ending.titleLabel}</h2>
      <p>触发：{TRIGGER_LABELS[ending.trigger]}</p>
      <p>{ending.summary}</p>
      <h3>谢幕</h3>
      <p className="ending-epilogue">{ending.epilogue}</p>
      <h3>关键依据</h3>
      <ul>
        {ending.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <button onClick={onClose}>返回</button>
    </section>
  );
}
