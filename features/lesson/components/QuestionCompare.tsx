import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CODE_PANEL_BACKGROUND, HighlightedCode } from '../../../shared/components/HighlightedCode';
import { ensureContrast } from '../../../shared/theme/contrast';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';

/*
 * compare 유형: A/B 두 코드를 세로로 쌓아 한눈에 비교하게 한다.
 *
 * 한 블록당 4줄 제한이 있다 (기획서 5번).
 *  - 비교는 스크롤 없이 동시에 보여야 의미가 있고
 *  - 저가 안드로이드 화면까지 고려하면 가용 높이가 더 좁으며
 *  - 코드는 일반 텍스트보다 인지 부하가 커서 이론상 가능한 줄 수보다 적게 잡아야 한다
 *
 * 개발 중 이 제한을 넘긴 문제가 들어오면 콘솔에 경고를 띄워서
 * 콘텐츠 작성 단계에서 잡을 수 있게 한다.
 */
const MAX_LINES = 4;

interface Props {
  options: string[];
  selected: number | null;
  onSelect: (index: number) => void;
  revealAnswer?: number | null;
  disabled?: boolean;
}

export function QuestionCompare({ options, selected, onSelect, revealAnswer, disabled }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const revealed = revealAnswer !== null && revealAnswer !== undefined;

  if (__DEV__) {
    options.forEach((option, i) => {
      const lines = option.split('\n').length;
      if (lines > MAX_LINES) {
        console.warn(
          `[compare] 보기 ${i + 1}이 ${lines}줄입니다. 최대 ${MAX_LINES}줄을 권장합니다 — ` +
            '발췌로 줄이거나 choice 유형으로 바꾸세요.'
        );
      }
    });
  }

  const labels = ['A', 'B', 'C', 'D'];

  return (
    <View style={{ gap: spacing.md }}>
      {options.map((option, index) => {
        const isSelected = selected === index;
        const isAnswer = revealed && revealAnswer === index;
        const isWrongPick = revealed && isSelected && revealAnswer !== index;

        return (
          <Pressable
            key={index}
            onPress={() => !disabled && onSelect(index)}
            style={[
              styles.block,
              isSelected && !revealed && styles.selected,
              isAnswer && styles.correct,
              isWrongPick && styles.wrong,
            ]}
          >
            <Text style={styles.label}>{labels[index]}</Text>
            <HighlightedCode code={option} style={styles.code} />
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    block: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      // CodeBlock과 같은 배경(border 톤) — 테마가 바뀌면 코드 패널도 함께 바뀐다
      backgroundColor: CODE_PANEL_BACKGROUND(colors),
    },
    selected: { borderColor: colors.accent },
    correct: { borderColor: colors.success },
    wrong: { borderColor: colors.error },
    label: {
      color: ensureContrast(colors.accent, CODE_PANEL_BACKGROUND(colors)),
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    code: {
      fontSize: 13,
      lineHeight: 20,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    },
  });
