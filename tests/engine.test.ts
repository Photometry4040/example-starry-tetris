import { describe, expect, it } from "vitest";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  clearCompletedLines,
  createEmptyBoard,
  createGameState,
  createPiece,
  getPieceCells,
  isValidPosition,
  mergePiece,
  reduceGame,
} from "../src/game/engine";

describe("별빛 테트리스 엔진", () => {
  it("빈 보드를 10×20으로 만든다", () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(BOARD_HEIGHT);
    expect(board.every((row) => row.length === BOARD_WIDTH && row.every((cell) => cell === null))).toBe(true);
  });

  it("블록 위치 충돌을 판정한다", () => {
    const board = createEmptyBoard();
    const piece = createPiece("T");
    expect(isValidPosition(board, piece)).toBe(true);
    expect(isValidPosition(board, { ...piece, x: -1 })).toBe(false);
    expect(isValidPosition(board, { ...piece, y: BOARD_HEIGHT })).toBe(false);
  });

  it("가득 찬 줄을 삭제하고 빈 줄을 위에 추가한다", () => {
    const board = createEmptyBoard();
    board[BOARD_HEIGHT - 1] = Array(BOARD_WIDTH).fill("I");
    const result = clearCompletedLines(board);
    expect(result.cleared).toBe(1);
    expect(result.board).toHaveLength(BOARD_HEIGHT);
    expect(result.board[0].every((cell) => cell === null)).toBe(true);
  });

  it("블록을 보드에 고정한다", () => {
    const board = mergePiece(createEmptyBoard(), { ...createPiece("O"), x: 4, y: 18 });
    expect(board[18][5]).toBe("O");
    expect(board[19][6]).toBe("O");
  });

  it("하드 드롭 후 다음 블록으로 넘어가고 점수를 얻는다", () => {
    const state = { ...createGameState(() => 0, ["I", "O", "T"]), status: "playing" as const };
    const next = reduceGame(state, { type: "hard-drop" }, () => 0);
    expect(next.active.type).toBe("O");
    expect(next.score).toBeGreaterThan(0);
    expect(next.next.length).toBeGreaterThan(0);
  });

  it("회전과 홀드가 동작한다", () => {
    const state = { ...createGameState(() => 0, ["T", "I", "O"]), status: "playing" as const };
    const rotated = reduceGame(state, { type: "rotate", direction: 1 });
    expect(getPieceCells(rotated.active)).not.toEqual(getPieceCells(state.active));
    const held = reduceGame(state, { type: "hold" }, () => 0);
    expect(held.held).toBe("T");
    expect(held.active.type).toBe("I");
    expect(held.canHold).toBe(false);
  });
});
