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
  stage: number;
  title: string;
  subtitle?: string;
  orderNo: number;
  xpReward: number;
}

export interface Stage {
  stage: number;
  title: string;
  description?: string;
}

/** 홈 화면에서 레슨을 어떤 모양으로 그릴지 결정하는 상태 */
export type LessonStatus = 'locked' | 'open' | 'completed';
