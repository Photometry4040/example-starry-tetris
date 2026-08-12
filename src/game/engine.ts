import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  type Cell,
  type Board,
  type GameAction,
  type GameState,
  type Piece,
  type Point,
  type TetrominoType,
} from "./types";

export { BOARD_HEIGHT, BOARD_WIDTH } from "./types";

const TYPES: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];
const SCORE_BY_LINES = [0, 100, 300, 500, 800];

const SHAPES: Record<TetrominoType, Point[][]> = {
  I: [
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }],
    [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
  ],
  O: [[{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }]],
  T: [
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
  S: [
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
  ],
  Z: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
  ],
  J: [
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  ],
  L: [
    [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
};

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(null));
}

export function getPieceCells(piece: Piece): Point[] {
  const rotations = SHAPES[piece.type];
  const shape = rotations[piece.rotation % rotations.length];
  return shape.map(({ x, y }) => ({ x: piece.x + x, y: piece.y + y }));
}

export function createPiece(type: TetrominoType): Piece {
  return { type, rotation: 0, x: 3, y: 0 };
}

export function isValidPosition(board: Board, piece: Piece): boolean {
  return getPieceCells(piece).every(({ x, y }) => {
    if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return false;
    return y < 0 || board[y][x] === null;
  });
}

export function mergePiece(board: Board, piece: Piece): Board {
  const nextBoard = board.map((row) => [...row]);
  for (const { x, y } of getPieceCells(piece)) {
    if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
      nextBoard[y][x] = piece.type;
    }
  }
  return nextBoard;
}

export function clearCompletedLines(board: Board): { board: Board; cleared: number } {
  const remaining = board.filter((row) => row.some((cell) => cell === null));
  const cleared = BOARD_HEIGHT - remaining.length;
  const emptyRows = Array.from({ length: cleared }, () => Array<Cell>(BOARD_WIDTH).fill(null));
  return { board: [...emptyRows, ...remaining], cleared };
}

function randomType(random: () => number): TetrominoType {
  return TYPES[Math.floor(random() * TYPES.length)];
}

function createQueue(random: () => number, length: number): TetrominoType[] {
  const queue: TetrominoType[] = [];
  while (queue.length < length) {
    const bag = [...TYPES];
    for (let index = bag.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
    }
    queue.push(...bag);
  }
  return queue.slice(0, length);
}

export function createGameState(
  random: () => number = Math.random,
  sequence?: TetrominoType[],
): GameState {
  const queue = sequence?.length ? [...sequence, ...createQueue(random, 8)] : createQueue(random, 8);
  const active = createPiece(queue[0] ?? randomType(random));
  return {
    board: createEmptyBoard(),
    active,
    next: queue.slice(1, 6),
    held: null,
    canHold: true,
    score: 0,
    lines: 0,
    level: 1,
    combo: 0,
    status: "ready",
    lastCleared: 0,
  };
}

function move(state: GameState, dx: number, dy: number): GameState {
  const moved = { ...state.active, x: state.active.x + dx, y: state.active.y + dy };
  return isValidPosition(state.board, moved) ? { ...state, active: moved } : state;
}

function rotate(state: GameState, direction: 1 | -1): GameState {
  const rotations = SHAPES[state.active.type].length;
  const rotated = {
    ...state.active,
    rotation: (state.active.rotation + direction + rotations) % rotations,
  };
  for (const offset of [0, -1, 1, -2, 2]) {
    const kicked = { ...rotated, x: rotated.x + offset };
    if (isValidPosition(state.board, kicked)) return { ...state, active: kicked };
  }
  return state;
}

function lockPiece(state: GameState, random: () => number, bonusScore = 0): GameState {
  const merged = mergePiece(state.board, state.active);
  const { board, cleared } = clearCompletedLines(merged);
  const combo = cleared > 0 ? state.combo + 1 : 0;
  const lines = state.lines + cleared;
  const level = Math.floor(lines / 10) + 1;
  const score = state.score + bonusScore + SCORE_BY_LINES[cleared] * state.level + (cleared > 0 ? state.combo * 50 : 0);
  const nextType = state.next[0] ?? randomType(random);
  const next = [...state.next.slice(1), ...createQueue(random, 1)];
  const active = createPiece(nextType);
  const gameover = !isValidPosition(board, active);
  return {
    ...state,
    board,
    active,
    next,
    canHold: true,
    score,
    lines,
    level,
    combo,
    status: gameover ? "gameover" : state.status,
    lastCleared: cleared,
  };
}

function hold(state: GameState, random: () => number): GameState {
  if (!state.canHold) return state;
  if (state.held === null) {
    const nextType = state.next[0] ?? randomType(random);
    return {
      ...state,
      active: createPiece(nextType),
      held: state.active.type,
      next: [...state.next.slice(1), ...createQueue(random, 1)],
      canHold: false,
    };
  }
  return {
    ...state,
    active: createPiece(state.held),
    held: state.active.type,
    canHold: false,
  };
}

export function reduceGame(state: GameState, action: GameAction, random: () => number = Math.random): GameState {
  if (action.type === "start") return { ...createGameState(random), status: "playing" };
  if (action.type === "pause") {
    if (state.status === "playing") return { ...state, status: "paused" };
    if (state.status === "paused") return { ...state, status: "playing" };
    return state;
  }
  if (state.status !== "playing") return state;

  const cleanState = state.lastCleared ? { ...state, lastCleared: 0 } : state;
  switch (action.type) {
    case "move":
      return move(cleanState, action.dx, 0);
    case "soft-drop": {
      const dropped = move(cleanState, 0, 1);
      return dropped === cleanState ? lockPiece(cleanState, random) : { ...dropped, score: dropped.score + 1 };
    }
    case "hard-drop": {
      let dropped = cleanState;
      let distance = 0;
      while (true) {
        const next = move(dropped, 0, 1);
        if (next === dropped) break;
        dropped = next;
        distance += 1;
      }
      return lockPiece(dropped, random, distance * 2);
    }
    case "rotate":
      return rotate(cleanState, action.direction);
    case "hold":
      return hold(cleanState, random);
    case "tick": {
      const dropped = move(cleanState, 0, 1);
      return dropped === cleanState ? lockPiece(cleanState, random) : dropped;
    }
    default:
      return cleanState;
  }
}

export function getGhostPiece(state: GameState): Piece {
  let ghost = state.active;
  while (true) {
    const next = { ...ghost, y: ghost.y + 1 };
    if (!isValidPosition(state.board, next)) return ghost;
    ghost = next;
  }
}
