#!/usr/bin/env node
/*
 * content/questions/*.json 목록으로 QUESTION_BANK 파일 두 개를 생성한다.
 *
 *   features/lesson/data/questionBank.generated.ts      — 앱(Metro)용
 *   supabase/functions/_shared/questionBank.generated.ts — Edge Function(Deno)용
 *
 * Deno는 JSON import에 `with { type: 'json' }`이 필요하고 Metro는 그 문법을
 * 지원하지 않아서 파일을 런타임별로 나눈다. 손으로 두 곳에 import를 추가하다가
 * 서버 쪽이 빠지는 일을 막기 위해 생성 스크립트로 관리한다.
 *
 *   npm run gen:content          생성
 *   npm run gen:content -- --check  생성 결과와 다르면 실패 (배포 전 확인용)
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const questionsDir = join(root, 'content/questions');

const lessonIds = readdirSync(questionsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.slice(0, -'.json'.length))
  .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

const ident = (id) => `q_${id.replace(/[^A-Za-z0-9]/g, '_')}`;

function render(relPrefix, importSuffix) {
  const header = [
    '// 자동 생성 파일 — 직접 수정하지 말 것. `npm run gen:content`로 다시 만든다.',
    '// 원본: content/questions/*.json (scripts/gen-question-bank.mjs)',
    '',
  ];
  const imports = lessonIds.map(
    (id) => `import ${ident(id)} from '${relPrefix}content/questions/${id}.json'${importSuffix};`,
  );
  const entries = lessonIds.map((id) => `  '${id}': ${ident(id)},`);
  return [
    ...header,
    ...imports,
    '',
    'export const QUESTION_BANK: Record<string, unknown> = {',
    ...entries,
    '};',
    '',
  ].join('\n');
}

const targets = [
  { path: 'features/lesson/data/questionBank.generated.ts', content: render('../../../', '') },
  {
    path: 'supabase/functions/_shared/questionBank.generated.ts',
    content: render('../../../', " with { type: 'json' }"),
  },
];

const check = process.argv.includes('--check');
let stale = false;
for (const { path, content } of targets) {
  const abs = join(root, path);
  const current = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
  if (current === content) continue;
  if (check) {
    console.error(`최신 아님: ${path} — npm run gen:content 실행 필요`);
    stale = true;
  } else {
    writeFileSync(abs, content);
    console.log(`생성: ${path} (${lessonIds.length}개 레슨)`);
  }
}
if (stale) process.exit(1);
if (check) console.log(`최신 상태 (${lessonIds.length}개 레슨)`);
