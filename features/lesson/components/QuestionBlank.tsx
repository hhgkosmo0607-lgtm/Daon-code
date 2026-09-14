import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../../shared/theme/theme';

/*
 * blank 유형: 보기가 짧으므로 칩(chip) 버튼으로 가로 배치해 공간을 아낀다.
 * 화면이 좁으면 자동으로 다음 줄로 넘어간다 (flexWrap).
 */
interface Props {
  options: string[];
  selected: number | null;
  onSelect: (index: number) => void;
  revealAnswer?: number | null;
  disabled?: boolean;
}

export function QuestionBlank({ options, selected, onSelect, revealAnswer, disabled }: Props) {
  const revealed = revealAnswer !== null && revealAnswer !== undefined;

  return (
    <View style={styles.row}>
      {options.map((option, index) => {
        const isSelected = selected === index;
        const isAnswer = revealed && revealAnswer === index;
        const isWrongPick = revealed && isSelected && revealAnswer !== index;

        return (
          <Pressable
            key={index}
            onPress={() => !disabled && onSelect(index)}
            style={[
              styles.chip,
              isSelected && !revealed && styles.selected,
              isAnswer && styles.correct,
              isWrongPick && styles.wrong,
            ]}
          >
            <Text style={styles.text}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
  },
  selected: { borderColor: colors.primary, backgroundColor: '#EEF2F7' },
  correct: { borderColor: colors.success, backgroundColor: '#EAF9F0' },
  wrong: { borderColor: colors.error, backgroundColor: '#FDECEA' },
  text: { fontSize: 15, color: colors.text },
});
