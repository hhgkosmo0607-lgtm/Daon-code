import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SubmitAnswerResult } from '../../../shared/lib/edgeFunctions';
import { getReadableTextColor } from '../../../shared/theme/contrast';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { levelFromXp } from '../domain/scoring';
import type { Lesson } from '../domain/types';

/** 보상 로그가 한 줄씩 찍히는 간격 */
const LOG_LINE_DELAY_MS = 350;

/** 서버가 확정한 결과를 터미널 로그 줄로 바꾼다 (보상 연출용) */
function rewardLog(result: SubmitAnswerResult): string[] {
  if (result.alreadyCompleted) {
    return ['> 이미 완료한 레슨 · XP와 코인은 지급되지 않아요'];
  }

  const lines = [`> +${result.xp.total} XP  +${result.coins} coin`];

  const levelBefore = levelFromXp(result.profile.totalXp - result.xp.total);
  if (result.profile.level > levelBefore) {
    lines.push(`> LEVEL UP  LV${levelBefore} → LV${result.profile.level}`);
  }

  lines.push(`> streak ${result.streak.streak}d ✔`);
  return lines;
}

/*
 * 레슨 완료 화면.
 *
 * 여기 표시되는 XP·스트릭은 submitAnswer Edge Function이 서버에서 확정한 값이다.
 * (기획서 아키텍처 원칙: 클라이언트 계산은 신뢰하지 않음)
 */
interface Props {
  lesson: Lesson;
  result: SubmitAnswerResult;
  /** 이번 레슨에서 틀린 문제 수. 0이면 "바로 다시 풀기" 버튼을 안 보여준다 */
  wrongCount: number;
  onRetryWrong: () => void;
}

export function LessonResultScreen({ lesson, result, wrongCount, onRetryWrong }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const log = useMemo(() => rewardLog(result), [result]);
  const [shownLines, setShownLines] = useState(0);
  useEffect(() => {
    if (shownLines >= log.length) return;
    const timer = setTimeout(() => setShownLines((n) => n + 1), LOG_LINE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [shownLines, log.length]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>레슨 완료!</Text>
        <Text style={styles.subtitle}>{lesson.title}</Text>

        <View style={styles.stats}>
          <Stat label="정답" value={`${result.correctCount}/${result.totalCount}`} />
          <Stat label="스트릭" value={`🔥 ${result.streak.streak}`} />
        </View>

        <View style={styles.log} accessibilityLabel={log.join(', ').replace(/>/g, '')}>
          {log.slice(0, shownLines).map((line) => (
            <Text
              key={line}
              style={[styles.logLine, line.includes('LEVEL UP') && { color: colors.xp }]}
            >
              {line}
            </Text>
          ))}
        </View>
      </View>

      {wrongCount > 0 ? (
        <>
          <Pressable style={styles.button} onPress={onRetryWrong}>
            <Text style={styles.buttonText}>틀린 문제 {wrongCount}개 바로 풀기</Text>
          </Pressable>
          <Pressable style={styles.skipButton} onPress={() => router.dismissTo('/')}>
            <Text style={styles.skipButtonText}>건너뛰고 계속하기</Text>
          </Pressable>
        </>
      ) : (
        <Pressable style={styles.button} onPress={() => router.dismissTo('/')}>
          <Text style={styles.buttonText}>계속하기</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    emoji: { fontSize: 56 },
    title: { fontSize: 24, fontWeight: '800', color: colors.text },
    subtitle: { fontSize: 15, color: colors.textMuted, marginBottom: spacing.lg },
    stats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md },
    stat: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      minWidth: 90,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: { fontSize: 22, fontWeight: '800', color: colors.accent },
    statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    log: { alignSelf: 'stretch', marginTop: spacing.lg, minHeight: 72, gap: 4 },
    logLine: { fontSize: 14, fontWeight: '700', color: colors.accent, fontFamily: fonts.mono },
    button: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    buttonText: { color: getReadableTextColor(colors.accent), fontSize: 16, fontWeight: '700' },
    skipButton: {
      paddingVertical: spacing.sm,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    skipButtonText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  });
