import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';

/*
 * choice 유형: 세로 버튼 목록에서 하나 선택.
 * 정답 확인 후에는 정답/오답 색을 함께 표시한다.
 */
interface Props {
  options: string[];
  selected: number | null;
  onSelect: (index: number) => void;
  /** 확인 버튼을 눌러 채점이 끝난 뒤에만 값이 들어온다 */
  revealAnswer?: number | null;
  disabled?: boolean;
}

export function QuestionChoice({ options, selected, onSelect, revealAnswer, disabled }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const revealed = revealAnswer !== null && revealAnswer !== undefined;

  return (
    <View>
      {options.map((option, index) => {
        const isSelected = selected === index;
        const isAnswer = revealed && revealAnswer === index;
        const isWrongPick = revealed && isSelected && revealAnswer !== index;

        return (
          <Pressable
            key={index}
            onPress={() => !disabled && onSelect(index)}
            style={[
              styles.option,
              isSelected && !revealed && styles.selected,
              isAnswer && styles.correct,
              isWrongPick && styles.wrong,
            ]}
          >
            <Text style={[styles.text, (isAnswer || isWrongPick) && styles.textStrong]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    option: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: colors.surface,
    },
    selected: { borderColor: colors.accent, backgroundColor: `${colors.accent}1A` },
    correct: { borderColor: colors.success, backgroundColor: `${colors.success}22` },
    wrong: { borderColor: colors.error, backgroundColor: `${colors.error}22` },
    text: { fontSize: 15, lineHeight: 21, color: colors.text },
    textStrong: { fontWeight: '600' },
  });
