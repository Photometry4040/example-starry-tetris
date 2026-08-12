import { describe, expect, it } from "vitest";
import { createClearEvent } from "../src/game/events";

describe("별빛 요정단 이벤트", () => {
  it("지운 줄이 없으면 이벤트를 만들지 않는다", () => {
    expect(createClearEvent({ cleared: 0, combo: 0, level: 1 })).toBeNull();
  });

  it.each([
    [1, "single", ["star-fairy"], "반짝 성공!"],
    [2, "double", ["candy-bunny"], "달콤한 더블!"],
    [3, "triple", ["rainbow-cat"], "무지개 트리플!"],
    [4, "festival", ["star-fairy", "candy-bunny", "rainbow-cat"], "별빛 축제!"],
  ] as const)("%d줄 삭제 이벤트를 올바르게 고른다", (cleared, tier, characters, title) => {
    const event = createClearEvent({ cleared, combo: 1, level: 2 });
    expect(event).toMatchObject({ tier, characters, title, comboBoost: "none" });
  });

  it("3콤보부터 별가루 연출을 강화한다", () => {
    const event = createClearEvent({ cleared: 2, combo: 3, level: 4 });
    expect(event).toMatchObject({ comboBoost: "sparkle" });
    expect(event?.particleCount).toBeGreaterThan(16);
    expect(event?.message).toContain("3콤보");
  });

  it("5콤보부터 별빛 폭발 연출을 사용한다", () => {
    const event = createClearEvent({ cleared: 1, combo: 5, level: 6 });
    expect(event).toMatchObject({ comboBoost: "super", title: "5 COMBO! 별빛 폭발!" });
    expect(event?.particleCount).toBeGreaterThan(20);
  });
});
