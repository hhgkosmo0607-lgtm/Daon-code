import { describe, expect, it } from 'vitest';
import { DEFAULT_PET_ID, PETS, isMultiline, nextPetTarget } from './pets';

describe('PETS', () => {
  it('기본 펫이 목록에 있다', () => {
    expect(PETS[DEFAULT_PET_ID]).toBeDefined();
  });

  it('모든 펫은 걷기 프레임이 있고, 여러 줄 펫은 모든 프레임의 줄 수·폭이 같다', () => {
    for (const pet of Object.values(PETS)) {
      expect(pet.right.length).toBeGreaterThan(0);
      expect(pet.left.length).toBeGreaterThan(0);
      if (!isMultiline(pet)) continue;
      // 프레임마다 모양 크기가 다르면 걷는 동안 몸이 출렁인다
      const shape = (frame: string) => frame.split('\n').map((line) => [...line].length);
      const expected = shape(pet.right[0]);
      for (const frame of [...pet.right, ...pet.left, pet.blink]) {
        expect(shape(frame)).toEqual(expected);
      }
    }
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
