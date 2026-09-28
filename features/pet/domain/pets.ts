/*
 * 홈 상단바를 돌아다니는 터미널 펫. (daon-content/Daon-code_아이디어.md — 캐릭터)
 *
 * 전부 글자로만 그린다 — 이미지 없이 터미널에서도 그대로 찍히는 모양이어야 한다.
 * 여러 줄(\n)로 쓰면 블록 문자(▄█▌)로 픽셀 아트처럼 그릴 수 있다.
 * 나중에 상점에서 캐릭터를 팔게 되면 이 목록이 상품 목록이 된다.
 */

export interface PetDefinition {
  id: string;
  label: string;
  /** 오른쪽으로 걸을 때 번갈아 보여줄 프레임 (1개면 통통 튀기만 한다) */
  right: string[];
  /** 왼쪽으로 걸을 때 */
  left: string[];
  /** 멈춰 있을 때 가끔 깜빡이는 모양 */
  blink: string;
}

/*
 * 다온봇 — 블록 문자 픽셀 캐릭터 (기본 펫)
 *
 *   ▗▄▄▄▄▄▖   머리
 *   ▐██ █ ▌   눈 (빈칸 두 개, 보는 방향으로 쏠린다)
 *    ▘▝ ▘▝    다리 (걸을 때 ▘▝ ↔ ▝▘ 번갈아)
 */
const BOT_HEAD = '▗▄▄▄▄▄▖';
const BOT_LEGS_A = ' ▘▝ ▘▝ ';
const BOT_LEGS_B = ' ▝▘ ▝▘ ';
const bot = (eyes: string, legs: string) => `${BOT_HEAD}\n${eyes}\n${legs}`;

export const PETS: Record<string, PetDefinition> = {
  bot: {
    id: 'bot',
    label: '다온봇',
    right: [bot('▐██ █ ▌', BOT_LEGS_A), bot('▐██ █ ▌', BOT_LEGS_B)],
    left: [bot('▐ █ ██▌', BOT_LEGS_A), bot('▐ █ ██▌', BOT_LEGS_B)],
    blink: bot('▐█▄█▄█▌', BOT_LEGS_A),
  },
  bear: { id: 'bear', label: '곰', right: ['ʕ•ᴥ•ʔ'], left: ['ʕ•ᴥ•ʔ'], blink: 'ʕ-ᴥ-ʔ' },
  cat: { id: 'cat', label: '고양이', right: ['ᓚᘏᗢ'], left: ['ᗢᘏᓗ'], blink: 'ᓚᘏᗢ' },
  slime: { id: 'slime', label: '슬라임', right: ['(•ᴗ•)'], left: ['(•ᴗ•)'], blink: '(-ᴗ-)' },
  ghost: { id: 'ghost', label: '유령', right: ['[°_°]>'], left: ['<[°_°]'], blink: '[-_-]' },
};

export const DEFAULT_PET_ID = 'bot';

/** 펫이 걷는 속도 (px/초) */
export const PET_SPEED = 28;

/** 여러 줄 펫인지 (줄 간격을 붙여서 블록이 이어져 보이게 해야 한다) */
export function isMultiline(pet: PetDefinition): boolean {
  return pet.right[0].includes('\n');
}

/**
 * 다음에 걸어갈 위치를 고른다. 너무 가까운 곳(한 걸음도 안 되는 거리)은 피해서
 * 제자리에서 떠는 것처럼 보이지 않게 한다.
 *
 * @param current 지금 x 위치
 * @param maxX 걸을 수 있는 가장 오른쪽 x (길 너비 - 펫 너비)
 * @param random 0~1 난수 (테스트에서 고정하려고 주입받는다)
 */
export function nextPetTarget(current: number, maxX: number, random: number): number {
  if (maxX <= 0) return 0;
  const minStep = Math.min(maxX / 3, 40);
  const target = random * maxX;
  if (Math.abs(target - current) >= minStep) return target;
  // 너무 가까우면 반대쪽 끝 방향으로 최소 거리만큼 더 간다
  return current + minStep <= maxX ? current + minStep : Math.max(0, current - minStep);
}
