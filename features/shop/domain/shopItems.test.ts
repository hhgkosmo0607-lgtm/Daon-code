import { describe, expect, it } from 'vitest';
import {
  catPrice,
  FREEZE_MAX,
  FREEZE_PRICE,
  catPurchaseBlock,
  freezePurchaseBlock,
} from './shopItems';

describe('freezePurchaseBlock', () => {
  it('코인이 충분하고 보유 한도 전이면 살 수 있다', () => {
    expect(freezePurchaseBlock(FREEZE_PRICE, 0)).toBeNull();
  });

  it('코인이 모자라면 not_enough_coins', () => {
    expect(freezePurchaseBlock(FREEZE_PRICE - 1, 0)).toBe('not_enough_coins');
  });

  it('이미 최대 개수면 코인이 많아도 max_reached', () => {
    expect(freezePurchaseBlock(999, FREEZE_MAX)).toBe('max_reached');
  });
});

describe('catPurchaseBlock', () => {
  const valid = ['orange', 'pink'];

  it('안 가진 고양이를 코인이 충분하면 살 수 있다', () => {
    expect(catPurchaseBlock(catPrice(1), ['orange'], 'pink', valid)).toBeNull();
  });

  it('이미 가진 고양이는 already_owned', () => {
    expect(catPurchaseBlock(999, ['orange'], 'orange', valid)).toBe('already_owned');
  });

  it('코인이 모자라면 not_enough_coins', () => {
    expect(catPurchaseBlock(catPrice(1) - 1, ['orange'], 'pink', valid)).toBe('not_enough_coins');
  });

  it('없는 고양이는 unknown_cat', () => {
    expect(catPurchaseBlock(999, [], 'dragon', valid)).toBe('unknown_cat');
  });
});

describe('catPrice', () => {
  it('두 번째 80에서 한 마리마다 40씩 오르고, 8마리 전부 1,400', () => {
    expect(catPrice(1)).toBe(80);
    expect(catPrice(7)).toBe(320);
    const total = [1, 2, 3, 4, 5, 6, 7].reduce((sum, n) => sum + catPrice(n), 0);
    expect(total).toBe(1400);
  });
});
