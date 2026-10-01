import { describe, expect, it } from 'vitest';
import { pickNextLesson } from './nextLesson';

const ids = ['1-1', '1-2', '1-3', '2-1', '2-2'];

describe('pickNextLesson', () => {
  it('진도가 없으면 첫 레슨', () => {
    expect(pickNextLesson(ids, {})).toBe('1-1');
  });

  it('레슨을 끝내면 서버가 열어 둔 다음 레슨', () => {
    expect(pickNextLesson(ids, { '1-1': 'completed', '1-2': 'open' })).toBe('1-2');
  });

  it('배치고사로 열린 시작 레슨 — 앞 레슨을 안 풀었어도 시작 레슨', () => {
    expect(pickNextLesson(ids, { '1-1': 'open', '1-2': 'open', '1-3': 'open', '2-1': 'open' })).toBe(
      '2-1'
    );
  });

  it('순서를 건너뛰어 마지막까지 끝냈으면 앞에 남은 레슨', () => {
    expect(pickNextLesson(ids, { '1-1': 'completed', '2-2': 'completed' })).toBe('1-2');
  });

  it('전부 끝냈으면 null', () => {
    const all = Object.fromEntries(ids.map((id) => [id, 'completed' as const]));
    expect(pickNextLesson(ids, all)).toBeNull();
  });
});
