# Daon-code

바이브코딩하는 사람을 위한 코드 읽기 학습 앱 (Expo + React Native)

## 현재 상태 — Phase 0~2 완료

```
✅ Phase 0  프로젝트 뼈대, TypeScript strict, 폴더 구조
✅ Phase 1  Expo Router 배선, 홈 → 레슨 화면 흐름
✅ Phase 2  로컬 콘텐츠 + 문제 4유형 렌더링
🔶 Phase 3  Supabase 연동 — 이메일/익명 로그인 완료, 구글·카카오 남음
⬜ Phase 4  submitAnswer Edge Function
⬜ Phase 5  복습 시스템 (라이트너 박스)
⬜ Phase 6  푸시 알림, EAS Update
⬜ Phase 7  콘텐츠 40레슨 채우기
⬜ Phase 8  출시 준비
```

## 실행

```bash
npm install
cp .env.example .env     # Supabase URL / anon key 입력
npx expo start
```

Expo Go 앱으로 QR을 찍으면 실물 기기에서 바로 확인할 수 있습니다.

### Supabase 사전 설정 (최초 1회)

1. **SQL Editor**에서 `supabase/migrations/0001_init.sql` 실행
   → 테이블 5개 + RLS 정책 + XP 변경 차단 트리거 생성
2. **Authentication → Providers**
   - Email 활성화 (기본 켜짐)
   - **Anonymous sign-ins 활성화** ← 기본이 꺼져 있어 반드시 켜야 "나중에 하기"가 동작

## 폴더 구조

```
app/                  Expo Router — 라우팅 배선만, 로직 없음
features/             기능 단위 (협업 경계)
  lesson/
    domain/           타입 + 채점/XP/스트릭 순수 함수
    data/             콘텐츠 로더 (로컬 JSON)
    hooks/            useLesson
    components/       문제 4유형 + 피드백 배너
    screens/          홈 / 레슨풀이 / 결과
  auth/
    AuthContext.tsx   로그인 상태 전역 공유 (isGuest 판별 포함)
    authActions.ts    익명/이메일 로그인, 게스트→정식 계정 연결
    screens/
  review/ profile/ onboarding/
shared/               여러 기능이 함께 쓰는 것
  components/ hooks/ lib/ theme/
content/              레슨·문제 원본 (JSON)
supabase/             마이그레이션, Edge Functions
scripts/              콘텐츠 변환 스크립트
```

## 핵심 설계 결정

**게스트는 계정을 새로 만들지 않고 "연결"한다**
게스트가 로그인할 때 `signUp`을 하면 다른 user_id가 발급되어 진도가 끊긴다.
그래서 `updateUser`로 기존 익명 계정에 이메일을 붙이는 방식을 쓴다(`upgradeGuestToEmail`).
user_id가 유지되므로 progress·XP가 그대로 따라온다.

**콘텐츠 원본은 로컬 JSON**
`content/` 폴더가 원본이고 앱에 번들됩니다. Supabase에 콘텐츠 테이블을 두지 않습니다.
오프라인에서도 동작하고, EAS Update로 스토어 심사 없이 갱신합니다.

**채점은 서버가 최종 결정**
`features/lesson/domain/`의 순수 함수는 화면에 즉시 피드백을 주기 위한 클라이언트 계산이고,
실제 XP 지급은 Phase 4의 submitAnswer Edge Function이 다시 계산해 확정합니다.
클라이언트가 `progress`/`daily_xp`에 직접 쓰지 못하도록 RLS로 막습니다.

**순서 맞추기는 탭 방식**
드래그는 작은 화면에서 손가락에 카드가 가려지고 오조작이 잦아, 탭으로 올리고 내리는 방식을 씁니다(듀오링고와 동일).

**코드 비교는 4줄 제한**
비교는 스크롤 없이 한눈에 봐야 의미가 있어서, 한 블록당 4줄을 넘기면 개발 중 콘솔 경고가 뜹니다.

## 알려진 미구현 (Phase 4에서 처리)

**레슨을 완료해도 진도가 서버에 저장되지 않습니다.** `submitAnswer` Edge Function이
아직 없어서, 현재는 홈 화면의 잠금 상태가 갱신되지 않고 첫 레슨만 열려 있습니다.
XP·스트릭도 화면상 예상치만 보여주고 실제로 적립되지 않습니다.

## 검증된 도메인 로직

`features/lesson/domain/`의 계산 규칙은 아래 케이스로 확인했습니다.

- 정식계정 만점 + 하루목표 달성 → 35 XP
- 게스트(익명) 만점 → 12 XP (80% 적용)
- 이미 완료한 레슨 재도전 → 0 XP
- 게스트 48XP 상태에서 로그인 → 12XP 보너스 환급
- 스트릭: 같은 날 유지 / 어제 +1 / 하루 빠짐+프리즈 방어 / 프리즈 없으면 리셋

## 문서

- `Daon-code_기획서_v2.md` — 커리큘럼, DB 스키마, 온보딩, 아키텍처 원칙
- `Daon-code_제작플랜.md` — 레이어 구조, 폴더 규칙, Phase별 빌드 순서
