import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { createInitialState } from "./game/state/createInitialState";
import { SAVE_KEY, SAVE_VERSION } from "./game/storage/saveGame";
import type { AnnualSummary } from "./game/types";

function annualSummary(year: number, overrides: Partial<AnnualSummary> = {}): AnnualSummary {
  return {
    year,
    month: `${year + 1}-01`,
    releases: 1,
    totalReleaseSales: 2200,
    bestReleaseCriticalScore: 72,
    performances: 4,
    averageRelationship: 56,
    healthDebt: 8,
    fame: 42,
    note: `${year} 年留下了可以回看的痕迹。`,
    ...overrides
  };
}

async function startWriterGame(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /创作型/ }));
  await user.click(screen.getByRole("button", { name: "继续" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("毕业演出前的排练争执");
  expect(screen.getByRole("dialog")).not.toHaveTextContent("剧情点");
  await user.click(screen.getByRole("button", { name: "继续" }));
}

describe("App", () => {
  beforeEach(() => localStorage.clear());

  it("starts a writer game and shows feedback after an action", async () => {
    const user = userEvent.setup();
    render(<App />);

    await startWriterGame(user);
    expect(screen.getByText("2027-05")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /练琴/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("练到指尖发烫");
  });

  it("keeps long-term ability progress hidden on the page after practice", async () => {
    const user = userEvent.setup();
    render(<App />);

    await startWriterGame(user);
    await user.click(screen.getByRole("button", { name: /练琴/ }));

    expect(screen.getByText("技术 42")).toBeInTheDocument();
    expect(screen.queryByText(/进度/)).not.toBeInTheDocument();
  });

  it("starts a game with a custom band name", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText("乐队名"));
    await user.type(screen.getByLabelText("乐队名"), "海边回声");
    await user.click(screen.getByRole("button", { name: /创作型/ }));

    expect(screen.getByRole("heading", { name: "海边回声" })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)!)?.state.bandName).toBe("海边回声");
  });

  it("shows a story popup after band naming and route selection", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText("乐队名"));
    await user.type(screen.getByLabelText("乐队名"), "海边回声");
    await user.click(screen.getByRole("button", { name: /创作型/ }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("校园序章");
    expect(dialog).toHaveTextContent("海边回声");
    expect(dialog).toHaveTextContent("吉他手");
    expect(dialog).toHaveTextContent("创作型");
    expect(dialog).toHaveTextContent("主唱林夏");
    expect(dialog).toHaveTextContent("贝斯手周航");
    expect(dialog).toHaveTextContent("鼓手唐野");
    expect(screen.getByText("毕业演出前的排练争执")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "继续" }));
    const storyDialog = screen.getByRole("dialog");
    expect(storyDialog).toHaveTextContent("毕业演出前的排练争执");
    expect(storyDialog).not.toHaveTextContent("剧情点");
    expect(storyDialog).toHaveTextContent("主唱认为新歌副歌应该更直接");
    await user.click(within(storyDialog).getByRole("button", { name: "继续" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows and resolves the prologue event through its choices", async () => {
    const user = userEvent.setup();
    render(<App />);

    await startWriterGame(user);
    expect(screen.getByText("毕业演出前的排练争执")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "妥协并保留间奏" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("暂时达成一致");

    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(screen.queryByText("毕业演出前的排练争执")).not.toBeInTheDocument();
    const currentEvent = screen.getByRole("region", { name: "当前事件" });
    expect(within(currentEvent).getByRole("heading", { name: "毕业演出" })).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveTextContent("毕业演出");
    expect(screen.getByRole("dialog")).toHaveTextContent("礼堂");
    expect(screen.getByRole("dialog")).toHaveTextContent("谢幕");
    expect(screen.getByRole("dialog")).not.toHaveTextContent("剧情点");

    await user.click(screen.getByRole("button", { name: "继续" }));

    await user.click(screen.getByRole("button", { name: "进入下个月" }));
    expect(screen.queryByText("毕业演出前的一个月，排练室里的每一次沉默都变得很响。")).not.toBeInTheDocument();
  });

  it("plays from start through graduation and shows the career transition", async () => {
    const user = userEvent.setup();
    render(<App />);

    await startWriterGame(user);
    expect(screen.getByText("校园阶段")).toBeInTheDocument();
    expect(screen.getByText("毕业筹备")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "妥协并保留间奏" }));
    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("毕业演出");
    expect(screen.getByRole("dialog")).not.toHaveTextContent("剧情点");
    await user.click(screen.getByRole("button", { name: "继续" }));
    await user.click(screen.getByRole("button", { name: "登上毕业演出舞台" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("毕业演出结束");
    expect(screen.getByRole("dialog")).toHaveTextContent("谢幕");

    await user.click(screen.getByRole("button", { name: "继续" }));
    expect(screen.getByText("正式生涯")).toBeInTheDocument();
    expect(screen.getByText("起步期")).toBeInTheDocument();
    expect(screen.getByText("毕业结果：勉强收场")).toBeInTheDocument();

    const currentEvent = screen.getByRole("region", { name: "当前事件" });
    expect(within(currentEvent).queryByText("毕业演出")).not.toBeInTheDocument();
    expect(screen.getByText("毕业演出：勉强收场")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "进入下个月" }));
    expect(screen.getByText("2027-06")).toBeInTheDocument();
    expect(screen.getByText("正式生涯")).toBeInTheDocument();

    const saved = JSON.parse(localStorage.getItem(SAVE_KEY)!)?.state;
    expect(saved.phase).toBe("career");
    expect(saved.careerStage).toBe("early");
    expect(saved.flags["campus.graduationOutcome"]).toBe("rough");
    expect(saved.eventLog).toContainEqual({
      id: "campus.anchor.graduation_show",
      month: "2027-05",
      category: "anchor"
    });
  });

  it("removes a queued event after resolving it", async () => {
    const user = userEvent.setup();
    const state = createInitialState("writer");
    state.queuedEvents = ["prologue.rehearsal_argument"];
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: SAVE_VERSION,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2027-05-01T00:00:00.000Z",
        state
      })
    );

    render(<App />);
    expect(screen.getByRole("dialog")).toHaveTextContent("毕业演出前的排练争执");
    expect(screen.getByRole("dialog")).not.toHaveTextContent("剧情点");
    await user.click(screen.getByRole("button", { name: "继续" }));
    await user.click(screen.getByRole("button", { name: "妥协并保留间奏" }));

    const saved = JSON.parse(localStorage.getItem(SAVE_KEY)!)?.state;
    expect(saved.queuedEvents).not.toContain("prologue.rehearsal_argument");
    expect(saved.queuedEvents[0]).toBe("campus.anchor.graduation_show");
    expect(saved.eventLog).toContainEqual({
      id: "prologue.rehearsal_argument",
      month: "2027-05",
      category: "anchor"
    });
  });

  it("does not surface extra events after the monthly queue is exhausted", () => {
    const state = createInitialState("writer");
    state.month = "2027-07";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.flags["career.firstLivehouseDone"] = true;
    state.queuedEvents = [];
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: SAVE_VERSION,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2027-07-01T00:00:00.000Z",
        state
      })
    );

    render(<App />);

    expect(screen.getByRole("region", { name: "当前事件" })).toHaveTextContent("这个月暂时没有新的事件。");
  });

  it("does not expose ending preview in the main UI", async () => {
    const user = userEvent.setup();
    render(<App />);

    await startWriterGame(user);
    expect(screen.queryByText("称号倾向")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "结局预览" })).not.toBeInTheDocument();
  });

  it("plays a retirement story event before the formal retirement ending", async () => {
    const user = userEvent.setup();
    const state = createInitialState("technician");
    state.month = "2028-04";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.player.technique = 88;
    state.recordings.push({
      id: "recording.1",
      createdAt: "2027-08",
      workId: "work.1",
      type: "demo",
      quality: 70,
      rawness: 30,
      released: false
    });
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: SAVE_VERSION,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2028-04-01T00:00:00.000Z",
        state
      })
    );

    render(<App />);
    expect(screen.queryByRole("button", { name: "结局预览" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "退役" }));

    expect(screen.queryByRole("region", { name: "结局评价" })).not.toBeInTheDocument();
    const storyDialog = screen.getByRole("dialog");
    expect(storyDialog).toHaveTextContent("退役前夜");
    expect(storyDialog).toHaveTextContent("琴盒");
    expect(storyDialog).not.toHaveTextContent("剧情点");

    await user.click(within(storyDialog).getByRole("button", { name: "继续" }));
    const currentEvent = screen.getByRole("region", { name: "当前事件" });
    expect(currentEvent).toHaveTextContent("退役前夜");

    await user.click(screen.getByRole("button", { name: "把琴放回琴盒" }));
    const feedback = screen.getByRole("dialog");
    expect(feedback).toHaveTextContent("琴盒扣上");
    expect(screen.queryByRole("region", { name: "结局评价" })).not.toBeInTheDocument();

    await user.click(within(feedback).getByRole("button", { name: "继续" }));
    const ending = screen.getByRole("region", { name: "结局评价" });
    expect(ending).toHaveTextContent("技术宗师");
    expect(ending).toHaveTextContent("触发：退役");
    expect(ending).toHaveTextContent("关键依据");
    expect(ending).toHaveTextContent("最高录音质量 70");
  });

  it("shows long-term annual and history evidence in the formal ending", async () => {
    const user = userEvent.setup();
    const state = createInitialState("performer");
    state.month = "2039-04";
    state.phase = "career";
    state.careerStage = "late";
    state.flags["campus.graduationShowDone"] = true;
    state.player.stage = 78;
    state.player.fame = 68;
    state.band.reputation = 72;
    state.annualSummaries = Array.from({ length: 6 }, (_, index) =>
      annualSummary(2032 + index, {
        totalReleaseSales: 2400 + index * 300,
        performances: 4 + (index % 2),
        fame: 45 + index * 4
      })
    );
    state.history.push(
      {
        id: "history.1",
        month: "2034-05",
        type: "performance",
        title: "第一次专辑巡演",
        description: "你们把专辑带上路。",
        weight: 5,
        tags: ["career", "tour", "performance", "album"]
      },
      {
        id: "history.2",
        month: "2038-09",
        type: "performance",
        title: "周年专场",
        description: "很多年被重新数了一遍。",
        weight: 6,
        tags: ["career", "late", "legacy", "performance"]
      }
    );
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: SAVE_VERSION,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2039-04-01T00:00:00.000Z",
        state
      })
    );

    render(<App />);
    await user.click(screen.getByRole("button", { name: "退役" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "继续" }));
    await user.click(screen.getByRole("button", { name: "把琴放回琴盒" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "继续" }));

    const ending = screen.getByRole("region", { name: "结局评价" });
    expect(ending).toHaveTextContent("长路见证者");
    expect(ending).toHaveTextContent("谢幕");
    expect(ending).toHaveTextContent("最后一盏灯");
    expect(ending).toHaveTextContent("散场");
    expect(ending).toHaveTextContent("完整年度 6 年");
    expect(ending).toHaveTextContent("年度演出总计 27 场");
    expect(ending).toHaveTextContent("代表履历 第一次专辑巡演 / 周年专场");
  });

  it("plays a farewell show story event before the formal farewell ending", async () => {
    const user = userEvent.setup();
    const state = createInitialState("performer");
    state.month = "2039-04";
    state.phase = "career";
    state.careerStage = "late";
    state.flags["campus.graduationShowDone"] = true;
    state.player.stage = 78;
    state.player.fame = 68;
    state.band.reputation = 72;
    state.annualSummaries = Array.from({ length: 6 }, (_, index) =>
      annualSummary(2032 + index, {
        totalReleaseSales: 2400 + index * 300,
        performances: 4 + (index % 2),
        fame: 45 + index * 4
      })
    );
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: SAVE_VERSION,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2039-04-01T00:00:00.000Z",
        state
      })
    );

    render(<App />);
    await user.click(screen.getByRole("button", { name: "告别演出" }));

    expect(screen.queryByRole("region", { name: "结局评价" })).not.toBeInTheDocument();
    const storyDialog = screen.getByRole("dialog");
    expect(storyDialog).toHaveTextContent("告别演出");
    expect(storyDialog).toHaveTextContent("最后一场");
    expect(storyDialog).not.toHaveTextContent("剧情点");

    await user.click(within(storyDialog).getByRole("button", { name: "继续" }));
    const currentEvent = screen.getByRole("region", { name: "当前事件" });
    expect(currentEvent).toHaveTextContent("告别演出");

    await user.click(screen.getByRole("button", { name: "按年份唱完旧歌" }));
    const feedback = screen.getByRole("dialog");
    expect(feedback).toHaveTextContent("最后一首旧歌");
    expect(screen.queryByRole("region", { name: "结局评价" })).not.toBeInTheDocument();

    await user.click(within(feedback).getByRole("button", { name: "继续" }));
    const ending = screen.getByRole("region", { name: "结局评价" });
    expect(ending).toHaveTextContent("长路见证者");
    expect(ending).toHaveTextContent("触发：告别演出");
  });

  it("plays a health collapse story event before the formal collapse ending", async () => {
    const user = userEvent.setup();
    const state = createInitialState("performer");
    state.month = "2028-08";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.player.health = 18;
    state.player.stress = 86;
    state.queuedEvents = ["career.fallback.health_collapse"];
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: SAVE_VERSION,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2028-08-01T00:00:00.000Z",
        state
      })
    );

    render(<App />);

    const storyDialog = screen.getByRole("dialog");
    expect(storyDialog).toHaveTextContent("后台白光");
    expect(storyDialog).toHaveTextContent("救护车");
    expect(storyDialog).not.toHaveTextContent("剧情点");

    await user.click(within(storyDialog).getByRole("button", { name: "继续" }));
    expect(screen.getByRole("region", { name: "当前事件" })).toHaveTextContent("后台白光");

    await user.click(screen.getByRole("button", { name: "让救护车开走" }));
    const feedback = screen.getByRole("dialog");
    expect(feedback).toHaveTextContent("灯从头顶退远");
    expect(screen.queryByRole("region", { name: "结局评价" })).not.toBeInTheDocument();

    await user.click(within(feedback).getByRole("button", { name: "继续" }));
    const ending = screen.getByRole("region", { name: "结局评价" });
    expect(ending).toHaveTextContent("触发：健康崩溃");
    expect(ending).toHaveTextContent("健康");
    expect(ending).toHaveTextContent("压力");
  });

  it("plays a health warning before the collapse story when strain becomes critical", async () => {
    const user = userEvent.setup();
    const state = createInitialState("performer");
    state.month = "2028-08";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.player.health = 18;
    state.player.stress = 86;
    state.queuedEvents = ["career.fallback.health_warning"];
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: SAVE_VERSION,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2028-08-01T00:00:00.000Z",
        state
      })
    );

    render(<App />);

    const warningDialog = screen.getByRole("dialog");
    expect(warningDialog).toHaveTextContent("身体先听见了");
    expect(warningDialog).toHaveTextContent("返场");
    expect(warningDialog).not.toHaveTextContent("剧情点");

    await user.click(within(warningDialog).getByRole("button", { name: "继续" }));
    await user.click(screen.getByRole("button", { name: "继续撑完这场" }));

    const warningFeedback = screen.getByRole("dialog");
    expect(warningFeedback).toHaveTextContent("台阶变得很远");
    expect(screen.queryByRole("region", { name: "结局评价" })).not.toBeInTheDocument();

    await user.click(within(warningFeedback).getByRole("button", { name: "继续" }));
    const collapseDialog = screen.getByRole("dialog");
    expect(collapseDialog).toHaveTextContent("后台白光");

    await user.click(within(collapseDialog).getByRole("button", { name: "继续" }));
    await user.click(screen.getByRole("button", { name: "让救护车开走" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "继续" }));

    const ending = screen.getByRole("region", { name: "结局评价" });
    expect(ending).toHaveTextContent("触发：健康崩溃");
  });

  it("plays a band breakup story event before the formal breakup ending", async () => {
    const user = userEvent.setup();
    const state = createInitialState("writer");
    state.month = "2028-09";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.relationships.vocal = 18;
    state.relationships.bass = 19;
    state.relationships.drums = 20;
    state.queuedEvents = ["career.fallback.band_breakup"];
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: SAVE_VERSION,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2028-09-01T00:00:00.000Z",
        state
      })
    );

    render(<App />);

    const storyDialog = screen.getByRole("dialog");
    expect(storyDialog).toHaveTextContent("最后一次排练");
    expect(storyDialog).toHaveTextContent("没有人愿意先数拍");
    expect(storyDialog).not.toHaveTextContent("剧情点");

    await user.click(within(storyDialog).getByRole("button", { name: "继续" }));
    expect(screen.getByRole("region", { name: "当前事件" })).toHaveTextContent("最后一次排练");

    await user.click(screen.getByRole("button", { name: "把解散说出口" }));
    const feedback = screen.getByRole("dialog");
    expect(feedback).toHaveTextContent("没有人再数拍");
    expect(screen.queryByRole("region", { name: "结局评价" })).not.toBeInTheDocument();

    await user.click(within(feedback).getByRole("button", { name: "继续" }));
    const ending = screen.getByRole("region", { name: "结局评价" });
    expect(ending).toHaveTextContent("触发：乐队解散");
    expect(ending).toHaveTextContent("成员关系平均");
  });

  it("plays a breakup warning before the breakup story when relationships are broken", async () => {
    const user = userEvent.setup();
    const state = createInitialState("writer");
    state.month = "2028-09";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.relationships.vocal = 18;
    state.relationships.bass = 19;
    state.relationships.drums = 20;
    state.queuedEvents = ["career.fallback.breakup_warning"];
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: SAVE_VERSION,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2028-09-01T00:00:00.000Z",
        state
      })
    );

    render(<App />);

    const warningDialog = screen.getByRole("dialog");
    expect(warningDialog).toHaveTextContent("沉默占满排练室");
    expect(warningDialog).toHaveTextContent("没有人先数拍");
    expect(warningDialog).not.toHaveTextContent("剧情点");

    await user.click(within(warningDialog).getByRole("button", { name: "继续" }));
    await user.click(screen.getByRole("button", { name: "继续各自收拾" }));

    const warningFeedback = screen.getByRole("dialog");
    expect(warningFeedback).toHaveTextContent("沉默继续加重");
    expect(screen.queryByRole("region", { name: "结局评价" })).not.toBeInTheDocument();

    await user.click(within(warningFeedback).getByRole("button", { name: "继续" }));
    const breakupDialog = screen.getByRole("dialog");
    expect(breakupDialog).toHaveTextContent("最后一次排练");

    await user.click(within(breakupDialog).getByRole("button", { name: "继续" }));
    await user.click(screen.getByRole("button", { name: "把解散说出口" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "继续" }));

    const ending = screen.getByRole("region", { name: "结局评价" });
    expect(ending).toHaveTextContent("触发：乐队解散");
  });

  it("shows annual summaries after crossing into a new year", async () => {
    const user = userEvent.setup();
    const state = createInitialState("writer");
    state.month = "2027-12";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.player.fame = 33;
    state.history.push({
      id: "history.1",
      month: "2027-09",
      type: "performance",
      title: "街角演出",
      description: "你们在街角演出。",
      weight: 2,
      tags: ["career", "performance"]
    });
    state.releases.push({
      id: "release.1",
      month: "2027-10",
      type: "single",
      title: "雨后的失真",
      recordingIds: ["recording.1"],
      sales: 800,
      criticalScore: 72,
      fameImpact: 8,
      awards: []
    });
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: SAVE_VERSION,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2027-12-01T00:00:00.000Z",
        state
      })
    );

    render(<App />);
    await user.click(screen.getByRole("button", { name: "进入下个月" }));

    const annualSummary = screen.getByRole("region", { name: "年度摘要" });
    expect(annualSummary).toHaveTextContent("2027 年");
    expect(annualSummary).toHaveTextContent("发行 1");
    expect(annualSummary).toHaveTextContent("演出 1");
    expect(annualSummary).toHaveTextContent("销量 800");
  });

  it("shows release results after publishing a recording", async () => {
    const user = userEvent.setup();
    const state = createInitialState("writer");
    state.month = "2027-09";
    state.phase = "career";
    state.careerStage = "early";
    state.flags["campus.graduationShowDone"] = true;
    state.player.fame = 18;
    state.band.fans = 90;
    state.band.reputation = 24;
    state.band.workQuality = 64;
    state.works.push({
      id: "work.1",
      title: "雨后的失真",
      stage: "song",
      sourceRiffIds: ["riff.1"],
      completion: 100,
      quality: 68,
      rehearsal: 55,
      styleTags: ["delay"],
      authorship: "shared",
      tension: 0
    });
    state.recordings.push({
      id: "recording.1",
      createdAt: "2027-08",
      workId: "work.1",
      type: "demo",
      quality: 66,
      rawness: 34,
      released: false
    });
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: SAVE_VERSION,
        createdAt: "2027-05-01T00:00:00.000Z",
        updatedAt: "2027-05-01T00:00:00.000Z",
        state
      })
    );

    render(<App />);
    await user.click(screen.getByRole("button", { name: /发行/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("作品上线");
    await user.click(screen.getByRole("button", { name: "继续" }));

    expect(screen.getByRole("region", { name: "发行作品" })).toHaveTextContent("雨后的失真");
    expect(screen.getByRole("region", { name: "发行作品" })).toHaveTextContent("销量");
    expect(screen.getByRole("region", { name: "发行作品" })).toHaveTextContent("媒体评分");
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

  it("shows a recovery notice when a saved game is corrupt", () => {
    localStorage.setItem(SAVE_KEY, "{not valid json");

    render(<App />);

    expect(screen.getByRole("status")).toHaveTextContent("存档已损坏，已回到新游戏。");
    expect(screen.getByRole("button", { name: /创作型/ })).toBeInTheDocument();
  });

  it("renders responsive gameplay regions for desktop and mobile layouts", async () => {
    const user = userEvent.setup();
    render(<App />);

    await startWriterGame(user);

    expect(screen.getByRole("region", { name: "状态摘要" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "当前事件" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "行动选择" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "装备" })).toBeInTheDocument();
    const memberRegion = screen.getByRole("region", { name: "队友状态" });
    expect(memberRegion).toHaveTextContent("林夏");
    expect(memberRegion).toHaveTextContent("主唱");
    expect(memberRegion).toHaveTextContent("周航");
    expect(memberRegion).toHaveTextContent("贝斯");
    expect(memberRegion).toHaveTextContent("唐野");
    expect(memberRegion).toHaveTextContent("鼓手");
    expect(memberRegion).toHaveTextContent("正常");
    expect(screen.getByRole("region", { name: "履历" })).toBeInTheDocument();
  });
});
