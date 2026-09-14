# Daon-code 할 일 정리

> 이번 세션에서 한 일 + 지금 막혀있는 것 + 다음에 할 일.
> 다른 문서(README, 기획서, 제작플랜)와 겹치는 내용은 요약만 하고 상세는 그쪽을 참고하세요.

---

## 1. 이번 세션에서 한 일

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

---

## 2. 지금 막혀있는 것 — 사용자 액션 필요

### 🔴 Edge Function 배포 및 실기기 검증 (최우선)

코드는 작성됐지만 **배포도, 실제 Supabase 프로젝트로의 검증도 안 했습니다.** 제 쪽에서
Supabase 프로젝트 접근 권한이 없어서 여기서부터는 직접 하셔야 합니다.

```bash
# 최초 1회
npx supabase login
npx supabase link --project-ref <프로젝트 참조 ID>

# 배포
npx supabase functions deploy submit-answer

# Supabase 대시보드에서 (아직 안 했다면)
# 1. SQL Editor → supabase/migrations/0001_init.sql 실행
# 2. Authentication → Providers → Anonymous sign-ins 켜기

# 로컬 .env
cp .env.example .env   # EXPO_PUBLIC_SUPABASE_URL / ANON_KEY 채우기
npx expo start
```

배포 후 확인할 것 (체크리스트):
- [ ] 레슨 1-2를 실제로 풀고 → 홈 화면에 진도가 반영되는지, 다음 레슨 잠금이 풀리는지
- [ ] 같은 레슨 두 번 풀어도 XP 중복 지급 안 되는지
- [ ] 게스트(익명) 계정 XP가 정상의 80%만 지급되는지
- [ ] 하루 목표 보너스가 그날 1회만 지급되는지
- [ ] 클라이언트가 `progress`/`daily_xp`/`profiles.total_xp` 등에 직접 `update()` 시도 → RLS로 거부되는지

---

## 3. 검토 중 발견한 문제 (아직 안 고침)

이전 세션에서 문서 전수 검토 중 발견했고, 아직 손대지 않은 것들입니다.

- [ ] **`content/questions/1-1.json`이 없음** — 기획서에는 "1-1 완료"라고 적혀있지만 실제로는
      `1-2.json`만 존재. 문제은행 문서(`문제은행_1-2단계.md`)에는 1-1 문제 7개가 이미 다 쓰여있어서
      변환만 하면 됩니다.
- [ ] **`content/lessons.json`에 2-1~2-6 레슨이 아예 없음** — `stages` 배열엔 2단계가 있는데
      `lessons` 배열엔 1-1~1-5만 있고 2단계 레슨 6개가 빠져있습니다. 콘텐츠 변환보다 먼저
      고쳐야 순서가 꼬이지 않습니다.

---

## 4. 다음에 할 일 (우선순위 순)

### ① Phase 4 마무리 — 배포 + 실기기 검증
위 2번 항목 그대로. 이게 끝나야 "레슨을 풀면 실제로 저장되는 앱"이 됩니다.

### ② lessons.json 보정
2-1~2-6 레슨 메타데이터를 `content/lessons.json`에 추가 (title/subtitle/orderNo/xpReward).
문제은행_1-2단계.md에 이미 제목이 다 있어서 옮기기만 하면 됩니다.

### ③ Phase 7 — 콘텐츠 JSON 변환
문제은행 3개 파일(280문제, 40레슨)을 `content/questions/*.json`으로 변환하고
`features/lesson/data/contentRepository.ts` + `supabase/functions/_shared/content.ts`
양쪽에 등록. 변환 형식은 `문제은행_6-8단계.md` 부록 참고.

- 변환하면서 `order` 유형 불균형도 같이 처리 (현재 1.4%, 후보 레슨 목록은 부록에 정리돼있음)

### ④ Phase 6 — 온보딩 (이번 세션 임시 조치를 대체)
지금 `AuthContext`가 임시로 자동 게스트 로그인을 하고 있는데, 이건 진짜 온보딩이 아닙니다.
온보딩을 만들면:
- 이 임시 로직을 "나중에 하기" 버튼 핸들러로 옮기기
- 배치고사 화면 + 결과 → 로그인 강제 흐름
- "게스트로 놓친 XP 돌려받기"(pendingBonus) 조회 API — 아직 없음, 이번에 안 만듦
- 배치고사 통과 시 건너뛴 레슨의 `progress` 행 미리 생성하는 로직 — 아직 없음

### ⑤ Phase 3 마무리
구글/카카오 로그인 (expo-auth-session + 딥링크 + setSession, RN 전용 플로우 필요)

### ⑥ Phase 5 — 복습 시스템 (라이트너 박스)
`terms`/`user_term_review` 테이블은 스키마에 이미 있음. 화면(플래시카드)과 용어 콘텐츠가 없음.

### ⑦ Phase 8 — 출시 준비
앱 아이콘, 스토어 스크린샷, 개인정보처리방침, QA.

---

## 5. 순서를 이렇게 잡은 이유

①②③은 Supabase 대시보드 접근이나 설계 판단 없이도 바로 진행 가능한 것들(①은 배포만,
②③은 콘텐츠 작업)이라 앞에 뒀습니다. ④⑤는 화면을 새로 설계해야 하는 작업이라 더 오래
걸립니다. ⑥⑦은 문서 자체가 "나머지는 그 다음"이라고 이미 못박아둔 순서입니다.
