import { describe, expect, it } from 'vitest';
import { DRILL, drillFrameOrigin } from './drill';

describe('drillFrameOrigin', () => {
  it('5열 격자에서 프레임 위치를 찾는다', () => {
    expect(drillFrameOrigin(0)).toEqual({ x: 0, y: 0 });
    expect(drillFrameOrigin(6)).toEqual({ x: 128, y: 32 });
    expect(drillFrameOrigin(19)).toEqual({ x: 512, y: 96 });
  });

  it('범위를 벗어나면 첫·마지막 프레임', () => {
    expect(drillFrameOrigin(-1)).toEqual(drillFrameOrigin(0));
    expect(drillFrameOrigin(99)).toEqual(drillFrameOrigin(DRILL.frames - 1));
  });

  it('격자 크기가 프레임 수와 맞는다', () => {
    expect(DRILL.sheetW).toBe(DRILL.frameW * DRILL.cols);
    expect(DRILL.sheetH).toBe(DRILL.frameH * Math.ceil(DRILL.frames / DRILL.cols));
  });
});
