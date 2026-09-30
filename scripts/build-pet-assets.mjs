#!/usr/bin/env node
/*
 * 펫 도트 이미지 → 앱용 에셋 변환.
 *
 *   node scripts/build-pet-assets.mjs
 *
 * assets/pixel_pets_png/pixel_pets/1x/ 의 원본(도트 1칸 = 1px)을 최근접 보간으로 키워서
 * assets/pets/ 에 name.png(2배) · name@2x.png(4배) · name@3x.png(6배)로 저장한다.
 * 앱은 도트 1칸을 2dp로 그리는데(ART_SCALE), 기기 화면 밀도에 맞는 파일을 RN이 골라서
 * 도트 1칸이 항상 정수 개의 실제 픽셀에 맞는다 → 확대해도 흐려지지 않는다.
 * 원본은 1x 아래 characters/free · characters/premium · effects · spaces 폴더에 나눠 둔다.
 * 새 펫을 추가하면 원본을 알맞은 폴더에 넣고 이 스크립트를 다시 돌리면 된다.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { inflateSync, deflateSync } from 'node:zlib';

function readPng(file) {
  const buf = readFileSync(file);
  let pos = 8,
    width = 0,
    height = 0,
    ct = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      ct = data[9];
      if (data[8] !== 8 || data[12] !== 0) throw new Error('unsupported png ' + file);
    }
    if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const ch = { 2: 3, 6: 4 }[ct];
  if (!ch) throw new Error('color type ' + ct);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * ch;
  const px = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const cur = raw[y * (stride + 1) + 1 + x];
      const a = x >= ch ? px[y * stride + x - ch] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= ch && y > 0 ? px[(y - 1) * stride + x - ch] : 0;
      let v = cur;
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c,
          pa = Math.abs(p - a),
          pb = Math.abs(p - b),
          pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[y * stride + x] = v & 0xff;
    }
  }
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = px[i * ch];
    rgba[i * 4 + 1] = px[i * ch + 1];
    rgba[i * 4 + 2] = px[i * ch + 2];
    rgba[i * 4 + 3] = ch === 4 ? px[i * ch + 3] : 255;
  }
  return { width, height, rgba };
}

const crcT = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcT[n] = c >>> 0;
}
const crc = (b) => {
  let r = 0xffffffff;
  for (const x of b) r = crcT[(r ^ x) & 0xff] ^ (r >>> 8);
  return (r ^ 0xffffffff) >>> 0;
};
const chunk = (t, d) => {
  const l = Buffer.alloc(4);
  l.writeUInt32BE(d.length);
  const td = Buffer.concat([Buffer.from(t), d]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([l, td, c]);
};

function writePng(file, { width, height, rgba }) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++)
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ])
  );
}

function scaleNearest(img, k) {
  const W = img.width * k,
    H = img.height * k,
    out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      img.rgba.copy(
        out,
        (y * W + x) * 4,
        (Math.floor(y / k) * img.width + Math.floor(x / k)) * 4,
        (Math.floor(y / k) * img.width + Math.floor(x / k)) * 4 + 4
      );
  return { width: W, height: H, rgba: out };
}

const SRC = 'assets/pixel_pets_png/pixel_pets/1x';
const OUT = 'assets/pets';
/** 도트 1칸 = ART_SCALE dp (features/pet/domain/catSheet.ts와 같아야 한다) */
const ART_SCALE = 2;

/*
 * 가로로 아주 긴 연출 시트는 격자로 다시 편다. 6배로 키우면 폭이 1만 px를 넘어서
 * 안드로이드가 한 장으로 못 그리기 때문이다 (보통 최대 4096px).
 * 앱 쪽 프레임 계산은 features/pet/domain/drill.ts와 맞춘다.
 */
const REGRID = {
  attendance_drill_sequence: { frameW: 128, frameH: 32, cols: 5 },
};

function regrid(img, { frameW, frameH, cols }) {
  const frames = Math.floor(img.width / frameW);
  const rows = Math.ceil(frames / cols);
  const W = frameW * cols,
    H = frameH * rows,
    out = Buffer.alloc(W * H * 4);
  for (let f = 0; f < frames; f++) {
    const ox = (f % cols) * frameW,
      oy = Math.floor(f / cols) * frameH;
    for (let y = 0; y < frameH; y++) {
      img.rgba.copy(
        out,
        ((oy + y) * W + ox) * 4,
        (y * img.width + f * frameW) * 4,
        (y * img.width + (f + 1) * frameW) * 4
      );
    }
  }
  return { width: W, height: H, rgba: out };
}

/** 하위 폴더(characters/free, characters/premium, effects, spaces)까지 png를 모은다 */
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${dir}/${e.name}`) : e.name.endsWith('.png') ? [`${dir}/${e.name}`] : []
  );
}

mkdirSync(OUT, { recursive: true });
// 앱은 폴더 없이 이름으로만 부른다 — 이름이 겹치면 안 된다
const files = walk(SRC).filter((f) => !f.endsWith('/preview.png'));
const seen = new Set();
for (const file of files) {
  const name = file
    .split('/')
    .pop()
    .replace(/\.png$/, '');
  if (seen.has(name)) throw new Error(`이름이 겹쳐요: ${name}`);
  seen.add(name);
  let img = readPng(file);
  if (REGRID[name]) img = regrid(img, REGRID[name]);
  writePng(`${OUT}/${name}.png`, scaleNearest(img, ART_SCALE));
  writePng(`${OUT}/${name}@2x.png`, scaleNearest(img, ART_SCALE * 2));
  writePng(`${OUT}/${name}@3x.png`, scaleNearest(img, ART_SCALE * 3));
}
console.log(`${seen.size}개 → ${OUT} (2x/4x/6x)`);
