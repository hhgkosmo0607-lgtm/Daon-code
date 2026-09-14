import { useCallback, useState } from 'react';
import { submitAnswer, type SubmitAnswerResult } from '../../../shared/lib/edgeFunctions';

/*
 * 레슨을 다 풀었을 때 submitAnswer Edge Function을 호출하고 결과를 들고 있는다.
 *
 * 레슨 결과 화면에 보여줄 XP·스트릭은 이 훅이 받아온 서버 응답이 유일한 출처다.
 * (기획서 2번: 클라이언트 계산은 화면 미리보기용일 뿐, 최종 값이 아니다)
 */
type SubmitState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: SubmitAnswerResult }
  | { status: 'error'; message: string };

export function useSubmitLesson() {
  const [state, setState] = useState<SubmitState>({ status: 'idle' });

  const submit = useCallback(async (lessonId: string, answers: Record<string, number | number[]>) => {
    setState({ status: 'loading' });
    try {
      const result = await submitAnswer(lessonId, answers);
      setState({ status: 'done', result });
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : '제출에 실패했어요' });
    }
  }, []);

  return { ...state, submit };
}
