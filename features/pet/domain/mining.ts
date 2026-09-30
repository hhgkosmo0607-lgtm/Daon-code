/*
 * 펫 채굴 규칙 — 팀 펫이 시간마다 캐서 채굴 게이지가 쌓이고, 게이지가 가득 차면 프리즘 1개.
 * 앱을 켤 때 그동안 쌓인 만큼 받는다(collect-mining). 최대 MAX_HOURS시간치까지만 쌓여서
 * 하루 한 번은 들어와야 손해가 없다. 수치와 정한 이유는 daon-content/재화_경제.md.
 *
 * 앱(표시)과 서버(collect-mining Edge Function)가 같은 파일을 쓴다.
 * Deno(서버)도 이 파일을 불러오므로 다른 파일을 import하지 않는다.
 *
 *   시간당 게이지 = BASE_PER_HOUR + 팀 채굴력 합 × PER_POWER_PER_HOUR, 게이지 POINTS_PER_PRISM = 프리즘 1개
 *   팀 = 화면에 나오는 펫(최대 TEAM_MAX마리). 가진 펫 전부가 아니라 팀만 캔다.
 *   채굴력은 코인 펫 1, 프리즘 펫 3 (petCatalog.ts의 power)
 *     치즈만 → 시간당 0.8 (약 5일에 1개) · 코인 펫 8마리 → 3.6 (약 28시간) · 프리즘 펫 8마리 → 10 (약 10시간)
 */
export const POINTS_PER_PRISM = 100;
export const BASE_PER_HOUR = 0.4;
export const PER_POWER_PER_HOUR = 0.4;
/** 한 번에 받을 수 있는 최대 채굴 시간 — 이보다 오래 안 들어오면 그 뒤는 쌓이지 않는다 */
export const MAX_HOURS = 24;
/** 팀(화면에 나오고 채굴하는 펫) 최대 수 */
export const TEAM_MAX = 8;

/** 시간당 게이지 — 팀 채굴력이 클수록 많이 캔다 (power: petCatalog.ts의 miningPower) */
export function pointsPerHour(power: number): number {
  return BASE_PER_HOUR + Math.max(1, power) * PER_POWER_PER_HOUR;
}

export interface CollectResult {
  /** 이번에 받은 채굴 시간 (최대 MAX_HOURS) */
  hours: number;
  /** 이번에 쌓인 게이지 */
  gained: number;
  /** 새로 나온 프리즘 */
  minted: number;
  /** 받고 남은 게이지 (0 이상 POINTS_PER_PRISM 미만) */
  points: number;
}

/** 지난번에 받은 뒤로 쌓인 시간 (최대 MAX_HOURS) */
export function minedHours(collectedAt: Date, now: Date = new Date()): number {
  const hours = (now.getTime() - collectedAt.getTime()) / 3_600_000;
  return Math.max(0, Math.min(MAX_HOURS, hours));
}

/** 쌓인 채굴을 받으면 (DB 함수 collect_mining과 같은 계산) */
export function collectMining(
  points: number,
  collectedAt: Date,
  power: number,
  now: Date = new Date()
): CollectResult {
  const hours = minedHours(collectedAt, now);
  const gained = hours * pointsPerHour(power);
  const total = points + gained;
  const minted = Math.floor(total / POINTS_PER_PRISM);
  return { hours, gained, minted, points: total - minted * POINTS_PER_PRISM };
}

/** 지금 게이지에서 다음 프리즘까지 걸리는 시간 */
export function hoursToNextPrism(points: number, power: number): number {
  return Math.max(0, POINTS_PER_PRISM - points) / pointsPerHour(power);
}

/**
 * 지금 받을 수 있는 프리즘 (소수 — 1.3이면 받기를 눌렀을 때 1개, 0.3은 계속 쌓인다).
 * 서버에 묻지 않고 화면에서 바로 계산한다 (받기를 누르면 서버가 같은 계산으로 다시 정한다).
 */
export function pendingPrisms(
  points: number,
  collectedAt: Date,
  power: number,
  now: Date = new Date()
): number {
  return (points + minedHours(collectedAt, now) * pointsPerHour(power)) / POINTS_PER_PRISM;
}
