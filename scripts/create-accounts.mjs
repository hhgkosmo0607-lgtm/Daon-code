#!/usr/bin/env node
/*
 * 테스트 계정·운영자 계정 만들기 (0007_prisms.sql 적용 뒤 한 번).
 *
 *   node scripts/create-accounts.mjs
 *
 *   테스트 계정  daon.test@example.com   — 일반 사용자와 똑같다
 *   운영자 계정  daon.admin@example.com  — 코인·프리즘 가득 + 앱에 🛠 테스트 메뉴 (is_admin)
 *
 * 비밀번호는 실행할 때마다 새로 만들어서 화면에만 한 번 보여준다 (파일·저장소에 남기지 않는다).
 * 이미 있는 계정이면 비밀번호를 새로 바꾸고, 운영자 설정을 다시 채운다.
 * Supabase CLI 로그인 상태에서 service_role 키를 가져와 Auth Admin API를 부른다.
 */
import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';

const ref = readFileSync('supabase/.temp/project-ref', 'utf8').trim();
const url = `https://${ref}.supabase.co`;

const keys = JSON.parse(
  execSync(`npx -y supabase@latest projects api-keys --project-ref ${ref} -o json`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
);
const serviceKey = keys.find((k) => k.name === 'service_role')?.api_key;
if (!serviceKey) throw new Error('service_role 키를 못 가져왔어요 (npx supabase login 필요)');

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
};

async function call(method, path, body) {
  const res = await fetch(`${url}${path}`, { method, headers, body: body && JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

/** 계정을 만들거나(있으면 비밀번호만 바꾸고) user id를 돌려준다 */
async function upsertUser(email, password) {
  const list = await call('GET', `/auth/v1/admin/users?per_page=1000`);
  const existing = list.users.find((u) => u.email === email);
  if (existing) {
    await call('PUT', `/auth/v1/admin/users/${existing.id}`, { password, email_confirm: true });
    return existing.id;
  }
  const created = await call('POST', '/auth/v1/admin/users', {
    email,
    password,
    email_confirm: true,
    app_metadata: { provider: 'email' },
  });
  return created.id;
}

const password = () => randomBytes(9).toString('base64url');

const accounts = [
  { email: 'daon.test@example.com', label: '테스트 계정 (일반 사용자)', profile: null },
  {
    email: 'daon.admin@example.com',
    label: '운영자 계정 (재화 가득 + 🛠 테스트 메뉴)',
    profile: { is_admin: true, coins: 99_999, prisms: 9_999 },
  },
];

for (const account of accounts) {
  const pw = password();
  const id = await upsertUser(account.email, pw);
  if (account.profile) {
    // 프로필은 가입 트리거가 만든다. service_role이라 가드 트리거를 통과한다.
    await call('PATCH', `/rest/v1/profiles?id=eq.${id}`, account.profile);
  }
  console.log(`${account.label}\n  이메일   ${account.email}\n  비밀번호 ${pw}\n`);
}
console.log('비밀번호는 지금 한 번만 보여요. 따로 적어 두세요.');
