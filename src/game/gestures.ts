export interface GesturePoint {
  x: number;
  y: number;
}

export type BoardGesture = "rotate" | "move-left" | "move-right" | "hard-drop";

export const GESTURE_LIMITS = {
  tapDistance: 12,
  horizontalDistance: 32,
  dropDistance: 72,
  dominantAxisRatio: 1.25,
} as const;

export function classifyBoardGesture(start: GesturePoint, end: GesturePoint): BoardGesture | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (distance <= GESTURE_LIMITS.tapDistance) return "rotate";

  if (
    dy >= GESTURE_LIMITS.dropDistance &&
    absY >= absX * GESTURE_LIMITS.dominantAxisRatio
  ) {
    return "hard-drop";
  }

  if (
    absX >= GESTURE_LIMITS.horizontalDistance &&
    absX >= absY * GESTURE_LIMITS.dominantAxisRatio
  ) {
    return dx < 0 ? "move-left" : "move-right";
  }

  return null;
}
