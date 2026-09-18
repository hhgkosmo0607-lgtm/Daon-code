import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressBar } from '../../../shared/components/ProgressBar';
import { getReadableTextColor } from '../../../shared/theme/contrast';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { FeedbackBanner } from '../components/FeedbackBanner';
import { QuestionView } from '../components/QuestionView';
import { useWrongAnswers } from '../hooks/useWrongAnswers';
import type { Question } from '../domain/types';

/*
 * 오답노트 — 틀린 문제만 모아서 다시 푼다.
 *
 * 레슨 풀이와 달리 XP/스트릭/progress는 전혀 안 바뀐다 (복습이지 진도가 아니라서).
 * 맞히면 그 자리에서 오답노트에서 빠지고, 틀리면 다음에 또 나온다.
 *
 * seedQuestions를 넘기면 전체 오답노트가 아니라 그 목록만 큐로 쓴다 —
 * 레슨을 막 끝낸 직후 "틀린 문제 바로 다시 풀기"에서 이 화면을 그대로
 * 재사용할 때 쓴다 (LessonScreen 참고).
 */
export function WrongAnswersScreen({ seedQuestions }: { seedQuestions?: Question[] } = {}) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    loading,
    error,
    current,
    index,
    total,
    answer,
    setAnswer,
    checked,
    lastCorrect,
    clearedCount,
    canCheck,
    check,
    next,
    isLast,
    finished,
    reload,
  } = useWrongAnswers(seedQuestions);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.muted}>{error}</Text>
        <Pressable style={styles.ghostButton} onPress={reload}>
          <Text style={styles.ghostButtonText}>다시 시도</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (total === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyTitle}>오답노트가 비어있어요</Text>
        <Text style={styles.muted}>틀린 문제가 여기 자동으로 쌓여요</Text>
        <Pressable style={styles.ghostButton} onPress={() => router.back()}>
          <Text style={styles.ghostButtonText}>돌아가기</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyTitle}>복습 완료</Text>
        <Text style={styles.muted}>
          {total}문제 중 {clearedCount}개를 맞혀서 오답노트에서 뺐어요
        </Text>
        {/* replace로 홈을 다시 마운트해야 상단 오답노트 배지 숫자가 새로 반영된다 */}
        <Pressable style={styles.ghostButton} onPress={() => router.replace('/')}>
          <Text style={styles.ghostButtonText}>홈으로</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        {/* 레슨 화면과 달리 도중에 나가도 이미 맞힌 문제는 지워진 상태라,
            back 대신 replace로 홈을 다시 마운트해서 오답노트 배지를 갱신한다 */}
        <Pressable onPress={() => router.replace('/')} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <ProgressBar current={index} total={total} />
        <Text style={styles.counter}>
          {index + 1}/{total}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <QuestionView question={current} answer={answer} onAnswer={setAnswer} checked={checked} />
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
    muted: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
    emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
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
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    checkButtonDisabled: { backgroundColor: colors.border },
    checkButtonText: { color: getReadableTextColor(colors.accent), fontSize: 16, fontWeight: '700' },
    ghostButton: {
      borderWidth: 2,
      borderColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    ghostButtonText: { color: colors.accent, fontWeight: '600' },
  });
