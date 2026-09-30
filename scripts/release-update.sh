#!/usr/bin/env bash
# 콘텐츠/JS 변경을 빌드 없이 배포한다 (EAS Update).
#
#   npm run release -- preview "오타 수정"
#   npm run release -- production "새 레슨 3개 추가"
#
# 순서가 중요하다: 서버(Edge Function)가 새 레슨·정답을 먼저 알아야
# 업데이트를 받은 앱에서 제출해도 400 없이 채점된다.
#   1. QUESTION_BANK 재생성
#   2. 타입체크·테스트
#   3. Edge Function 재배포 (채점 기준 동기화)
#   4. EAS Update 발행
#
# 네이티브 변경(라이브러리 추가, app.json 권한·아이콘 등)은 업데이트로 못 보낸다.
# runtimeVersion이 fingerprint라서, 그런 변경이 있으면 기존 빌드는 이 업데이트를
# 받지 않는다 — 새로 빌드해야 한다.
set -euo pipefail

CHANNEL="${1:-preview}"
MESSAGE="${2:-콘텐츠 업데이트}"
PROJECT_REF="fjtjoqdsrndnemhiqbmc"

cd "$(dirname "$0")/.."

# expo-updates가 node_modules에 없으면 EAS가 fingerprint를 계산하지 못하고
# runtimeVersion을 "file:fingerprint"로 발행해서, 설치된 앱이 업데이트를 받지 못한다.
if [ ! -d node_modules/expo-updates ]; then
  echo "▶ node_modules가 package-lock.json과 달라서 npm ci 실행"
  npm ci
fi

echo "▶ 1/4 QUESTION_BANK 재생성"
npm run -s gen:content

echo "▶ 2/4 타입체크·테스트"
npx tsc --noEmit
npm test --silent

# --use-api: Windows에서 Docker 번들링이 ENAMETOOLONG으로 실패해서 서버에서 번들링한다
echo "▶ 3/4 Edge Function 재배포"
npx -y supabase functions deploy submit-answer --project-ref "$PROJECT_REF" --use-api
npx -y supabase functions deploy complete-placement --project-ref "$PROJECT_REF" --use-api
npx -y supabase functions deploy purchase --project-ref "$PROJECT_REF" --use-api
npx -y supabase functions deploy repair-streak --project-ref "$PROJECT_REF" --use-api
npx -y supabase functions deploy collect-mining --project-ref "$PROJECT_REF" --use-api
npx -y supabase functions deploy admin-tools --project-ref "$PROJECT_REF" --use-api
npx -y supabase functions deploy set-team --project-ref "$PROJECT_REF" --use-api

echo "▶ 4/4 EAS Update 발행 (channel: $CHANNEL)"
npx -y eas-cli@latest update --channel "$CHANNEL" --environment "$CHANNEL" --message "$MESSAGE" --non-interactive

echo "✔ 완료 — 앱을 껐다 켜면 다음 실행부터 반영돼요."
