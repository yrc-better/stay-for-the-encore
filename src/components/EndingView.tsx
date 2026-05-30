import type { EndingResult } from "../game/rules/ending";

export function EndingView({ ending, onClose }: { ending: EndingResult; onClose: () => void }) {
  return (
    <section className="ending-view" aria-label="结局预览">
      <h2>{ending.titleLabel}</h2>
      <p>{ending.summary}</p>
      <button onClick={onClose}>返回</button>
    </section>
  );
}
