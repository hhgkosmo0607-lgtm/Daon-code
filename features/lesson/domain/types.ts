/*
 * 레슨·문제의 데이터 구조.
 * 이 타입이 곧 content/ 폴더의 로컬 JSON 스키마이기도 하다.
 * (기획서 10번: 콘텐츠 원본은 로컬 JSON, Supabase 콘텐츠 테이블은 안 씀)
 */

export type QuestionType = 'choice' | 'blank' | 'order' | 'compare';

export interface Question {
  id: string;
  lessonId: string;
  type: QuestionType;
  prompt: string;
  /** 문제에 함께 보여줄 코드 블록. 없으면 undefined */
  code?: string;
  /**
   * code 블록의 언어 라벨을 명시적으로 지정한다 (예: 'Java').
   * 없으면 CodeBlock이 JS/JSX만 구분하는 자동 추론(detectLanguageLabel)으로
   * 대체한다 — ai-coding 트랙 기존 콘텐츠가 전부 JS/JSX라서 그대로 둬도 된다.
   * JS/JSX가 아닌 언어(Java 등)가 code를 쓰는 문제는 반드시 이 필드를 채워야
   * 자동 추론이 오작동(예: List<String>을 JSX 태그로 오인)하지 않는다.
   */
  language?: string;
  options: string[];
  /**
   * choice/blank/compare → 정답 보기의 인덱스 (number)
   * order → 올바른 순서의 인덱스 배열 (number[])
   */
  answer: number | number[];
  explanation: string;
  hint?: string;
}

export interface Lesson {
  id: string;
  /** 이 레슨이 속한 트랙 (예: 'ai-coding', 'ipe') — Track.id를 그대로 참조한다 */
  trackId: string;
  stage: number;
  title: string;
  subtitle?: string;
  orderNo: number;
  xpReward: number;
}

export interface Stage {
  /** 이 스테이지가 속한 트랙 — 같은 stage 번호도 트랙이 다르면 별개다 */
  trackId: string;
  stage: number;
  title: string;
  description?: string;
}

/**
 * 커리큘럼 트랙 (기존 "코딩 입문 + AI 활용"과 자격증 대비 등을 병행 제공하기 위한 구분).
 * lessonId는 트랙이 달라도 전역에서 유일해야 한다 — progress/wrong_answers가
 * lesson_id 문자열 하나로만 구분하기 때문이다. 그래서 새 트랙의 레슨 id는
 * "ipe-1-1"처럼 트랙 접두어를 붙인다 (contentRepository.ts, content/tracks.json 참고).
 */
export interface Track {
  id: string;
  label: string;
  description?: string;
}

/** 홈 화면에서 레슨을 어떤 모양으로 그릴지 결정하는 상태 */
export type LessonStatus = 'locked' | 'open' | 'completed';
