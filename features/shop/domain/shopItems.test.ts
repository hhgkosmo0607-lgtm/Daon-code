import { describe, expect, it } from 'vitest';
import { FREEZE_MAX, FREEZE_PRICE, freezePurchaseBlock } from './shopItems';

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
