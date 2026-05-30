import { ACTIONS, type ActionId } from "../game/content/actions";

export function ActionPanel({ onAction }: { onAction: (action: ActionId) => void }) {
  const actions = Object.values(ACTIONS);

  return (
    <section className="action-grid" aria-label="行动">
      <div className="action-group personal">
        <h2>个人行动</h2>
        {actions
          .filter((action) => action.group === "personal")
          .map((action) => (
            <button key={action.id} onClick={() => onAction(action.id)}>
              {action.label} -{action.staminaCost}
            </button>
          ))}
      </div>
      <div className="action-group band">
        <h2>乐队行动</h2>
        {actions
          .filter((action) => action.group === "band")
          .map((action) => (
            <button key={action.id} onClick={() => onAction(action.id)}>
              {action.label} -{action.staminaCost}
            </button>
          ))}
      </div>
    </section>
  );
}
