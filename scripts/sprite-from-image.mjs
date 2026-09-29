#!/usr/bin/env node
/*
 * 도트 이미지(PNG) → 펫 도트 데이터('#'/'.' 문자열 배열) 변환기.
 *
 *   node scripts/sprite-from-image.mjs <이미지.png> [격자크기=16]
 *
 * 이미지 생성 AI가 만든 스프라이트 시트(흰 배경 위 검은 도트, 가로로 여러 프레임)를
 * 프레임별로 잘라서, 각 프레임을 격자크기×격자크기 칸으로 나눠 칸 안에 어두운 픽셀이
 * 절반 이상이면 '#'로 찍는다. 결과를 features/pet/domain/pets.ts에 붙여 넣고 손으로 다듬는다.
 * 외부 패키지 없이 쓰려고 PNG(8비트, 비인터레이스)만 직접 읽는다.
 */
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

function decodePng(buf) {
  let pos = 8;
  let width = 0, height = 0, colorType = 0, bitDepth = 0, palette = null;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error('인터레이스 PNG는 지원하지 않아요');
    } else if (type === 'PLTE') palette = data;
    else if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  if (bitDepth !== 8) throw new Error(`8비트 PNG만 지원해요 (지금 ${bitDepth}비트)`);
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const px = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const cur = raw[y * (stride + 1) + 1 + x];
      const a = x >= channels ? px[y * stride + x - channels] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= channels && y > 0 ? px[(y - 1) * stride + x - channels] : 0;
      let v = cur;
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[y * stride + x] = v & 0xff;
    }
  }
  // 픽셀마다 "어둡고 불투명한가"만 남긴다
  const dark = (x, y) => {
    const o = y * stride + x * channels;
    let r, g, bl, alpha = 255;
    if (colorType === 3) [r, g, bl] = palette.subarray(px[o] * 3, px[o] * 3 + 3);
    else if (colorType === 0 || colorType === 4) r = g = bl = px[o];
    else [r, g, bl] = [px[o], px[o + 1], px[o + 2]];
    if (colorType === 4) alpha = px[o + 1];
    if (colorType === 6) alpha = px[o + 3];
    return alpha > 128 && (r + g + bl) / 3 < 128;
  };
  return { width, height, dark };
}

/** 어두운 픽셀이 하나도 없는 세로줄을 경계로 프레임을 나눈다 */
function splitFrames({ width, height, dark }) {
  const colHas = Array.from({ length: width }, (_, x) => {
    for (let y = 0; y < height; y++) if (dark(x, y)) return true;
    return false;
  });
  const frames = [];
  for (let x = 0; x < width; ) {
    if (!colHas[x]) { x++; continue; }
    const start = x;
    while (x < width && colHas[x]) x++;
    frames.push([start, x - 1]);
  }
  // 한 프레임 안의 작은 틈(눈과 몸 사이 등)으로 잘못 쪼개진 조각을 합친다
  const minGap = Math.max(4, width * 0.01);
  const merged = [];
  for (const f of frames) {
    const last = merged.at(-1);
    if (last && f[0] - last[1] < minGap) last[1] = f[1];
    else merged.push([...f]);
  }
  return merged;
}

function frameToSprite(img, [x0, x1], grid) {
  let y0 = img.height, y1 = -1;
  for (let y = 0; y < img.height; y++)
    for (let x = x0; x <= x1; x++) if (img.dark(x, y)) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  // 정사각형 격자 — 긴 변 기준으로 칸 크기를 정하고, 짧은 쪽은 가운데 정렬
  const side = Math.max(x1 - x0 + 1, y1 - y0 + 1);
  const cell = side / grid;
  const ox = x0 - (side - (x1 - x0 + 1)) / 2;
  const oy = y0 - (side - (y1 - y0 + 1));  // 발이 바닥에 닿게 아래 정렬
  const rows = [];
  for (let gy = 0; gy < grid; gy++) {
    let row = '';
    for (let gx = 0; gx < grid; gx++) {
      let on = 0, total = 0;
      for (let y = Math.floor(oy + gy * cell); y < Math.floor(oy + (gy + 1) * cell); y++)
        for (let x = Math.floor(ox + gx * cell); x < Math.floor(ox + (gx + 1) * cell); x++) {
          total++;
          if (y >= 0 && x >= 0 && x < img.width && y < img.height && img.dark(x, y)) on++;
        }
      row += total > 0 && on * 2 >= total ? '#' : '.';
    }
    rows.push(row);
  }
  return rows;
}

const [file, gridArg] = process.argv.slice(2);
if (!file) {
  console.error('사용법: node scripts/sprite-from-image.mjs <이미지.png> [격자크기=16]');
  process.exit(1);
}
const img = decodePng(readFileSync(file));
const frames = splitFrames(img);
console.log(`// ${file} — 프레임 ${frames.length}개, ${gridArg ?? 16}칸 격자`);
frames.forEach((f, i) => {
  const sprite = frameToSprite(img, f, Number(gridArg ?? 16));
  console.log(`// prettier-ignore\nconst frame${i + 1}: Sprite = [\n${sprite.map((r) => `  '${r}',`).join('\n')}\n];`);
});
