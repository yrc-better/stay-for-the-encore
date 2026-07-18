import { describe, expect, it } from "vitest";
import { resolvePublicPath } from "./runtime";

describe("运行时公开路径", () => {
  it("根路径部署保持现有绝对资源地址", () => {
    expect(resolvePublicPath("/assets/example.webp", "/")).toBe(
      "/assets/example.webp",
    );
  });

  it("子路径部署为资源补上统一前缀", () => {
    expect(
      resolvePublicPath(
        "/assets/example.webp",
        "/projects/band-simulator/",
      ),
    ).toBe("/projects/band-simulator/assets/example.webp");
  });

  it("外部地址不会被重复改写", () => {
    expect(
      resolvePublicPath(
        "https://cdn.example.com/example.webp",
        "/projects/band-simulator/",
      ),
    ).toBe("https://cdn.example.com/example.webp");
  });
});
