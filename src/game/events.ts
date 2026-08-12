export type CharacterId = "star-fairy" | "candy-bunny" | "rainbow-cat";
export type EventTier = "single" | "double" | "triple" | "festival";
export type ComboBoost = "none" | "sparkle" | "super";

export interface ClearEventInput {
  cleared: number;
  combo: number;
  level: number;
  id?: number;
}

export interface ClearEvent {
  id: number;
  tier: EventTier;
  characters: CharacterId[];
  title: string;
  message: string;
  announcement: string;
  particleCount: number;
  comboBoost: ComboBoost;
}

const BASE_EVENTS: Record<EventTier, Omit<ClearEvent, "id" | "comboBoost">> = {
  single: {
    tier: "single",
    characters: ["star-fairy"],
    title: "반짝 성공!",
    message: "별요정이 별가루를 뿌려요!",
    announcement: "한 줄 완성! 별요정이 나타났어요.",
    particleCount: 10,
  },
  double: {
    tier: "double",
    characters: ["candy-bunny"],
    title: "달콤한 더블!",
    message: "캔디 토끼의 폭죽 선물!",
    announcement: "두 줄 완성! 캔디 토끼가 나타났어요.",
    particleCount: 16,
  },
  triple: {
    tier: "triple",
    characters: ["rainbow-cat"],
    title: "무지개 트리플!",
    message: "무지개 고양이가 선물을 가져왔어요!",
    announcement: "세 줄 완성! 무지개 고양이가 나타났어요.",
    particleCount: 22,
  },
  festival: {
    tier: "festival",
    characters: ["star-fairy", "candy-bunny", "rainbow-cat"],
    title: "별빛 축제!",
    message: "요정단 모두가 별 샤워를 열었어요!",
    announcement: "네 줄 완성! 별빛 요정단의 축제가 시작됐어요.",
    particleCount: 36,
  },
};

export function createClearEvent({ cleared, combo, level, id = 0 }: ClearEventInput): ClearEvent | null {
  if (cleared <= 0) return null;

  const tier: EventTier = cleared >= 4 ? "festival" : cleared === 3 ? "triple" : cleared === 2 ? "double" : "single";
  const base = BASE_EVENTS[tier];
  const comboBoost: ComboBoost = combo >= 5 ? "super" : combo >= 3 ? "sparkle" : "none";

  if (comboBoost === "super") {
    return {
      ...base,
      id,
      comboBoost,
      title: `${combo} COMBO! 별빛 폭발!`,
      message: `레벨 ${level}의 마법 링이 반짝반짝 퍼져요!`,
      announcement: `${base.announcement} ${combo} 콤보 별빛 폭발!`,
      particleCount: base.particleCount + 18,
    };
  }

  if (comboBoost === "sparkle") {
    return {
      ...base,
      id,
      comboBoost,
      message: `${base.message} ${combo}콤보 응원 별도 도착했어요!`,
      announcement: `${base.announcement} ${combo} 콤보가 이어집니다!`,
      particleCount: base.particleCount + 8,
    };
  }

  return { ...base, id, comboBoost };
}
