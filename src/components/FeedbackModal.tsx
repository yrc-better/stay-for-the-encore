import type { Feedback } from "../game/types";

export function FeedbackModal({ feedback, onClose }: { feedback: Feedback; onClose: () => void }) {
  return (
    <div className="modal-backdrop">
      <div role="dialog" aria-modal="true" className="feedback-modal">
        <h2>{feedback.title}</h2>
        <p>{feedback.body}</p>
        <button onClick={onClose}>继续</button>
      </div>
    </div>
  );
}
