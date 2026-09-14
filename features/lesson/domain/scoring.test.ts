import { describe, expect, it } from 'vitest';
import {
  calculatePendingBonus,
  calculateXp,
  isCorrect,
  levelFromXp,
} from './scoring';
import type { Question } from './types';

const choiceQuestion: Question = {
  id: 'q1',
  lessonId: '1-2',
  type: 'choice',
  prompt: '',
  options: ['a', 'b', 'c', 'd'],
  answer: 1,
  explanation: '',
};

const orderQuestion: Question = {
  id: 'q2',
  lessonId: '1-2',
  type: 'order',
  prompt: '',
  options: ['x', 'y', 'z'],
  answer: [0, 1, 2],
  explanation: '',
};

describe('isCorrect', () => {
  it('choice/blank/compare — 인덱스가 같으면 정답', () => {
    expect(isCorrect(choiceQuestion, 1)).toBe(true);
    expect(isCorrect(choiceQuestion, 0)).toBe(false);
  });

  it('order — 배열 순서가 완전히 같아야 정답', () => {
    expect(isCorrect(orderQuestion, [0, 1, 2])).toBe(true);
    expect(isCorrect(orderQuestion, [1, 0, 2])).toBe(false);
    expect(isCorrect(orderQuestion, [0, 1])).toBe(false); // 길이가 달라도 오답
  });

  it('제출 형식이 정답과 다른 타입이면 항상 오답 (조작 방지)', () => {
    expect(isCorrect(choiceQuestion, [1] as unknown as number)).toBe(false);
    expect(isCorrect(orderQuestion, 0 as unknown as number[])).toBe(false);
  });
});

describe('calculateXp', () => {
  it('정식 계정 만점 + 하루 목표 달성 → 35 XP (10 + 5 + 20)', () => {
    const result = calculateXp({
      correctCount: 7,
      totalCount: 7,
      alreadyCompleted: false,
      isAnonymous: false,
      reachesDailyGoalFirstTime: true,
    });
    expect(result).toEqual({ lessonXp: 10, perfectBonus: 5, dailyGoalBonus: 20, total: 35 });
  });

  it('게스트(익명) 만점 → 12 XP (80% 적용, 하루 목표 미달성)', () => {
    const result = calculateXp({
      correctCount: 7,
      totalCount: 7,
      alreadyCompleted: false,
      isAnonymous: true,
      reachesDailyGoalFirstTime: false,
    });
    expect(result).toEqual({ lessonXp: 8, perfectBonus: 4, dailyGoalBonus: 0, total: 12 });
  });

  it('이미 완료한 레슨 재도전 → 0 XP (만점이어도, 하루 목표를 처음 넘겨도)', () => {
    const result = calculateXp({
      correctCount: 7,
      totalCount: 7,
      alreadyCompleted: true,
      isAnonymous: false,
      reachesDailyGoalFirstTime: true,
    });
    expect(result).toEqual({ lessonXp: 0, perfectBonus: 0, dailyGoalBonus: 0, total: 0 });
  });

  it('정답이 일부만 맞으면 만점 보너스는 없다', () => {
    const result = calculateXp({
      correctCount: 5,
      totalCount: 7,
      alreadyCompleted: false,
      isAnonymous: false,
      reachesDailyGoalFirstTime: false,
    });
    expect(result).toEqual({ lessonXp: 10, perfectBonus: 0, dailyGoalBonus: 0, total: 10 });
  });
});

describe('calculatePendingBonus', () => {
  it('게스트 48XP 상태에서 로그인 → 12XP 보너스 환급', () => {
    expect(calculatePendingBonus(48)).toBe(12);
  });

  it('게스트로 번 XP가 0이면 환급도 0', () => {
    expect(calculatePendingBonus(0)).toBe(0);
  });
});

describe('levelFromXp', () => {
  it('누적 XP 100마다 1레벨씩 오른다', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(250)).toBe(3);
  });
});
