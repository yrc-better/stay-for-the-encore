import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OpeningFlow } from "./OpeningFlow";

describe("OpeningFlow", () => {
  it("validates the protagonist name before moving forward", async () => {
    const user = userEvent.setup();
    render(<OpeningFlow onComplete={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "下一步" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "请先写下主角的名字",
    );
    expect(
      screen.getByRole("heading", { name: "从毕业那天开始" }),
    ).toBeInTheDocument();
  });

  it("returns a complete domain NewGameInput after confirmation", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OpeningFlow onComplete={onComplete} />);

    await user.type(screen.getByLabelText("你的名字"), "林遥");
    await user.click(screen.getByRole("button", { name: "下一步" }));

    await user.click(screen.getByRole("button", { name: /流行/ }));
    await user.click(screen.getByRole("button", { name: "下一步" }));

    for (const candidateName of ["顾言川", "许知遥", "魏行之", "陈星遥"]) {
      await user.click(
        screen.getByRole("button", { name: new RegExp(candidateName) }),
      );
      await user.click(screen.getByRole("button", { name: "下一步" }));
    }

    await user.type(screen.getByLabelText("乐队名称"), "霓虹来信");
    await user.click(screen.getByRole("button", { name: "下一步" }));
    await user.click(screen.getByRole("button", { name: "确认成立" }));

    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        bandName: "霓虹来信",
        genre: "pop",
        protagonist: {
          name: "林遥",
          avatarId: "player-neon",
        },
        selectedMembers: [
          expect.objectContaining({
            id: "gu-yanchuan",
            stats: expect.objectContaining({
              creativity: 58,
              popularity: 31,
            }),
            traits: ["完美主义", "可靠"],
          }),
          expect.objectContaining({ id: "xu-zhiyao" }),
          expect.objectContaining({ id: "wei-xingzhi" }),
          expect.objectContaining({ id: "chen-xingyao" }),
        ],
      }),
    );
  });

  it("supports going back from a restored opening state", async () => {
    const user = userEvent.setup();
    render(
      <OpeningFlow
        onComplete={vi.fn()}
        initialState={{
          step: "genre",
          protagonistName: "林遥",
          protagonistAvatarId: "player-midnight",
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "返回" }));

    expect(
      screen.getByRole("heading", { name: "从毕业那天开始" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("你的名字")).toHaveValue("林遥");
  });
});
