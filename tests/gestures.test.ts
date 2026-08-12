import { describe, expect, it } from "vitest";
import { classifyBoardGesture } from "../src/game/gestures";

describe("모바일 보드 제스처", () => {
  it("짧은 탭은 시계 방향 회전으로 처리한다", () => {
    expect(classifyBoardGesture({ x: 100, y: 100 }, { x: 108, y: 106 })).toBe("rotate");
  });

  it("좌우 스와이프는 한 칸 이동으로 처리한다", () => {
    expect(classifyBoardGesture({ x: 100, y: 100 }, { x: 55, y: 105 })).toBe("move-left");
    expect(classifyBoardGesture({ x: 100, y: 100 }, { x: 145, y: 98 })).toBe("move-right");
  });

  it("아래로 긴 스와이프는 즉시 드롭으로 처리한다", () => {
    expect(classifyBoardGesture({ x: 100, y: 100 }, { x: 108, y: 180 })).toBe("hard-drop");
  });

  it("짧은 흔들림, 위쪽, 대각선 스와이프는 무시한다", () => {
    expect(classifyBoardGesture({ x: 100, y: 100 }, { x: 118, y: 118 })).toBeNull();
    expect(classifyBoardGesture({ x: 100, y: 100 }, { x: 100, y: 20 })).toBeNull();
    expect(classifyBoardGesture({ x: 100, y: 100 }, { x: 170, y: 160 })).toBeNull();
  });
});
