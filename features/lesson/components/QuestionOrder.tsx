import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../../shared/theme/theme';

/*
 * order 유형: 드래그가 아니라 "탭해서 위로 올리는" 방식.
 *
 * 드래그를 안 쓰는 이유 (기획서 5번):
 *  - 작은 화면에서 손가락에 카드가 가려진다
 *  - 오조작이 잦고 구현도 까다롭다
 *  - 듀오링고도 실제로 탭 방식을 쓴다
 *
 * 탭할 때 짧은 햅틱을 줘서 조작감을 보완한다.
 */
interface Props {
  options: string[];
  /** 위쪽(답안 영역)에 올라간 보기들의 원본 인덱스 순서 */
  picked: number[];
  onChange: (next: number[]) => void;
  revealAnswer?: number[] | null;
  disabled?: boolean;
}

export function QuestionOrder({ options, picked, onChange, revealAnswer, disabled }: Props) {
  const revealed = revealAnswer !== null && revealAnswer !== undefined;
  const remaining = options.map((_, i) => i).filter((i) => !picked.includes(i));

  const tap = (fn: () => void) => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    fn();
  };

  return (
    <View>
      {/* 답안 영역 — 탭하면 아래로 내려간다 */}
      <View style={styles.answerZone}>
        {picked.length === 0 && <Text style={styles.placeholder}>아래에서 순서대로 탭하세요</Text>}

        {picked.map((optionIndex, position) => {
          const isRight = revealed && revealAnswer![position] === optionIndex;
          const isWrong = revealed && !isRight;

          return (
            <Pressable
              key={optionIndex}
              onPress={() => tap(() => onChange(picked.filter((i) => i !== optionIndex)))}
              style={[styles.card, isRight && styles.correct, isWrong && styles.wrong]}
            >
              <Text style={styles.index}>{position + 1}</Text>
              <Text style={styles.text}>{options[optionIndex]}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* 보기 영역 — 탭하면 위로 올라간다 */}
      <View style={styles.bank}>
        {remaining.map((optionIndex) => (
          <Pressable
            key={optionIndex}
            onPress={() => tap(() => onChange([...picked, optionIndex]))}
            style={styles.bankItem}
          >
            <Text style={styles.text}>{options[optionIndex]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  answerZone: {
    minHeight: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  placeholder: { color: colors.textMuted, fontSize: 14, padding: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  correct: { borderColor: colors.success, backgroundColor: '#EAF9F0' },
  wrong: { borderColor: colors.error, backgroundColor: '#FDECEA' },
  index: { fontWeight: '700', color: colors.primary, minWidth: 16 },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  bankItem: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  text: { fontSize: 15, color: colors.text, flexShrink: 1 },
});
