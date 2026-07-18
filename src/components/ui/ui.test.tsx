import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttributeMeter } from "./AttributeMeter";
import { ArtworkImage } from "./ArtworkImage";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Tabs } from "./Tabs";

describe("UI foundation", () => {
  it("lazy-loads responsive artwork and falls back after a request error", () => {
    const { container } = render(
      <ArtworkImage
        artwork={{
          src: "/art.webp",
          srcSet: "/art-512.webp 512w, /art.webp 1536w",
          sizes: "90vw",
          alt: "排练室插图",
          width: 1536,
          height: 864,
          focalPoint: "60% 40%",
        }}
      />,
    );

    const wrapper = screen.getByRole("img", { name: "排练室插图" });
    const image = container.querySelector("img");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveAttribute("decoding", "async");
    expect(image).toHaveAttribute(
      "srcset",
      "/art-512.webp 512w, /art.webp 1536w",
    );
    expect(image).toHaveStyle({ objectPosition: "60% 40%" });

    fireEvent.error(image!);
    expect(wrapper).toHaveTextContent("插图暂不可用");
  });

  it("exposes loading state on buttons", () => {
    render(<Button loading loadingLabel="保存中">保存</Button>);

    const button = screen.getByRole("button", { name: "保存中" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("clamps attribute values for assistive technology", () => {
    render(<AttributeMeter label="演奏力" value={128} />);

    expect(screen.getByRole("progressbar", { name: "演奏力" })).toHaveAttribute(
      "aria-valuenow",
      "100"
    );
  });

  it("supports arrow-key tab navigation", async () => {
    const user = userEvent.setup();
    render(
      <Tabs
        ariaLabel="工作区"
        items={[
          { id: "overview", label: "总览", content: "总览内容" },
          { id: "members", label: "成员", content: "成员内容" }
        ]}
      />
    );

    const overviewTab = screen.getByRole("tab", { name: "总览" });
    overviewTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("tab", { name: "成员" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("成员内容");
  });

  it("closes dialogs with Escape and restores the trigger focus", async () => {
    const user = userEvent.setup();

    function DialogFixture() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            打开规则
          </button>
          <Dialog open={open} onClose={() => setOpen(false)} title="游戏规则">
            规则内容
          </Dialog>
        </>
      );
    }

    render(<DialogFixture />);
    const trigger = screen.getByRole("button", { name: "打开规则" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "游戏规则" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
