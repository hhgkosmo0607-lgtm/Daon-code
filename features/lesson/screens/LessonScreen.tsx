import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressBar } from '../../../shared/components/ProgressBar';
import { colors, radius, spacing } from '../../../shared/theme/theme';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { QuestionView } from '../components/QuestionView';
import { useLesson } from '../hooks/useLesson';
import { useSubmitLesson } from '../hooks/useSubmitLesson';
import { LessonResultScreen } from './LessonResultScreen';

/*
 * 레슨 풀이 화면.
 *
 * 화면은 "지금 뭘 보여줄지"만 알고, 채점 규칙이나 데이터 출처는 모른다.
 * 그 부분은 전부 useLesson 훅 안에 있다.
 */
export function LessonScreen({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const lessonState = useLesson(lessonId);
  const submitState = useSubmitLesson();
  const hasSubmittedRef = useRef(false);

  const {
    lesson,
    current,
    index,
    total,
    answer,
    setAnswer,
    checked,
    lastCorrect,
    canCheck,
    check,
    next,
    isLast,
    finished,
    answers,
  } = lessonState;

  // 레슨이 끝나는 순간 딱 한 번, 서버에 채점·XP·진도 반영을 요청한다.
  useEffect(() => {
    if (finished && lesson && !hasSubmittedRef.current) {
      hasSubmittedRef.current = true;
      submitState.submit(lessonId, answers);
    }
  }, [finished, lesson, lessonId, answers, submitState]);

  // 아직 콘텐츠가 준비되지 않은 레슨
  if (!lesson || total === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.muted}>아직 준비 중인 레슨이에요.</Text>
        <Pressable style={styles.ghostButton} onPress={() => router.back()}>
          <Text style={styles.ghostButtonText}>돌아가기</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (finished) {
    if (submitState.status === 'error') {
      return (
        <SafeAreaView style={styles.center}>
          <Text style={styles.muted}>{submitState.message}</Text>
          <Pressable
            style={styles.ghostButton}
            onPress={() => submitState.submit(lessonId, answers)}
          >
            <Text style={styles.ghostButtonText}>다시 시도</Text>
          </Pressable>
        </SafeAreaView>
      );
    }

    if (submitState.status !== 'done') {
      return (
        <SafeAreaView style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </SafeAreaView>
      );
    }

    return <LessonResultScreen lesson={lesson} result={submitState.result} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <ProgressBar current={index} total={total} />
        <Text style={styles.counter}>
          {index + 1}/{total}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <QuestionView
          question={current}
          answer={answer}
          onAnswer={setAnswer}
          checked={checked}
        />
      </ScrollView>

      {checked ? (
        <FeedbackBanner
          correct={lastCorrect}
          explanation={current.explanation}
          onNext={next}
          isLast={isLast}
        />
      ) : (
        <View style={styles.footer}>
          <Pressable
            style={[styles.checkButton, !canCheck && styles.checkButtonDisabled]}
            onPress={check}
            disabled={!canCheck}
          >
            <Text style={styles.checkButtonText}>확인</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  muted: { color: colors.textMuted, fontSize: 15 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  close: { fontSize: 20, color: colors.textMuted },
  counter: { fontSize: 13, color: colors.textMuted, minWidth: 36, textAlign: 'right' },
  body: { padding: spacing.md, paddingBottom: spacing.xl },
  footer: { padding: spacing.md },
  checkButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  checkButtonDisabled: { backgroundColor: colors.border },
  checkButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghostButton: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  ghostButtonText: { color: colors.primary, fontWeight: '600' },
});
