/*
 * 홈 상단바를 돌아다니는 도트 펫 (다마고치 방식). (daon-content/Daon-code_아이디어.md — 캐릭터)
 *
 * 그림은 흑백 도트다: 한 줄에 '#'(켜짐)과 '.'(꺼짐)을 적은 문자열 배열.
 * 글꼴과 상관없이 어느 기기에서나 같은 모양으로 찍히고, 이 데이터를 터미널에
 * 그대로 출력해도 모양이 보인다. 색은 테마 색 하나로만 칠한다.
 * 나중에 상점에서 캐릭터를 팔게 되면 이 목록이 상품 목록이 된다.
 */

/** 도트 그림 한 장. 모든 줄의 길이가 같아야 한다 */
export type Sprite = string[];

export interface PetDefinition {
  id: string;
  label: string;
  /** 오른쪽으로 걸을 때 번갈아 보여줄 그림 */
  right: Sprite[];
  /** 왼쪽으로 걸을 때 */
  left: Sprite[];
  /** 쉴 때 기본 모습 */
  idle: Sprite;
  /** 쉬다가 가끔 깜빡이는 모습 */
  blink: Sprite;
}

/*
 * 다온이 — 머리에 새싹, 동그란 몸, 점 눈, 작은 발 (16×15)
 * 눈·입은 보는 방향으로 한 칸 쏠리고, 걸을 때 발이 벌어졌다 모였다 한다.
 */
const HEAD = [
  '.........##.....',
  '........#.......',
  '......####......',
  '....##....##....',
  '...#........#...',
  '..#..........#..',
  '.#............#.',
];
const BODY_BOTTOM = ['.#............#.', '..#..........#..', '...##......##...', '.....######.....'];
const EMPTY_ROW = '.#............#.';

const EYES = { front: '.#...##..##...#.', right: '.#....##..##..#.', left: '.#..##..##....#.' };
const MOUTH = { front: '.#.....##.....#.', right: '.#......##....#.', left: '.#....##......#.' };
const FEET = { apart: '...##......##...', together: '.....##..##.....' };

function daon(look: keyof typeof EYES, feet: keyof typeof FEET, closedEyes = false): Sprite {
  return [
    ...HEAD,
    closedEyes ? EMPTY_ROW : EYES[look],
    EYES[look],
    EMPTY_ROW,
    MOUTH[look],
    ...BODY_BOTTOM,
    FEET[feet],
  ];
}

export const PETS: Record<string, PetDefinition> = {
  daon: {
    id: 'daon',
    label: '다온이',
    right: [daon('right', 'apart'), daon('right', 'together')],
    left: [daon('left', 'apart'), daon('left', 'together')],
    idle: daon('front', 'apart'),
    blink: daon('front', 'apart', true),
  },
};

export const DEFAULT_PET_ID = 'daon';

/** 펫이 걷는 속도 (px/초) */
export const PET_SPEED = 28;

export interface PixelRun {
  x: number;
  y: number;
  width: number;
}

/**
 * 그림을 "가로로 이어진 켜진 칸" 묶음으로 바꾼다.
 * 칸마다 네모를 하나씩 그리면 수백 개가 되므로, 한 줄에서 연달아 켜진 칸은
 * 네모 하나로 합쳐서 그린다.
 */
export function spriteToRuns(sprite: Sprite): PixelRun[] {
  const runs: PixelRun[] = [];
  sprite.forEach((row, y) => {
    let start = -1;
    for (let x = 0; x <= row.length; x++) {
      const on = row[x] === '#';
      if (on && start < 0) start = x;
      if (!on && start >= 0) {
        runs.push({ x: start, y, width: x - start });
        start = -1;
      }
    }
  });
  return runs;
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
