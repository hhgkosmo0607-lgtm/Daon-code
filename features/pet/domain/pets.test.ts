import { describe, expect, it } from 'vitest';
import { DEFAULT_PET_ID, PETS, nextPetTarget, spriteToRuns } from './pets';

describe('PETS', () => {
  it('기본 펫이 목록에 있다', () => {
    expect(PETS[DEFAULT_PET_ID]).toBeDefined();
  });

  it('모든 그림의 크기가 같고, #과 .만 쓴다', () => {
    for (const pet of Object.values(PETS)) {
      const all = [...pet.right, ...pet.left, pet.idle, pet.blink];
      const width = pet.idle[0].length;
      for (const sprite of all) {
        // 그림마다 크기가 다르면 걷는 동안 몸이 출렁인다
        expect(sprite.length).toBe(pet.idle.length);
        for (const row of sprite) {
          expect(row).toHaveLength(width);
          expect(row).toMatch(/^[#.]+$/);
        }
      }
    }
  });
});

describe('spriteToRuns', () => {
  it('한 줄에서 이어진 칸을 하나로 합친다', () => {
    expect(spriteToRuns(['.##.#', '#....'])).toEqual([
      { x: 1, y: 0, width: 2 },
      { x: 4, y: 0, width: 1 },
      { x: 0, y: 1, width: 1 },
    ]);
  });

  it('빈 그림은 네모가 없다', () => {
    expect(spriteToRuns(['....'])).toEqual([]);
  });
});

describe('nextPetTarget', () => {
  it('길이 없으면 0', () => {
    expect(nextPetTarget(0, 0, 0.5)).toBe(0);
  });

  it('충분히 먼 곳이면 난수 위치 그대로', () => {
    expect(nextPetTarget(0, 300, 0.5)).toBe(150);
  });

  it('너무 가까우면 최소 거리만큼 이동', () => {
    // maxX 300 → 최소 거리 40
    expect(nextPetTarget(150, 300, 0.5)).toBe(190);
  });

  it('오른쪽 끝 근처에서 가까운 곳이 뽑히면 왼쪽으로 간다', () => {
    expect(nextPetTarget(300, 300, 0.99)).toBe(260);
  });

  it('항상 길 안쪽', () => {
    for (let i = 0; i <= 10; i++) {
      const t = nextPetTarget(290, 300, i / 10);
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(300);
    }
  });
});
