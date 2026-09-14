const expoConfig = require('eslint-config-expo/flat');
module.exports = [
  ...expoConfig,
  // supabase/functions는 Deno 런타임 코드라 npm:/jsr: 임포트 등 RN용 ESLint가
  // 이해 못 하는 문법을 쓴다. `supabase functions deploy`가 실제 검증 도구다.
  { ignores: ['dist/*', '.expo/*', 'node_modules/*', 'supabase/functions/*'] },
];
