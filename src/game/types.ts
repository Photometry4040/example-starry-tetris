export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export type TetrominoType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Cell = TetrominoType | null;
export type Board = Cell[][];
export type GameStatus = "ready" | "playing" | "paused" | "gameover";

export interface Point {
  x: number;
  y: number;
}

export interface Piece {
  type: TetrominoType;
  rotation: number;
  x: number;
  y: number;
}

export interface GameState {
  board: Board;
  active: Piece;
  next: TetrominoType[];
  held: TetrominoType | null;
  canHold: boolean;
  score: number;
  lines: number;
  level: number;
  combo: number;
  status: GameStatus;
  lastCleared: number;
}

export type GameAction =
  | { type: "move"; dx: number }
  | { type: "soft-drop" }
  | { type: "hard-drop" }
  | { type: "rotate"; direction: 1 | -1 }
  | { type: "hold" }
  | { type: "tick" }
  | { type: "pause" }
  | { type: "start" };
