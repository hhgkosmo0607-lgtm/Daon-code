import { describe, expect, it } from 'vitest';
import { scorePlacementTest, startLessonFromScore } from './placementScoring';
import type { Question } from '../../lesson/domain/types';

function q(id: string, answer: number): Question {
  return { id, lessonId: 'placement', type: 'choice', prompt: '', options: ['a', 'b'], answer, explanation: '' };
}

const questions = [q('p1', 0), q('p2', 0), q('p3', 0), q('p4', 0), q('p5', 0)];

describe('scorePlacementTest', () => {
  it('전부 정답이면 5', () => {
    const answers = { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0 };
    expect(scorePlacementTest(questions, answers)).toBe(5);
  });

  it('앞에서부터 연속으로 맞힌 개수만 센다', () => {
    const answers = { p1: 0, p2: 0, p3: 1, p4: 0, p5: 0 }; // p3만 오답
    expect(scorePlacementTest(questions, answers)).toBe(2);
  });

  it('Q1을 틀리면 뒤를 다 맞혀도 0점 (총점이 아니라 연속 정답이므로)', () => {
    const answers = { p1: 1, p2: 0, p3: 0, p4: 0, p5: 0 };
    expect(scorePlacementTest(questions, answers)).toBe(0);
  });

  it('답을 안 낸 문제는 오답 취급', () => {
    const answers = { p1: 0, p2: 0 };
    expect(scorePlacementTest(questions, answers)).toBe(2);
  });
});

describe('startLessonFromScore', () => {
  it('0개 → 1단계부터', () => {
    expect(startLessonFromScore(0)).toBe('1-1');
  });

  it('1~2개 → 2단계 중반부터', () => {
    expect(startLessonFromScore(1)).toBe('2-3');
    expect(startLessonFromScore(2)).toBe('2-3');
  });

  it('3~4개 → 3단계부터', () => {
    expect(startLessonFromScore(3)).toBe('3-1');
    expect(startLessonFromScore(4)).toBe('3-1');
  });

  it('5개 → 4단계부터', () => {
    expect(startLessonFromScore(5)).toBe('4-1');
  });
});
