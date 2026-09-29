import { describe, expect, it } from 'vitest';
import { PRISM_CAT_PRICE, catPrice, catPurchaseBlock } from './shopItems';

describe('catPrice', () => {
  it('코인 고양이는 40에서 10씩 오르고, 6마리 전부 390', () => {
    expect(catPrice('coin', 1)).toBe(40);
    expect(catPrice('coin', 6)).toBe(90);
    const total = [1, 2, 3, 4, 5, 6].reduce((sum, n) => sum + catPrice('coin', n), 0);
    expect(total).toBe(390);
  });

  it('프리즘 고양이는 가진 수와 상관없이 고정', () => {
    expect(catPrice('prism', 1)).toBe(PRISM_CAT_PRICE);
    expect(catPrice('prism', 7)).toBe(PRISM_CAT_PRICE);
  });
});

describe('catPurchaseBlock', () => {
  const pink = { id: 'pink', currency: 'coin' as const };
  const rainbow = { id: 'rainbow', currency: 'prism' as const };

  it('코인 고양이는 코인으로, 프리즘 고양이는 프리즘으로 판단한다', () => {
    expect(catPurchaseBlock({ coins: 40, prisms: 0 }, ['orange'], pink, 1)).toBeNull();
    expect(catPurchaseBlock({ coins: 39, prisms: 99 }, ['orange'], pink, 1)).toBe(
      'not_enough_coins'
    );
    expect(
      catPurchaseBlock({ coins: 999, prisms: PRISM_CAT_PRICE - 1 }, ['orange'], rainbow, 1)
    ).toBe('not_enough_prisms');
    expect(
      catPurchaseBlock({ coins: 0, prisms: PRISM_CAT_PRICE }, ['orange'], rainbow, 1)
    ).toBeNull();
  });

  it('이미 가졌거나 없는 고양이면 막는다', () => {
    expect(catPurchaseBlock({ coins: 999, prisms: 99 }, ['orange', 'pink'], pink, 2)).toBe(
      'already_owned'
    );
    expect(catPurchaseBlock({ coins: 999, prisms: 99 }, [], undefined, 0)).toBe('unknown_cat');
  });
});
