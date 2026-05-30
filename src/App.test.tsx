import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { createInitialState } from "./game/state/createInitialState";
import { SAVE_KEY, SAVE_VERSION } from "./game/storage/saveGame";

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
    expect(
      screen.getByText(/你以「|这一段乐队人生还没有沉淀出明确的称号。/)
    ).toBeInTheDocument();
  });

  it("falls back to route selection when saved equipment cannot render", () => {
    const state = createInitialState("writer");
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: SAVE_VERSION,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2027-05-01T00:00:00.000Z",
        state: { ...state, equipment: {} }
      })
    );

    render(<App />);

    expect(screen.getByRole("button", { name: /创作型/ })).toBeInTheDocument();
  });
});
