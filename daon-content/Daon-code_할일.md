# Daon-code 할 일 정리

> 이번 세션에서 한 일 + 보류 중인 것 + 다음에 할 일.
> 다른 문서(README, 기획서, 제작플랜)와 겹치는 내용은 요약만 하고 상세는 그쪽을 참고하세요.

---

## 1. 이번 세션에서 한 일

### 테마 시스템 구현 (완료 — 웹 화면 확인 중)

사용자가 `themes/` 폴더에 `themes.ts`(터미널 컨셉 10종: 다크 5 + 라이트 5)와 전달 가이드
문서를 넣어두고 "확인 후 구현"을 요청했습니다. 가이드에 적힌 요구사항 그대로 구현했습니다.

| 파일 | 내용 |
|---|---|
| `shared/theme/themes.ts` | (이동됨) 테마 10종 정의 — `THEMES`, `getDefaultThemeId`, `SHOP_THEME_ORDER` |
| `shared/theme/ThemeContext.tsx` (신규) | `ThemeProvider` + `useTheme()` — 선택 테마 전역 상태 |
| `shared/theme/theme.ts` | `colors` 상수 제거 (테마별로 값이 달라져서), `spacing`/`radius`는 유지 |
| `app/_layout.tsx` | `ThemeProvider`로 전체 앱을 감쌈, `StatusBar`·`Stack` 배경을 테마에 맞게 동적으로 |
| 14개 화면/컴포넌트 | `colors.xxx` 하드코딩 전부 `useTheme()`으로 교체 (아래 상세) |

**동작 방식**:
- 한 번도 테마를 직접 고른 적 없으면 시스템 다크모드를 실시간으로 따라감 (다크→Dracula, 라이트→Alucard)
- 한 번이라도 직접 고르면 AsyncStorage(`daon_theme_id`)에 저장, 이후엔 시스템 모드가 바뀌어도 유지
- 테마 선택 UI(상점 화면)는 이번에 만들지 않음 — `setThemeId()` 함수까지만 준비됨. 상점 화면은 아직 없음

**색상 키 매핑 (기존 → 신규)**: 기존 `theme.ts`의 `primary`/`accent`가 신규 테마에서
`accent` 하나로 합쳐지고(선택된 보기·진행바·현재 진행 표시 ▶ 전부 accent), `card`는
`surface`로 이름만 바뀌었습니다. 정답/오답 배경처럼 기존에 `'#EAF9F0'`/`'#FDECEA'` 같은
라이트 모드 전용 파스텔 색을 하드코딩했던 곳은 `` `${colors.success}22` ``/`` `${colors.error}22` ``
식으로 테마 색상에 알파(hex 2자리)를 붙여 다크/라이트 어디서나 자연스럽게 보이도록 바꿨습니다.

**의도적으로 그대로 둔 것**: `CodeBlock.tsx`와 `QuestionCompare.tsx`의 코드 블록 배경(`#1E2430`
고정)은 "실제 터미널처럼 항상 어둡게" 유지하는 게 코드 가독성에 낫다고 판단해 테마화하지 않았습니다.

**테마 선택 화면 (완료)**: 사용자가 "상점 말고 선택창"을 요청해서, 가격/구매 개념 없이
10종 전부 바로 고를 수 있는 화면을 만들었습니다.

| 파일 | 내용 |
|---|---|
| `features/theme/screens/ThemeScreen.tsx` (신규) | 테마 10종 목록 — 배경/accent/success/error 미리보기 스와치 + 선택 시 ✓ 표시 |
| `app/settings/theme.tsx` (신규) | 라우트 등록 (모달로 표시) |
| `app/_layout.tsx` | `Stack.Screen name="settings/theme"` 추가 |
| `features/lesson/screens/HomeScreen.tsx` | 상단바에 🎨 버튼 추가 → 누르면 테마 선택 화면으로 이동 |

`free`/`SHOP_THEME_ORDER` 필드는 나중에 유료화를 붙일 때 이 화면 위에 잠금만 얹으면 되도록
`themes.ts`에 그대로 남겨뒀고, 지금은 참조하지 않습니다.

**아직 안 한 것**:
- [ ] D2Coding 폰트 적용 — 가이드에 방법은 있지만, 폰트 파일(`assets/fonts/D2Coding-*.ttf`)을
      사용자가 아직 넣지 않아서 보류. 파일만 넣어주면 `expo-font`로 로드하는 코드는 바로 추가 가능
- [ ] 실기기/에뮬레이터에서 다크·라이트 테마 전환과 테마 선택 화면이 실제로 잘 보이는지 눈으로 확인
      (웹 빌드는 확인함 — entry bundle에 ThemeScreen 포함, 에러 없음)
- [ ] 유료화(상점) — 지금은 전부 무료로 즉시 선택 가능. 나중에 필요해지면 `free` 필드로 잠금 추가

**검증**: `tsc`/`eslint`/`test`(27/27) 전부 통과. `npx expo start --web`으로 기동해서
entry bundle에 새 라우트/화면이 포함되고 에러 없이 번들링되는 것 확인.

### Phase 4 — submitAnswer Edge Function (코드 작성 완료)

레슨을 다 풀면 **서버가** 채점하고 XP·스트릭·진도를 확정하도록 만들었습니다. 그동안은
레슨을 풀어도 저장이 안 됐던 상태였는데, 그 부분을 채운 겁니다.

| 파일 | 내용 |
|---|---|
| `supabase/functions/submit-answer/index.ts` | 채점 → XP 계산 → 진도/스트릭/일일XP/오답노트 갱신 → 다음 레슨 잠금 해제 |
| `supabase/functions/_shared/content.ts` | Edge Function이 채점 기준으로 쓰는 정답 원본 로더 |
| `shared/lib/edgeFunctions.ts` | 클라이언트에서 Edge Function을 호출하는 함수 |
| `features/lesson/hooks/useSubmitLesson.ts` | 제출 상태(로딩/완료/에러) 관리 훅 |
| `features/lesson/hooks/useLesson.ts` | 문제별 제출 답안을 모아서 서버에 보낼 수 있게 수정 |
| `features/lesson/screens/LessonScreen.tsx` | 레슨 종료 시 자동 제출 + 로딩/에러/재시도 화면 |
| `features/lesson/screens/LessonResultScreen.tsx` | 클라이언트 추정치 대신 서버가 확정한 XP·스트릭 표시 |
| `features/auth/AuthContext.tsx` | **임시 조치**: 온보딩이 없어 세션을 만들 방법이 없어서, 세션이 없으면 앱 시작 시 자동으로 게스트(익명) 로그인 |

**중요한 설계 포인트**: 채점·XP·스트릭 규칙(`features/lesson/domain/scoring.ts`, `streak.ts`)을
Edge Function이 클라이언트와 **같은 파일을 그대로 import**하게 만들었습니다. 규칙이 두 곳에서
따로 관리되며 어긋나는 일을 원천 차단합니다.

### 테스트

`features/lesson/domain/scoring.test.ts`, `streak.test.ts` — XP 계산·스트릭 계산 19개 케이스
(만점/재도전0XP/게스트80%/보너스환급/프리즈방어 등). `npm test`로 실행, 전부 통과 확인.

### 확인한 것

- `npx tsc --noEmit`, `npx eslint .`, `npm test` 전부 통과
- Deno 전용 코드(`supabase/functions/`)는 RN 툴체인 검사 대상에서 제외 (tsconfig/eslint 설정)

### md 문서 전수 검토 (지난 세션)

기획서·제작플랜·문제은행 3개 파일(280문제) 전체를 읽고 실제 코드 상태와 대조했습니다.
아래 "발견한 문제"는 그 결과입니다.

### Phase 7 — 콘텐츠 JSON 변환 (완료)

문제은행 3개 파일의 280문제 × 40레슨을 전부 `content/questions/*.json`으로 변환하고,
`content/lessons.json`(전체 8단계 40레슨 메타데이터)과 `contentRepository.ts` +
`supabase/functions/_shared/content.ts` 양쪽 등록까지 끝냈습니다.

검증 스크립트로 확인한 것:
- 40개 파일 × 7문제 = 280문제, 에러 0개
- 모든 레슨에 문제 파일이 있고, 모든 문제 파일에 대응하는 레슨이 있음 (누락/고아 파일 없음)
- `choice`/`blank`/`compare`의 answer 인덱스가 전부 options 범위 안에 있음
- `order`의 answer가 전부 유효한 순열이고, "보기 순서 그대로가 정답"인 자명한 문제는 없음

**부수적으로 발견해서 고친 버그**: 기존 `1-2.json`의 `order` 문제(Q7)가 보기를 이미 정답
순서 그대로 배열해놔서, 탭 UI(`QuestionOrder.tsx`)에 셔플 로직이 없다 보니 사용자가 그냥
위에서부터 순서대로 누르면 항상 맞는 상태였습니다. 보기 순서를 섞고 `answer` 인덱스를
다시 계산해서 고쳤습니다.

**추가로 완료**: 문제은행 부록의 "`order` 유형을 5~8개 더 늘리자" 권장사항도 나중에
반영했습니다. 부록이 후보로 짚은 7개 레슨(1-1, 1-5, 3-5, 5-2, 6-5, 7-1, 8-3)의 Q7을
전부 부록에 제시된 순서(예: 1-1 "아이디어→기능목록→화면", 7-1 "로컬확인→키점검→배포→
배포후확인")로 다시 써서 `order` 유형으로 바꿨습니다. 기존 compare 문제를 대체하는
방식으로 진행해서 레슨당 문제 수(7개)는 그대로 유지됩니다. `order` 비율이 4문제(1.4%)
→ 11문제(3.9%)로, 목표했던 3~4% 구간에 맞춰졌습니다.

### 커리큘럼 확장 — 9~12단계 신설 (완료)

사용자가 "문제가 너무 적고 너무 상식적"이라고 지적해서, 기존 8단계 40레슨(280문제)에
4개 단계·18레슨을 새로 추가했습니다.

| 단계 | 제목 | 레슨 수 | 내용 |
|---|---|---|---|
| 9 | 화면 여러 개 오가기 | 5 | 라우팅, `router.push` vs `router.replace`, 파라미터 전달 |
| 10 | 데이터 다루기 심화 | 5 | 배열 메서드 조합, 비동기 처리, 로딩/에러 상태 |
| 11 | 함께 만들기 | 4 | Git 기초, 커밋/브랜치, 충돌, 협업 흐름 |
| 12 | 개발 개념 한 겹 더 | 5 | 비동기, 타입, 라이브러리/프레임워크 개념 |

`content/lessons.json`, `content/questions/9-1.json`~`12-5.json`(18개 파일 126문제),
`contentRepository.ts`, `_shared/content.ts` 4곳 모두 등록 완료. 기존 7문제 난이도
흐름(개념진입→코드에서찾기→구분→blank→에러연결→읽는감각→종합판단)을 그대로 따랐습니다.

**결과**: 8단계 40레슨 280문제 → **12단계 58레슨 406문제**.

### 오답(distractor) 품질 개선 (완료)

커리큘럼 확장 후에도 사용자가 "문제들이 전반적으로 너무 상식적이니까 오답을 좀 그럴듯하게,
정말 공부가 되게 바꿔"라고 재지적했습니다. 신규 18레슨뿐 아니라 기존 40레슨까지 포함해서
전체 406문제를 훑었습니다.

기존 방식(나쁜 예): "인터넷이 끊겨서", "컴퓨터가 느려서/고장/재부팅", "배터리 문제",
"아무 의미 없다" 같이 상식만으로 걸러지는 오답 → 실제 개념을 몰라도 소거법으로 맞힐 수 있었음.

바뀐 방식(좋은 예, `1-4.json` 기준):
```json
// 전
"options": ["브라우저를 새로고침했는지", "컴퓨터를 재부팅했는지", "인터넷이 끊겼는지", "에디터를 재설치했는지"]
// 후
"options": [
  "브라우저를 새로고침했는지",
  "터미널에 떠 있는 서버가 계속 켜져 있는지",
  "지금 고친 파일이 실제로 이 화면과 연결된 파일이 맞는지",
  "AI가 설명만 하고 실제로는 파일을 안 바꿨는지"
]
```
각 오답도 "그럴듯하지만 틀린 개념"이 되도록 다시 써서, 실제로 개념을 이해해야만 정답을
가려낼 수 있게 했습니다.

- 58개 파일 중 약 39개 파일의 오답을 수정 (grep 기반 1차·2차 감사 + 수동 검토 3차로 진행)
- 배치고사 문제(`2-6-q1` 등 `PLACEMENT_QUESTION_ID`)도 오답 문구는 손봤지만 `answer` 인덱스는
  그대로 둬서 배치고사 채점 로직에 영향 없음을 확인
- 검증 스크립트 재실행: 58개 파일 406문제, 에러 0개, 경고 0개(자명한 order 문제 없음)
- `npx tsc --noEmit`, `npx eslint .`, `npm test`(27/27) 전부 통과
- `submit-answer`, `complete-placement` 두 Edge Function 재배포해서, 실제 서버 채점 기준이
  바뀐 콘텐츠와 일치하도록 동기화 완료

### 오답 2차 개선 — NCS 시험 난이도로 재작성 (완료)

1차 개선 후에도 사용자가 "오답들이 너무 허접함, 공기업 NCS 시험 문제 난이도로 다시 만들어라"고
재요청했습니다. 1차보다 한 단계 더 정교한 기준으로 58개 파일 전체를 다시 훑었습니다.

**1차와 2차의 차이**: 1차는 "인터넷이 끊겨서" 같은 상식으로 즉시 걸러지는 오답을 없애는
수준이었다면, 2차는 오답 자체가 "표면적으로 완결되고 기술적으로 그럴듯하되, 조건이 다르거나
원인·결과가 뒤바뀌었거나 비슷한 개념과 혼동되는" 수준까지 끌어올렸습니다. 예를 들어
`4-2.json` q5는 1차에서 "가격이 무료라서"/"상품이 너무 비싸서" 같은 오답이었던 걸 2차에서
"서버 응답은 받았지만 price 필드의 타입이 문자열이라서 계산에서 제외돼서" 같은 오답으로
바꿨습니다.

병렬 서브에이전트 6개(파일 8~10개씩)로 나눠 진행했고, 각 배치가 스스로 `node -e "JSON.parse(...)"`
검증과 git diff로 `answer`/`id`/`lessonId`/`type`/`code`/`order` 문제 불변을 확인했습니다.
이후 직접 다시:
- 검증 스크립트 재실행 — 58개 파일 406문제, 에러 0개, 경고 0개
- 배치고사 재사용 문제(`2-2/2-4/2-5/2-6/3-3`의 q1) 5개 전부 `answer` 값이 커밋된 이전 버전과
  정확히 동일함을 diff로 재확인 (배치1이 2-5-q1 오답도 수정했지만 정답 인덱스는 불변)
- `npx tsc --noEmit`, `npx eslint .`, `npm test`(27/27) 전부 통과
- `submit-answer`(837kB), `complete-placement`(832kB) 재배포 완료

53/58개 파일이 실제로 수정됐습니다. 의도적으로 그대로 둔 것: `order` 타입 전체, "모호함 자체가
학습 포인트"인 일부 blank 문항(예: 5-1 q4), 코드 줄 번호를 찾는 순수 위치형 문제, 이미 1차에서
충분히 정교했던 일부 문제(예: 4-6, 5-2, 2-6 전체 — 2-6-q1은 배치고사 문제라 특히 보수적으로 유지).

### 온보딩 구현 (완료 — 실기기 미검증)

제작플랜 기준 원래 Phase 1의 남은 부분입니다. 위저드 화면 + 배치고사 + 로그인 게이트 +
게스트 안내 배너까지 만들었습니다.

| 파일 | 내용 |
|---|---|
| `features/onboarding/domain/types.ts` | 목적/자가진단/하루목표 타입, 하루목표 프리셋→XP 매핑 |
| `features/onboarding/domain/placementScoring.ts` (+ 테스트 8개) | 배치고사 채점(연속 정답) + 점수→시작레슨 규칙 |
| `features/onboarding/data/pendingSync.ts` | 로그인 전 답변을 기기에 잠깐 담아두는 곳 (AsyncStorage) |
| `features/onboarding/hooks/useApplyPendingOnboarding.ts` | 세션이 생기는 순간 담아둔 답변을 실제로 반영 |
| `features/onboarding/screens/OnboardingScreen.tsx` | 위저드 화면 전체 (환영→목적→자가진단→하루목표→알림시간→[배치고사]) |
| `supabase/functions/complete-placement/` | 배치고사 재채점 + 건너뛴 레슨 progress 행 생성 (신규 Edge Function) |
| `features/auth/screens/AuthScreen.tsx` | `allowGuest`/`context` 파라미터로 배치고사 게이트("나중에 하기" 없음) 지원 |
| `features/lesson/screens/HomeScreen.tsx` | 게스트가 1단계 다 풀면 자동으로 로그인 화면으로 보냄 |
| `features/lesson/screens/LessonScreen.tsx` | 1-3에서 "게스트 모드 XP 80%" 안내 배너 (닫기 가능) |
| `features/auth/AuthContext.tsx` | 임시 자동 게스트 로그인 제거 — 이제 온보딩의 "나중에 하기"에서만 게스트 생성 |
| `content/lessons.json`, `_shared/content.ts` | 배치고사 5문제 접근 함수(`getPlacementQuestions`), 건너뛴 레슨 목록 함수(`getLessonsUpTo`) |

**구현 단순화 한 가지**: 기획서 원본 순서는 "배치고사 → 로그인 게이트 → 하루목표 →
알림시간"인데, 실제로는 "하루목표 → 알림시간 → (배치고사) → 로그인"으로 재배열했습니다.
로그인 전에는 user_id가 없어서 하루목표/알림시간을 어차피 기기에 임시로 담아뒀다가
로그인 후 반영해야 하므로, 수집 순서를 바꿔도 동작(로그인 게이트 유무, XP 80% 등)은
동일하고 위저드 구현이 훨씬 단순해집니다.

**배치고사 문제 출처**: 새로 문제를 쓰지 않고 기존 레슨(2-2/2-4/2-5/2-6/3-3)의 Q1을
그대로 재사용합니다 (변수→객체접근→map()→props→state, 기획서 6번 난이도 순서와 일치).

**이번에 안 한 것 (남은 일)**:
- [ ] 구글/카카오 로그인 버튼 — 아직 없음 (Phase 3 마무리 항목, 이메일만 동작)
- [ ] "게스트로 놓친 XP 돌려받기" 실제 금액 표시 — `calculatePendingBonus` 함수는
      이미 있지만 `AuthScreen`에 연결 안 함. 지금은 문구만 있고 숫자가 안 보임
- [ ] 알림 실제 발송 — `notify_time` 저장까지만 함. 발송 스케줄러는 Phase 6

**검증 상태 업데이트**: Supabase 프로젝트가 실제로 연결·배포됐습니다 (아래 2번 참고).
다만 Expo/Metro로 실제로 띄워서 화면 전환을 눈으로 확인하는 건 아직 안 했습니다 —
그건 사용자가 `npx expo start`로 직접 열어봐야 하는 부분입니다.

---

## 2. Supabase 연결 — 프로젝트 `daon-code` (fjtjoqdsrndnemhiqbmc)

**연결·배포·백엔드 검증까지 전부 완료.** 남은 건 로컬 `.env` 채우고 실제 앱 화면을 눈으로
확인하는 것뿐입니다.

### 완료된 것

1. [x] **프로젝트** — `daon-code` (region: ap-northeast-2 Seoul), CLI login + link 완료
2. [x] **DB 스키마** — `0001_init.sql`이 이미 적용돼있는 걸 확인함 (5개 테이블 + RLS +
   `guard_profile_xp` 트리거 전부 존재). 마이그레이션 이력만 CLI 기록과 안 맞았어서
   `supabase migration repair --status applied 0001`로 동기화함
3. [x] **Edge Function 배포** — `submit-answer`, `complete-placement` 둘 다 `ACTIVE` 배포 완료
4. [x] **익명 로그인 켜기** — 대시보드에서 사용자가 직접 켬 (Anonymous 토글 On), CLI로
   `config diff`를 다시 돌려서 원격에 `true`로 반영된 것 확인함
5. [x] **백엔드 로직 실사용 검증** — curl로 진짜 익명 세션을 만들어서 두 Edge Function을
   직접 호출해 확인함. 상세는 아래 "실기기(UI) 검증 체크리스트" 위쪽 항목 참고.

### 아직 안 된 것 (사용자가 해야 함)

- [ ] **로컬 `.env` 채우기** — 아래 값으로 (Project Settings → API에서도 확인 가능)
   ```bash
   cp .env.example .env
   ```
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://fjtjoqdsrndnemhiqbmc.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=(Project Settings → API → anon public key 복사)
   ```
- [x] **백엔드 로직 실제 검증 완료** — curl로 실제 익명 세션을 만들어 두 Edge Function을
   직접 호출해서 확인함 (테스트용 익명 계정 몇 개가 DB에 남아있음, 실사용자 전이라 무해함):
   - [x] `submit-answer`: 1-2 만점 제출 → `{lessonXp:8, perfectBonus:4, total:12}`,
         `unlockedNextLessonId:"1-3"` — 게스트 80%, 다음 레슨 해제 정확히 확인
   - [x] 같은 레슨 재도전 → `alreadyCompleted:true`, `total:0` — XP 중복 지급 안 됨
   - [x] `progress`에 클라이언트가 직접 PATCH 시도 → HTTP 200에 빈 배열(RLS가 조용히 차단),
         재조회 결과 값 안 바뀜 확인
   - [x] `profiles.total_xp` 직접 PATCH 시도 → 트리거가 명시적 에러로 거부 확인
         (`"xp/streak 컬럼은 서버(Edge Function)에서만 변경할 수 있습니다"`)
   - [x] `complete-placement`: 배치고사 5문제 만점 제출 → `startLessonId:"4-1"`,
         1-1~4-1까지 17개 레슨 전부 `completed:false`로 열림(잠김 아님) 확인
   - [ ] 하루 목표 보너스 임계값 넘는 시점 — 단위테스트로만 확인, 실제 두 레슨 연속
         제출로는 아직 안 해봄 (계산 로직 자체는 `scoring.test.ts`에서 검증됨)

- [ ] **UI/화면 검증** — 이건 실제 Expo 앱을 실행해야 확인 가능, 아직 안 함
   ```bash
   npm install
   npx expo start
   ```
   Expo Go로 QR 스캔 → 앱을 처음 켜면 온보딩부터 시작함 (기기에 `daon_onboarded` 플래그가
   없으면 항상 온보딩으로 감).

### 실기기(UI) 검증 체크리스트 — 백엔드 로직은 위에서 이미 확인됨, 화면만 남음

- [ ] 앱을 처음 실행하면 온보딩이 뜨는지, 완료 후 다시 안 뜨는지
- [ ] "코드를 조금 읽을 줄 알아요" 이상을 고르면 배치고사로 이어지는지
- [ ] 배치고사 완료 후 로그인 화면에 "나중에 하기" 버튼이 **없는지**
- [ ] 초보자 경로는 로그인 화면에 "나중에 하기"가 **있는지**, 눌렀을 때 게스트로 1단계 진입되는지
- [ ] 온보딩에서 고른 하루목표/알림시간이 로그인 후 `profiles` 테이블에 실제로 반영되는지
- [ ] 게스트로 1단계(5레슨) 다 풀면 자동으로 로그인 화면으로 넘어가는지 (나중에하기 없이)
- [ ] 레슨 1-3에서 게스트 안내 배너가 뜨고, 닫기가 되는지

**문제 생기면**: 대시보드 **Edge Functions → submit-answer / complete-placement → Logs**에서 에러 확인.

---

## 3. 검토 중 발견한 문제 — 전부 해결됨

이전 세션에서 문서 전수 검토 중 발견했던 것들입니다. 모두 처리했습니다.

- [x] ~~`content/questions/1-1.json`이 없음~~ → 1-1 포함 39개 레슨 전체 변환 완료 (Phase 7 참고)
- [x] ~~`content/lessons.json`에 2-1~2-6 레슨이 아예 없음~~ → 3~8단계 전체 메타데이터까지
      다 채워서 8단계 40레슨이 전부 `lessons.json`에 있음

---

## 4. 다음에 할 일 (우선순위 순)

### 🔶 Phase 4 마무리 — 백엔드는 검증 완료, UI 화면만 남음
2번 항목 참고. 연결·배포·익명로그인·백엔드 로직(채점/XP/RLS/배치고사)까지 curl로 실제
검증 완료. 남은 건 `.env` 채우고 `npx expo start`로 화면을 직접 눌러보는 것뿐입니다.

### ~~lessons.json 보정~~ — 완료
1~8단계 40레슨 메타데이터 전체가 `content/lessons.json`에 있습니다.

### ~~Phase 7 — 콘텐츠 JSON 변환~~ — 완료
280문제 × 40레슨 전체 변환 완료. 상세는 위 "1. 이번 세션에서 한 일" 참고.

### ~~온보딩 구현~~ — 완료 (실기기 미검증)
위저드·배치고사·로그인 게이트까지 코드 작성 완료. 상세는 위 "온보딩 구현" 항목 참고.
구글/카카오 버튼, pendingBonus 금액 표시는 남아있음 (아래 ①에 포함).

### ① Phase 3 마무리 ← 지금 여기부터
구글/카카오 로그인 (expo-auth-session + 딥링크 + setSession, RN 전용 플로우 필요).
겸사겸사 온보딩에서 빠진 "게스트로 놓친 XP 돌려받기" 금액 표시(`calculatePendingBonus`를
`AuthScreen`에 연결)도 로그인 화면을 만지는 김에 같이 하면 좋습니다.

### ② Phase 5 — 복습 시스템 (라이트너 박스)
`terms`/`user_term_review` 테이블은 스키마에 이미 있음. 화면(플래시카드)과 용어 콘텐츠가 없음.
용어 사전(`terms`) 콘텐츠 자체도 아직 없어서, 화면 작업 전에 용어 목록부터 정리해야 합니다.

### ~~`order` 유형 재배치~~ — 완료
7개 레슨의 Q7을 `order`로 전환 완료. 상세는 위 "Phase 7" 섹션 참고. **검토 권장**:
질문 문구를 새로 쓴 것들이라, 사람이 한 번 읽어보고 어색한 부분 있으면 알려주세요.

### ③ Phase 6 — 푸시 알림, EAS Update
온보딩에서 `notify_time`은 이미 수집·저장하지만, 실제로 그 시간에 발송하는 스케줄러
(pg_cron + Edge Function + Expo Push)는 아직 없습니다.

### ④ Phase 8 — 출시 준비
앱 아이콘, 스토어 스크린샷, 개인정보처리방침, QA.

---

## 5. 순서를 이렇게 잡은 이유

①은 로그인 화면을 이미 만지고 있어서 구글/카카오·pendingBonus를 묶어 처리하기 좋은
타이밍입니다. ②는 콘텐츠(용어 사전)부터 채워야 하는 선행 작업이 있어 그 다음입니다.
③④는 문서 자체가 "나머지는 그 다음"이라고 이미 못박아둔 순서입니다.

**Phase 4(Edge Function 배포)는 별도 트랙**: 보류였다가 재개해서 배포·검증까지 끝났고
(2번 섹션 참고), 남은 건 사용자가 직접 앱을 켜서 화면을 보는 것뿐이라 이 우선순위
목록에는 포함하지 않았습니다.
