import { describe, expect, it } from 'vitest';
import { DEFAULT_PET_ID, PETS, PET_POWER, SPECIES_LABEL, miningPower, petById } from './petCatalog';

describe('PETS', () => {
  it('무료 91 · 프리미엄 22마리이고 id가 겹치지 않는다', () => {
    expect(PETS.filter((p) => p.currency === 'coin')).toHaveLength(91);
    expect(PETS.filter((p) => p.currency === 'prism')).toHaveLength(22);
    expect(new Set(PETS.map((p) => p.id)).size).toBe(PETS.length);
  });

  it('모든 펫이 한국어 이름을 가진다 (영어 색·종 이름이 그대로 나오지 않게)', () => {
    for (const pet of PETS) {
      expect(pet.label).not.toMatch(/[a-z]/);
      expect(SPECIES_LABEL[pet.species]).toBeDefined();
    }
  });

  it('처음 펫은 목록에 있는 코인 펫', () => {
    expect(petById(DEFAULT_PET_ID)?.currency).toBe('coin');
  });
});

describe('miningPower', () => {
  it('코인 펫 1, 프리즘 펫 3', () => {
    expect(PET_POWER.cat_orange).toBe(1);
    expect(PET_POWER.dragon_ember).toBe(3);
    expect(miningPower(['cat_orange', 'dog_white', 'cat_rainbow'])).toBe(5);
  });
});
