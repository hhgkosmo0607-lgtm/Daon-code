import { describe, expect, it } from 'vitest';
import { PETS } from '../../pet/domain/petCatalog';
import {
  COIN_PET_PRICE,
  LEGENDARY_PET_PRICE,
  PRISM_PACKS,
  PRISM_PET_PRICE,
  exchangeBlock,
  packBonusPercent,
  petPrice,
  petPurchaseBlock,
} from './shopItems';

describe('petPrice', () => {
  it('코인 펫은 종별 등급 가격', () => {
    expect(petPrice({ id: 'cat_white', species: 'cat', currency: 'coin' })).toBe(40);
    expect(petPrice({ id: 'robot_red', species: 'robot', currency: 'coin' })).toBe(100);
  });

  it('프리즘 펫은 30, 드래곤·골렘·미믹은 50', () => {
    expect(petPrice({ id: 'cat_rainbow', species: 'cat', currency: 'prism' })).toBe(
      PRISM_PET_PRICE
    );
    expect(petPrice({ id: 'dragon_ember', species: 'dragon', currency: 'prism' })).toBe(
      LEGENDARY_PET_PRICE
    );
  });

  it('코인 펫의 모든 종이 가격표에 있다 (새 종을 추가하면 가격도 정해야 한다)', () => {
    for (const pet of PETS.filter((p) => p.currency === 'coin')) {
      expect(COIN_PET_PRICE[pet.species]).toBeDefined();
    }
  });
});

describe('petPurchaseBlock', () => {
  const white = { id: 'cat_white', species: 'cat', currency: 'coin' as const };
  const rainbow = { id: 'cat_rainbow', species: 'cat', currency: 'prism' as const };

  it('코인 펫은 코인으로, 프리즘 펫은 프리즘으로 판단한다', () => {
    expect(petPurchaseBlock({ coins: 40, prisms: 0 }, ['cat_orange'], white)).toBeNull();
    expect(petPurchaseBlock({ coins: 39, prisms: 99 }, ['cat_orange'], white)).toBe(
      'not_enough_coins'
    );
    expect(petPurchaseBlock({ coins: 999, prisms: 29 }, ['cat_orange'], rainbow)).toBe(
      'not_enough_prisms'
    );
    expect(petPurchaseBlock({ coins: 0, prisms: 30 }, ['cat_orange'], rainbow)).toBeNull();
  });

  it('이미 가졌거나 없는 펫이면 막는다', () => {
    expect(petPurchaseBlock({ coins: 999, prisms: 99 }, ['cat_white'], white)).toBe(
      'already_owned'
    );
    expect(petPurchaseBlock({ coins: 999, prisms: 99 }, [], undefined)).toBe('unknown_pet');
  });
});

describe('exchangeBlock', () => {
  it('정해진 묶음만, 프리즘이 있을 때만 바꾼다', () => {
    expect(exchangeBlock(5, 5)).toBeNull();
    expect(exchangeBlock(4, 5)).toBe('not_enough_prisms');
    expect(exchangeBlock(99, 3)).toBe('invalid');
  });
});

describe('PRISM_PACKS', () => {
  it('큰 묶음일수록 보너스가 커진다 (10개 1,000원 기준)', () => {
    expect(PRISM_PACKS.map(packBonusPercent)).toEqual([0, 20, 30, 40]);
  });

  it('id가 겹치지 않는다 (스토어 상품 id로 쓴다)', () => {
    expect(new Set(PRISM_PACKS.map((p) => p.id)).size).toBe(PRISM_PACKS.length);
  });
});
