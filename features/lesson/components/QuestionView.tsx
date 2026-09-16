import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CodeBlock } from '../../../shared/components/CodeBlock';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import type { Question } from '../domain/types';
import { QuestionBlank } from './QuestionBlank';
import { QuestionChoice } from './QuestionChoice';
import { QuestionCompare } from './QuestionCompare';
import { QuestionOrder } from './QuestionOrder';

/*
 * 문제 하나를 화면에 그린다.
 * type에 따라 4가지 컴포넌트 중 하나로 분기하는 게 이 파일의 역할이다.
 * 새 유형이 생기면 여기에 분기만 추가하면 된다.
 */
interface Props {
  question: Question;
  answer: number | number[] | null;
  onAnswer: (value: number | number[]) => void;
  checked: boolean;
}

export function QuestionView({ question, answer, onAnswer, checked }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const reveal = checked ? question.answer : null;

  return (
    <View>
      <Text style={styles.prompt}>{question.prompt}</Text>

      {/* compare 유형은 보기 자체가 코드라서 별도 코드 블록을 안 그린다 */}
      {question.code && question.type !== 'compare' && <CodeBlock code={question.code} />}

      {question.type === 'choice' && (
        <QuestionChoice
          options={question.options}
          selected={typeof answer === 'number' ? answer : null}
          onSelect={onAnswer}
          revealAnswer={typeof reveal === 'number' ? reveal : null}
          disabled={checked}
        />
      )}

      {question.type === 'blank' && (
        <QuestionBlank
          options={question.options}
          selected={typeof answer === 'number' ? answer : null}
          onSelect={onAnswer}
          revealAnswer={typeof reveal === 'number' ? reveal : null}
          disabled={checked}
        />
      )}

      {question.type === 'compare' && (
        <QuestionCompare
          options={question.options}
          selected={typeof answer === 'number' ? answer : null}
          onSelect={onAnswer}
          revealAnswer={typeof reveal === 'number' ? reveal : null}
          disabled={checked}
        />
      )}

      {question.type === 'order' && (
        <QuestionOrder
          options={question.options}
          picked={Array.isArray(answer) ? answer : []}
          onChange={onAnswer}
          revealAnswer={Array.isArray(reveal) ? reveal : null}
          disabled={checked}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    prompt: {
      fontSize: 17,
      lineHeight: 25,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.md,
    },
  });
