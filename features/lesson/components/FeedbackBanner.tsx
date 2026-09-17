import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getReadableTextColor } from '../../../shared/theme/contrast';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';

/*
 * 정답/오답 피드백 배너.
 *
 * 정답이면 짧게, 오답이면 해설을 길게 보여준다 (기획서 5번).
 * 정답일 때 설명을 길게 붙이면 읽지 않고 넘기려는 흐름만 방해한다.
 */
interface Props {
  correct: boolean;
  explanation: string;
  onNext: () => void;
  isLast: boolean;
}

export function FeedbackBanner({ correct, explanation, onNext, isLast }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.wrap, correct ? styles.okWrap : styles.noWrap]}>
      <Text style={[styles.title, correct ? styles.okText : styles.noText]}>
        {correct ? '정답이에요!' : '아쉬워요'}
      </Text>

      {!correct && (
        <ScrollView style={styles.explainBox}>
          <Text style={styles.explain}>{explanation}</Text>
        </ScrollView>
      )}

      <Pressable style={[styles.button, correct ? styles.okButton : styles.noButton]} onPress={onNext}>
        <Text style={[styles.buttonText, correct ? styles.okButtonText : styles.noButtonText]}>
          {isLast ? '결과 보기' : '계속'}
        </Text>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      padding: spacing.md,
      borderTopWidth: 2,
      gap: spacing.sm,
    },
    okWrap: { backgroundColor: `${colors.success}22`, borderTopColor: colors.success },
    noWrap: { backgroundColor: `${colors.error}22`, borderTopColor: colors.error },
    title: { fontSize: 17, fontWeight: '700' },
    okText: { color: colors.success },
    noText: { color: colors.error },
    explainBox: { maxHeight: 140 },
    explain: { fontSize: 14, lineHeight: 21, color: colors.text },
    button: {
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    okButton: { backgroundColor: colors.success },
    noButton: { backgroundColor: colors.error },
    buttonText: { fontSize: 16, fontWeight: '700' },
    okButtonText: { color: getReadableTextColor(colors.success) },
    noButtonText: { color: getReadableTextColor(colors.error) },
  });
