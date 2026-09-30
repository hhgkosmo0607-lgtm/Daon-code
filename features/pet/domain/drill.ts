/*
 * 출석 드릴 연출 — 하늘에서 드릴이 내려와 땅을 파고, 크리스탈 조각이 튀어 오른다.
 * 원본: assets/pixel_pets_png/pixel_pets/1x/effects/attendance_drill_sequence.png (가로 20프레임, 128×32)
 * 빌드 스크립트가 5열 격자로 다시 편다 (scripts/build-pet-assets.mjs의 REGRID와 같아야 한다).
 * 펫과 상관없는 연출이라 어떤 펫을 가졌든 똑같이 나온다.
 */

export const DRILL = {
  frameW: 128,
  frameH: 32,
  cols: 5,
  frames: 20,
  frameMs: 80,
  sheetW: 640,
  sheetH: 128,
} as const;

/** 격자에서 i번째 프레임의 위치 (도트) */
export function drillFrameOrigin(i: number): { x: number; y: number } {
  const f = Math.max(0, Math.min(DRILL.frames - 1, i));
  return { x: (f % DRILL.cols) * DRILL.frameW, y: Math.floor(f / DRILL.cols) * DRILL.frameH };
}
