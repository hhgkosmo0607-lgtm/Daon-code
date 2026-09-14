# Daon-code 제작 플랜

> 클린 아키텍처 + 기능별 폴더 구조로, 유지보수와 협업이 쉬운 구조를 목표로 한다.

---

## 1. 설계 원칙

```
① 화면(UI)은 Supabase를 모른다
   → 화면은 "인터페이스"만 호출하고, 실제로 로컬 JSON을 쓰는지
     Supabase를 쓰는지는 신경 쓰지 않는다.
     나중에 백엔드를 바꿔도 화면 코드는 안 건드려도 된다.

② 기능(feature) 단위로 폴더를 나눈다
   → "레슨 기능"과 "복습 기능"이 서로 다른 폴더에 있어서,
     두 사람이 동시에 작업해도 파일이 안 겹친다 (Git 충돌 최소화).

③ 콘텐츠 제작과 개발을 분리한다
   → 문제(질문/보기/정답)를 코드로 안 짜고 스프레드시트에 쓰면,
     스크립트가 자동으로 앱이 읽을 수 있는 데이터로 바꿔준다.
     개발 못 하는 사람도 콘텐츠 작업에 참여할 수 있다.
```

---

## 2. 레이어 구조 (클린 아키텍처, RN 버전)

```
┌─────────────────────────────┐
│ Screens (화면)                │  버튼 누르면 뭐가 뜨는지만 안다
├─────────────────────────────┤
│ Hooks (비즈니스 로직)          │  "채점한다", "진도를 가져온다" 같은 동작 단위
├─────────────────────────────┤
│ Repository (인터페이스)        │  "질문을 가져온다"는 약속만 정의
├─────────────────────────────┤
│ Repository 구현체              │  실제로 로컬 JSON을 읽거나
│ (Local / Supabase)            │  Supabase를 호출하는 부분
└─────────────────────────────┘

의존 방향: 위 → 아래로만. 화면이 Repository 구현체를 직접 부르지 않고,
반드시 Hooks를 거친다.
```

**예시로 보면**

```ts
// 1) 인터페이스 (약속) - features/lesson/domain/
interface QuestionRepository {
  getLessonQuestions(lessonId: string): Promise<Question[]>
}

// 2) 구현체 - features/lesson/data/
class LocalQuestionRepository implements QuestionRepository {
  // 번들된 JSON 파일에서 읽어옴
}

// 3) 화면이 쓰는 방식 - features/lesson/screens/
function LessonScreen() {
  const { questions } = useLesson(lessonId)  // Repository를 직접 안 건드림
  ...
}
```

**이렇게 나누는 이유**
- 나중에 콘텐츠를 로컬 JSON에서 Supabase 실시간 동기화로 바꿔도, `LocalQuestionRepository`만 `RemoteQuestionRepository`로 갈아끼우면 됨. 화면 코드는 한 줄도 안 바뀜.
- 테스트할 때도 가짜(mock) Repository를 넣어서 화면 로직만 따로 검증 가능.

---

## 3. 폴더 구조 (기능별)

```
daon-code/
├── app/                        Expo Router — 라우팅 배선만, 로직 없음
│   ├── (onboarding)/
│   ├── (tabs)/
│   │   ├── index.tsx           홈
│   │   └── profile.tsx
│   └── lesson/[id].tsx
│
├── features/                   기능 단위 (여기가 협업의 핵심 경계)
│   ├── onboarding/
│   │   ├── screens/
│   │   └── hooks/
│   ├── lesson/                 ← 1단계~8단계 학습 화면 전부
│   │   ├── domain/             Question, Lesson 타입 + 채점 로직
│   │   ├── data/                LocalQuestionRepository 등
│   │   ├── hooks/               useLesson, useSubmitAnswer
│   │   ├── components/          QuestionChoice, QuestionOrder 등 4유형
│   │   └── screens/
│   ├── review/                 라이트너 박스 복습
│   ├── auth/                   이메일/구글/카카오 로그인
│   └── profile/                통계, 설정
│
├── shared/                     기능 경계 없이 여러 곳에서 쓰는 것
│   ├── components/             Button, Card, ProgressBar, CodeBlock
│   ├── hooks/
│   ├── lib/
│   │   ├── supabaseClient.ts
│   │   └── edgeFunctions.ts
│   └── theme/                  색상, 폰트
│
├── content/                    콘텐츠 데이터 (4번 섹션 참고)
│   ├── lessons.json
│   └── questions/
│       ├── 1-1.json
│       └── ...
│
└── scripts/
    └── build-content.ts        스프레드시트 → JSON 변환 스크립트
```

**충돌이 왜 줄어드나**: "레슨 화면 담당"과 "복습 화면 담당"이 각각 `features/lesson/`, `features/review/` 안에서만 작업하면, 서로 다른 파일을 건드리게 돼서 Git 충돌이 거의 안 생겨요. `shared/`만 건드릴 땐 서로 리뷰를 신경 써야 해요.

---

## 4. 콘텐츠 파이프라인 (협업의 핵심)

문제 280개를 전부 코드(JSON)로 직접 치는 건 비개발자가 참여하기 어려워요. 그래서 이렇게 분리해요.

```
[콘텐츠 제작자]                    [개발자]
스프레드시트에 문제 작성      →    scripts/build-content.ts 실행
(질문/보기/정답/해설 열)           → content/questions/*.json 자동 생성
                                → 앱이 빌드 시 이 JSON을 번들
```

**스프레드시트 열 구조 예시**
```
lesson_id | type | prompt | code | option1~4 | answer | explanation
```

이렇게 하면 콘텐츠 검수(오탈자, 난이도)는 스프레드시트에서 편하게 하고, 개발자는 스크립트 한 번 돌리는 것으로 끝나요.

**콘텐츠 원본은 로컬 JSON으로 확정** (Supabase 콘텐츠 테이블은 안 씀). `content/`의 JSON이 곧 원본이고, 이걸 앱에 번들해서 EAS Update로 갱신해요. 콘텐츠 제작자가 여러 명으로 늘어나는 시점에는 같은 스크립트를 Supabase seed용으로 재사용해 전환할 수 있지만, 지금 규모에서 Supabase에 이중으로 저장하는 건 관리 비용만 늘어나요.

---

## 5. 상태 관리

```
서버/원격 데이터 (진도, XP, 복습상태)   → React Query
   - 캐싱, 재시도, 로딩상태 관리를 자동으로 처리
   - Supabase 응답을 이걸로 감싸서 화면에 제공

전역 UI 상태 (로그인 여부 등)          → React Context
   - 이미 설계된 AuthContext 그대로 사용

화면 내부 상태 (지금 고른 보기 등)     → useState
   - 굳이 전역으로 안 올림
```

Redux 같은 무거운 도구는 안 써요. 팀 규모와 앱 복잡도에 비해 과해요. React Query + Context 조합으로 충분합니다.

---

## 6. 코드 품질 장치 (협업 필수 요소)

```
TypeScript strict 모드    타입이 안 맞으면 빌드 시점에 바로 잡힘
                         (다른 사람 코드와 맞물릴 때 특히 중요)

ESLint + Prettier        스타일 통일, 코드리뷰에서 "들여쓰기" 같은
                         걸로 시간 안 씀

Husky pre-commit hook    커밋 전에 자동으로 lint 검사
                         (린트 안 지킨 코드가 저장소에 안 들어옴)

CODEOWNERS 파일           features/lesson/* 는 A담당,
                         features/review/* 는 B담당 — PR 리뷰 자동 지정
```

---

## 7. Git / 협업 규칙

```
main                      항상 배포 가능한 상태 유지, 직접 push 금지
feature/lesson-screen     기능 단위 브랜치
feature/review-flashcard

커밋 메시지: feat: 레슨 화면 기본 골격 추가
            fix: 복습 박스 계산 오류 수정
            chore: 의존성 업데이트

PR → 리뷰 최소 1인 → main 머지
```

혼자 개발하는 지금 단계에서도 이 규칙을 지켜두면, 나중에 사람이 늘었을 때 바로 적용 가능해요.

---

## 8. 테스트 전략 (MVP 수준)

```
꼭 필요한 것
  - 채점 로직 (도메인 순수 함수) 단위 테스트
    → XP 계산, 스트릭 계산, 라이트너 박스 이동 로직
    → 입력값 넣고 결과값만 확인하는 간단한 테스트라 비용 대비 효과 큼

  - Edge Function (submitAnswer) 최소 테스트
    → 여기가 조작 방지의 핵심이라 꼭 검증

당장 생략 가능
  - E2E 테스트 (앱 전체 흐름 자동화) — MVP엔 과함, Expo Go로 수동 확인
  - 컴포넌트 스냅샷 테스트 — 초기엔 화면이 자주 바뀌어서 오히려 부담
```

---

## 9. 빌드 순서 (Phase)

```
Phase 0. 뼈대 세팅
  레포 생성, TypeScript/ESLint/Prettier 설정, 폴더 구조 생성
  → 이 단계 끝나면 "빈 화면"이라도 실행은 됨

Phase 1. 네비게이션 + 온보딩 (백엔드 없이)
  화면 흐름만 먼저 구현, 더미 데이터로 확인
  → 온보딩 7단계 화면이 순서대로 넘어가는지 검증

Phase 2. 로컬 콘텐츠 + 문제 4유형 렌더링
  content/ 폴더에 1-1 레슨만 넣고, 4가지 문제 유형 컴포넌트 완성
  → 여기서 이전에 논의한 "compare 4줄 제한" 같은 UI 가정을 실제로 검증

Phase 3. Supabase 세팅
  스키마 적용 (progress/daily_xp/profiles/terms/user_term_review만 —
    콘텐츠 테이블(units/lessons/questions)은 안 만듦, 로컬 JSON이 원본)
  RLS 정책 설정 (progress/daily_xp/profiles xp·streak 컬럼 쓰기 차단)
  익명 로그인(Anonymous Auth) 설정 — 배치고사 안 거친 유저의 "나중에 하기" 저장용
  이메일 로그인 연동
  구글/카카오 로그인 — RN 전용 플로우 (expo-auth-session + 딥링크 + setSession)
    ※ 웹 기준 Supabase 예제 그대로 쓰면 동작 안 함, 별도 배선 필요
  익명→정식 계정 연결(link identity) 흐름 구현
  → profiles 테이블까지 연결, 로그인 가능한 상태

Phase 4. submitAnswer Edge Function
  채점·XP·스트릭 서버 처리, progress 테이블 연동
  - 이미 completed=true인 레슨은 재도전해도 XP 미지급 (best_score만 갱신)
  - 하루 목표 보너스(+20XP)는 그날 최초 1회만
  - is_anonymous면 XP × 0.8, 정식 계정이면 × 1.0 (반올림)
  - 배치고사 통과 시 건너뛴 레슨들의 progress 행을 completed=false로 미리 생성
  스트릭 계산은 Asia/Seoul 타임존 고정 (자정 근처 오류 방지)
  pendingBonus 조회 API — 게스트 지급분과 100% 기준값 차액을 로그인 전 미리 계산
  계정 연결 시점 Edge Function — 위 차액을 total_xp에 일시 가산
  1단계(5레슨) 완료 판정 → 로그인 강제 게이트 화면 트리거
  → 레슨 하나를 실제로 풀고 진도가 저장되는 것까지 확인
  → RLS 때문에 이 경로로만 쓰기가 가능한지 직접 확인 (클라이언트 직접 UPDATE 시도 → 거부되는지 테스트)
  → 같은 레슨 두 번 풀어서 XP가 중복 지급 안 되는지 확인
  → 게스트로 1단계 다 풀고 로그인했을 때 보너스가 정확히 가산되는지 확인

Phase 5. 복습 시스템 (라이트너 박스)
  terms/user_term_review 테이블, 플래시카드 화면

Phase 6. 다듬기
  푸시 알림 — Expo Push + pg_cron(매시 정각) + 발송용 Edge Function 조합으로 구현
    (notify_time 저장만으론 안 옴, 스케줄러 필수)
  EAS Update 설정 — 콘텐츠 변경사항을 스토어 심사 없이 반영
  프로필 통계, 에러/로딩 상태 처리

Phase 7. 콘텐츠 채우기
  스프레드시트 → 스크립트로 40레슨 280문제 전체 변환/검수

Phase 8. 출시 준비
  앱 아이콘, 스토어 스크린샷, 개인정보처리방침, QA
```

**Phase 2를 일부러 백엔드보다 먼저 두는 이유**: 지금까지 논의한 화면 설계(탭 방식 order, 4줄 제한 compare 등)가 실제로 손에서 어떻게 느껴지는지 가장 빨리 확인할 수 있는 지점이에요. 여기서 UI 가정이 틀렸다는 게 드러나면, Supabase 세팅 전에 고치는 게 훨씬 쌉니다.

---

## 10. 환경 설정 관리

```
.env.example          저장소에 커밋 (어떤 값이 필요한지 안내용)
.env                  .gitignore 처리, 실제 값은 로컬에만
app.config.js         빌드 프로파일(dev/preview/production)별로
                       다른 환경변수 자동 적용 (EAS 사용시)
```

---

## 11. 확정 사항 요약

```
아키텍처   레이어 분리 (Screens → Hooks → Repository 인터페이스 → 구현체)
폴더 구조   기능별(features/) + 공용(shared/) 분리
상태관리   React Query(서버) + Context(전역 UI) + useState(화면 내부)
콘텐츠     스프레드시트 → 스크립트 변환, 개발과 분리
품질장치   TypeScript strict, ESLint/Prettier, Husky, CODEOWNERS
테스트     채점 로직 단위테스트 + Edge Function 최소 테스트만
빌드순서   뼈대 → 화면골격 → 로컬콘텐츠(UI검증) → Supabase → Edge Function → 복습 → 다듬기 → 콘텐츠채움 → 출시
```
