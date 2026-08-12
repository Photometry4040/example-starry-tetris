import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  createGameState,
  getGhostPiece,
  getPieceCells,
  reduceGame,
} from "./game/engine";
import type { Cell, GameAction, GameState, TetrominoType } from "./game/types";
import { createClearEvent, type CharacterId, type ClearEvent } from "./game/events";

type ThemeId = "starlight" | "candy" | "rainbow";

const THEMES: Array<{ id: ThemeId; name: string; icon: string; unlockAt: number }> = [
  { id: "starlight", name: "별빛 정원", icon: "✦", unlockAt: 0 },
  { id: "candy", name: "캔디 파티", icon: "🍬", unlockAt: 10 },
  { id: "rainbow", name: "무지개 꿈", icon: "🌈", unlockAt: 25 },
];

const PIECE_LABELS: Record<TetrominoType, string> = {
  I: "하늘 리본",
  O: "레몬 보석",
  T: "라일락 별",
  S: "민트 나비",
  Z: "딸기 리본",
  J: "블루 크리스털",
  L: "오렌지 보석",
};

const INITIAL_THEME = "starlight" as ThemeId;

function readTheme(): ThemeId {
  if (typeof window === "undefined") return INITIAL_THEME;
  const stored = window.localStorage.getItem("starry-tetris-theme");
  return THEMES.some((theme) => theme.id === stored) ? (stored as ThemeId) : INITIAL_THEME;
}

function readHighScore(): number {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem("starry-tetris-high-score") ?? 0);
}

function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}

function getCell(board: Cell[][], activeCells: Map<string, TetrominoType>, x: number, y: number): Cell {
  return activeCells.get(`${x}:${y}`) ?? board[y][x];
}

function buildPieceMap(piece: ReturnType<typeof getGhostPiece>): Map<string, TetrominoType> {
  return new Map(getPieceCells(piece).map(({ x, y }) => [`${x}:${y}`, piece.type]));
}

function MiniPiece({ type }: { type: TetrominoType | null }) {
  if (!type) return <div className="mini-piece empty-mini">?</div>;
  return (
    <div className={`mini-piece piece-${type}`} aria-label={PIECE_LABELS[type]}>
      {Array.from({ length: 16 }, (_, index) => {
        const x = index % 4;
        const y = Math.floor(index / 4);
        const miniCells = getPieceCells({ type, rotation: 0, x: 0, y: 0 });
        const occupied = miniCells.some((cell) => cell.x === x && cell.y === y);
        return <span className={occupied ? "mini-cell filled" : "mini-cell"} key={index} />;
      })}
    </div>
  );
}

function EventCharacter({ character }: { character: CharacterId }) {
  if (character === "candy-bunny") {
    return (
      <svg className="event-character bunny" viewBox="0 0 120 120" aria-hidden="true">
        <path className="bunny-ear" d="M35 48C16 26 20 6 34 8c13 3 18 23 17 38M75 46C76 19 88 7 100 13c12 8 3 28-12 40" />
        <circle className="character-face" cx="60" cy="65" r="34" />
        <circle className="character-cheek" cx="43" cy="73" r="6" /><circle className="character-cheek" cx="77" cy="73" r="6" />
        <circle className="character-eye" cx="48" cy="62" r="3.5" /><circle className="character-eye" cx="72" cy="62" r="3.5" />
        <path className="character-smile" d="M55 74q5 5 10 0" />
        <path className="bunny-bow" d="M60 91c-14-11-24-5-18 5 6 9 15 5 18 0 4 5 13 9 18 0 7-10-5-16-18-5Z" />
      </svg>
    );
  }

  if (character === "rainbow-cat") {
    return (
      <svg className="event-character cat" viewBox="0 0 120 120" aria-hidden="true">
        <path className="cat-tail" d="M91 82c24 3 21-29 5-25-10 3-6 17 6 12" />
        <path className="cat-ear" d="M31 43 35 16l20 19M69 35l19-20 5 30" />
        <circle className="character-face" cx="60" cy="64" r="35" />
        <circle className="character-cheek" cx="43" cy="75" r="6" /><circle className="character-cheek" cx="77" cy="75" r="6" />
        <circle className="character-eye" cx="48" cy="62" r="3.5" /><circle className="character-eye" cx="72" cy="62" r="3.5" />
        <path className="character-smile" d="M55 74q5 5 10 0" />
        <path className="cat-rainbow" d="M39 46q21-18 42 0" />
      </svg>
    );
  }

  return (
    <svg className="event-character fairy" viewBox="0 0 120 120" aria-hidden="true">
      <ellipse className="fairy-wing" cx="35" cy="61" rx="20" ry="29" transform="rotate(-30 35 61)" />
      <ellipse className="fairy-wing" cx="84" cy="61" rx="20" ry="29" transform="rotate(30 84 61)" />
      <circle className="character-face" cx="60" cy="61" r="31" />
      <path className="fairy-hair" d="M31 56q28-39 57 1-16-8-27-4-16-6-30 3Z" />
      <circle className="character-cheek" cx="45" cy="70" r="5" /><circle className="character-cheek" cx="75" cy="70" r="5" />
      <circle className="character-eye" cx="50" cy="61" r="3.3" /><circle className="character-eye" cx="70" cy="61" r="3.3" />
      <path className="character-smile" d="M55 71q5 5 10 0" />
      <path className="fairy-star" d="m60 12 4 10 10 1-8 7 3 10-9-5-9 5 3-10-8-7 10-1Z" />
    </svg>
  );
}

function ClearCelebration({ event }: { event: ClearEvent }) {
  const particleSymbols = ["✦", "✧", "♡", "✿", "·", "✦"];
  return (
    <div className={`clear-celebration tier-${event.tier} boost-${event.comboBoost}`} key={event.id} aria-hidden="true">
      <div className="event-particles">
        {Array.from({ length: event.particleCount }, (_, index) => (
          <span className={`event-particle particle-${index % 6}`} key={index}>{particleSymbols[index % particleSymbols.length]}</span>
        ))}
      </div>
      <div className="event-orbit orbit-one" /><div className="event-orbit orbit-two" />
      <div className="event-characters">
        {event.characters.map((character) => <EventCharacter character={character} key={character} />)}
      </div>
      <div className="event-card"><strong>{event.title}</strong><span>{event.message}</span></div>
    </div>
  );
}

export default function App() {
  const [game, setGame] = useState<GameState>(() => createGameState());
  const [highScore, setHighScore] = useState(readHighScore);
  const [theme, setTheme] = useState<ThemeId>(readTheme);
  const [clearEvent, setClearEvent] = useState<ClearEvent | null>(null);
  const eventId = useRef(0);

  const unlockedThemes = THEMES.filter((item) => game.lines >= item.unlockAt);
  const safeTheme = unlockedThemes.some((item) => item.id === theme) ? theme : INITIAL_THEME;
  const ghost = useMemo(() => getGhostPiece(game), [game]);
  const activeMap = useMemo(() => buildPieceMap(game.active), [game.active]);
  const ghostMap = useMemo(() => buildPieceMap(ghost), [ghost]);

  useEffect(() => {
    if (game.score > highScore) {
      setHighScore(game.score);
      window.localStorage.setItem("starry-tetris-high-score", String(game.score));
    }
  }, [game.score, highScore]);

  useEffect(() => {
    window.localStorage.setItem("starry-tetris-theme", safeTheme);
    document.documentElement.dataset.theme = safeTheme;
  }, [safeTheme]);

  useEffect(() => {
    if (game.lines === 0 || game.lastCleared === 0) return undefined;
    const nextEvent = createClearEvent({
      cleared: game.lastCleared,
      combo: game.combo,
      level: game.level,
      id: ++eventId.current,
    });
    setClearEvent(nextEvent);
    const timeout = window.setTimeout(() => setClearEvent(null), 1600);
    return () => window.clearTimeout(timeout);
  }, [game.lines]);

  useEffect(() => {
    if (game.status !== "playing") return undefined;
    const interval = window.setInterval(() => {
      setGame((current) => reduceGame(current, { type: "tick" }));
    }, Math.max(180, 760 - (game.level - 1) * 55));
    return () => window.clearInterval(interval);
  }, [game.level, game.status]);

  const dispatch = useCallback((action: GameAction) => {
    setGame((current) => reduceGame(current, action));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const action: GameAction | null =
        event.key === "ArrowLeft" ? { type: "move", dx: -1 } :
        event.key === "ArrowRight" ? { type: "move", dx: 1 } :
        event.key === "ArrowDown" ? { type: "soft-drop" } :
        event.key === "ArrowUp" || event.key.toLowerCase() === "x" ? { type: "rotate", direction: 1 } :
        event.key.toLowerCase() === "z" ? { type: "rotate", direction: -1 } :
        event.key === " " ? { type: "hard-drop" } :
        event.key.toLowerCase() === "c" ? { type: "hold" } :
        event.key.toLowerCase() === "p" ? { type: "pause" } : null;
      if (!action) return;
      event.preventDefault();
      dispatch(action);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch]);

  const startLabel = game.status === "gameover" ? "다시 도전하기" : game.status === "ready" ? "게임 시작" : "새 게임";
  const avatarStage = game.lines >= 25 ? "무지개 마법사" : game.lines >= 10 ? "캔디 요정" : "별빛 견습생";

  return (
    <main className="app-shell">
      <div className="sparkle sparkle-one">✦</div>
      <div className="sparkle sparkle-two">✧</div>
      <header className="topbar">
        <a className="logo" href="." aria-label="별빛 테트리스 홈">
          <span className="logo-orb">✦</span>
          <span><strong>별빛 테트리스</strong><small>STARRY BLOCKS</small></span>
        </a>
        <div className="top-actions">
          <span className="made-with">오늘의 별빛을 쌓아봐요!</span>
          <button className="icon-button" onClick={() => dispatch({ type: "pause" })} aria-label="게임 일시정지 또는 계속하기">Ⅱ</button>
        </div>
      </header>

      <section className="intro-copy">
        <p className="eyebrow">✿ GEM DROP CLUB</p>
        <h1>반짝이는 블록으로<br /><em>나만의 별빛을 만들어요</em></h1>
        <p>한 줄씩 정리할 때마다 귀여운 테마가 열려요.<br />오늘의 최고 점수에 도전해 보세요!</p>
      </section>

      <section className="game-layout" aria-label="테트리스 게임">
        <aside className="side-panel left-panel">
          <div className="profile-card">
            <div className="avatar" aria-hidden="true"><span>♡</span><b>✦</b></div>
            <div><span className="card-label">MY STAR LEVEL</span><strong>{avatarStage}</strong><small>레벨 {game.level} · {game.lines}줄 완성</small></div>
          </div>
          <div className="info-card">
            <span className="card-label">HOLD</span>
            <MiniPiece type={game.held} />
            <small className="hint">C 키로 잠깐 보관</small>
          </div>
          <div className="info-card next-card">
            <span className="card-label">NEXT BLOCKS</span>
            <div className="next-list">{game.next.slice(0, 3).map((type, index) => <MiniPiece type={type} key={`${type}-${index}`} />)}</div>
          </div>
        </aside>

        <div className="board-wrap">
          <div className="board-heading"><span>STAGE {String(game.level).padStart(2, "0")}</span><span>{game.status === "paused" ? "PAUSED" : game.status === "gameover" ? "GAME OVER" : "LIVE"}</span></div>
          <div className={`board ${game.lastCleared > 0 ? "board-flash" : ""}`} role="grid" aria-label="테트리스 보드">
            {Array.from({ length: BOARD_HEIGHT * BOARD_WIDTH }, (_, index) => {
              const x = index % BOARD_WIDTH;
              const y = Math.floor(index / BOARD_WIDTH);
              const cell = getCell(game.board, activeMap, x, y);
              const isGhost = !cell && ghostMap.has(`${x}:${y}`);
              return <div className={`cell ${cell ? `cell-${cell}` : ""} ${isGhost ? `ghost-${ghost.type}` : ""}`} key={index} role="gridcell" />;
            })}
            {clearEvent && <ClearCelebration event={clearEvent} />}
            {game.status === "ready" && <div className="board-message"><span>✦</span><strong>준비됐나요?</strong><small>버튼을 눌러 별빛을 쌓아보세요</small></div>}
            {game.status === "paused" && <div className="board-message"><span>Ⅱ</span><strong>잠깐 쉬어가기</strong><small>일시정지 버튼을 누르면 계속돼요</small></div>}
            {game.status === "gameover" && <div className="board-message"><span>✧</span><strong>별빛이 가득 찼어요!</strong><small>다시 시작해서 더 높은 곳으로</small></div>}
          </div>
          <p className="sr-only" aria-live="polite">{clearEvent?.announcement ?? ""}</p>
          <div className="touch-controls" aria-label="터치 조작">
            <button onClick={() => dispatch({ type: "move", dx: -1 })} aria-label="왼쪽 이동">←</button>
            <button onClick={() => dispatch({ type: "rotate", direction: -1 })} aria-label="왼쪽 회전">↶</button>
            <button onClick={() => dispatch({ type: "soft-drop" })} aria-label="빠르게 내리기">↓</button>
            <button onClick={() => dispatch({ type: "rotate", direction: 1 })} aria-label="오른쪽 회전">↷</button>
            <button onClick={() => dispatch({ type: "move", dx: 1 })} aria-label="오른쪽 이동">→</button>
            <button className="drop-button" onClick={() => dispatch({ type: "hard-drop" })} aria-label="블록 즉시 내리기">✦ DROP</button>
          </div>
        </div>

        <aside className="side-panel right-panel">
          <div className="score-card"><span className="card-label">SCORE</span><strong>{formatNumber(game.score)}</strong><div className="score-divider" /><span className="card-label">BEST SCORE</span><b>{formatNumber(highScore)}</b></div>
          <div className="stats-card"><div><span>LINES</span><strong>{String(game.lines).padStart(2, "0")}</strong></div><div><span>COMBO</span><strong>{game.combo > 1 ? `${game.combo}x` : "—"}</strong></div></div>
          <button className="primary-button" onClick={() => dispatch({ type: "start" })}>{startLabel}<span>↗</span></button>
          <p className="keyboard-hint"><kbd>←</kbd><kbd>→</kbd> 이동 <kbd>↑</kbd> 회전<br /><kbd>SPACE</kbd> 한 번에 내리기</p>
        </aside>
      </section>

      <section className="theme-section">
        <div className="section-title"><p className="eyebrow">✿ YOUR DREAM COLORS</p><h2>오늘은 어떤 <em>별빛</em>으로<br />플레이할까요?</h2></div>
        <div className="theme-list">
          {THEMES.map((item) => {
            const unlocked = game.lines >= item.unlockAt;
            return <button className={`theme-button ${safeTheme === item.id ? "selected" : ""} ${!unlocked ? "locked" : ""}`} disabled={!unlocked} onClick={() => setTheme(item.id)} key={item.id}><span className="theme-icon">{unlocked ? item.icon : "🔒"}</span><span><strong>{item.name}</strong><small>{unlocked ? "사용 가능" : `${item.unlockAt}줄 달성 시 오픈`}</small></span>{safeTheme === item.id && <b>✓</b>}</button>;
          })}
        </div>
      </section>

      <footer className="footer"><span>✦ MADE FOR YOUR LITTLE MOMENTS</span><span>← → 이동 · ↑ 회전 · SPACE 드롭 · C 보관 · P 일시정지</span></footer>
    </main>
  );
}
