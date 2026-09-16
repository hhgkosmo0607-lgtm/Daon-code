import { useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPlacementQuestions } from '../../lesson/data/contentRepository';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { QuestionView } from '../../lesson/components/QuestionView';
import { savePendingOnboarding, markOnboarded } from '../data/pendingSync';
import {
  DAILY_GOAL_XP,
  takesPlacementTest,
  type DailyGoalPreset,
  type Purpose,
  type SelfLevel,
} from '../domain/types';

/*
 * 온보딩 위저드. (기획서 6번)
 *
 * 구현 단순화 한 가지: 기획서 원본 순서는 "배치고사 → 로그인 게이트 → 하루목표 →
 * 알림시간"이지만, 여기서는 "하루목표 → 알림시간 → (배치고사) → 로그인"으로
 * 재배열했다. 로그인/게스트 세션이 생기기 전까지는 답을 저장할 user_id가 없어서
 * 어차피 기기에 임시로 담아뒀다가(pendingSync) 세션이 생긴 뒤에 한꺼번에 반영해야
 * 하므로, 수집 순서를 바꿔도 실제 동작(로그인 게이트 유무, XP 80% 등)은 동일하다.
 * 대신 위저드 화면 전환 로직이 훨씬 단순해진다.
 */

type Step = 'welcome' | 'purpose' | 'selfLevel' | 'dailyGoal' | 'notifyTime' | 'placementTest';

const PURPOSE_OPTIONS: { value: Purpose; label: string }[] = [
  { value: 'understand-code', label: 'AI가 만든 코드를 이해하고 싶어요' },
  { value: 'fix-errors', label: '에러를 스스로 해결하고 싶어요' },
  { value: 'better-prompts', label: 'AI에게 잘 요청하고 싶어요' },
  { value: 'finish-projects', label: '프로젝트를 끝까지 완성하고 싶어요' },
];

const SELF_LEVEL_OPTIONS: { value: SelfLevel; label: string }[] = [
  { value: 'never-seen-code', label: '코드를 본 적이 거의 없어요' },
  { value: 'vibe-coded-no-code-knowledge', label: 'AI로 만들어봤지만 코드는 몰라요' },
  { value: 'reads-a-bit', label: '코드를 조금 읽을 줄 알아요' },
  { value: 'reads-and-edits', label: '어느 정도 읽고 수정도 해요' },
];

const DAILY_GOAL_OPTIONS: { value: DailyGoalPreset; label: string; sub: string }[] = [
  { value: 'light', label: '가볍게', sub: '하루 5분' },
  { value: 'normal', label: '보통', sub: '하루 10분' },
  { value: 'hard', label: '열심히', sub: '하루 15분' },
];

const NOTIFY_TIME_OPTIONS = ['09:00', '13:00', '19:00', '21:00'];

export function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [step, setStep] = useState<Step>('welcome');
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [selfLevel, setSelfLevel] = useState<SelfLevel | null>(null);
  const [dailyGoalPreset, setDailyGoalPreset] = useState<DailyGoalPreset>('normal');
  const [notifyTime, setNotifyTime] = useState<string | null>(null);

  const placementQuestions = useMemo(() => getPlacementQuestions(), []);
  const [placementIndex, setPlacementIndex] = useState(0);
  const [placementAnswer, setPlacementAnswer] = useState<number | number[] | null>(null);
  const [placementAnswers, setPlacementAnswers] = useState<Record<string, number | number[]>>({});

  const togglePurpose = (value: Purpose) => {
    setPurposes((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]));
  };

  const finish = async (answers: Record<string, number | number[]> | null) => {
    await savePendingOnboarding({
      dailyGoal: DAILY_GOAL_XP[dailyGoalPreset],
      notifyTime: notifyTime ?? undefined,
      ...(answers ? { placementAnswers: answers } : {}),
    });
    await markOnboarded();

    if (answers) {
      router.replace({ pathname: '/auth', params: { allowGuest: 'false', context: 'placement' } });
    } else {
      router.replace('/auth');
    }
  };

  const handleAfterNotifyTime = () => {
    if (selfLevel && takesPlacementTest(selfLevel)) {
      setStep('placementTest');
    } else {
      finish(null);
    }
  };

  const handlePlacementNext = () => {
    const current = placementQuestions[placementIndex];
    if (!current || placementAnswer === null) return;

    const nextAnswers = { ...placementAnswers, [current.id]: placementAnswer };
    setPlacementAnswers(nextAnswers);

    if (placementIndex >= placementQuestions.length - 1) {
      finish(nextAnswers);
      return;
    }

    setPlacementIndex((i) => i + 1);
    setPlacementAnswer(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {step === 'welcome' && (
        <Centered>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>AI로 만들다가{'\n'}막힌 적 있나요?</Text>
          <Text style={styles.subtitle}>
            문법을 외우지 않고, AI가 준 코드를 읽고 이해하는 법을 배워요
          </Text>
          <PrimaryButton label="시작하기" onPress={() => setStep('purpose')} />
        </Centered>
      )}

      {step === 'purpose' && (
        <StepBody title="어떤 게 필요해서 오셨나요?" subtitle="여러 개 골라도 돼요">
          {PURPOSE_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              label={opt.label}
              selected={purposes.includes(opt.value)}
              onPress={() => togglePurpose(opt.value)}
            />
          ))}
          <PrimaryButton label="다음" onPress={() => setStep('selfLevel')} />
        </StepBody>
      )}

      {step === 'selfLevel' && (
        <StepBody title="코드, 어느 정도 보여요?" subtitle="솔직하게 골라주세요">
          {SELF_LEVEL_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              label={opt.label}
              selected={selfLevel === opt.value}
              onPress={() => setSelfLevel(opt.value)}
            />
          ))}
          <PrimaryButton label="다음" disabled={!selfLevel} onPress={() => setStep('dailyGoal')} />
        </StepBody>
      )}

      {step === 'dailyGoal' && (
        <StepBody title="하루 목표를 정해주세요" subtitle="나중에 설정에서 바꿀 수 있어요">
          <View style={styles.row}>
            {DAILY_GOAL_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.goalCard, dailyGoalPreset === opt.value && styles.goalCardSelected]}
                onPress={() => setDailyGoalPreset(opt.value)}
              >
                <Text style={styles.goalLabel}>{opt.label}</Text>
                <Text style={styles.goalSub}>{opt.sub}</Text>
              </Pressable>
            ))}
          </View>
          <PrimaryButton label="다음" onPress={() => setStep('notifyTime')} />
        </StepBody>
      )}

      {step === 'notifyTime' && (
        <StepBody title="언제 알려드릴까요?" subtitle="매일 이 시간에 학습 알림을 보내드려요">
          {NOTIFY_TIME_OPTIONS.map((time) => (
            <OptionCard key={time} label={time} selected={notifyTime === time} onPress={() => setNotifyTime(time)} />
          ))}
          <PrimaryButton label="다음" disabled={!notifyTime} onPress={handleAfterNotifyTime} />
        </StepBody>
      )}

      {step === 'placementTest' && placementQuestions.length > 0 && (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.counter}>
              배치고사 {placementIndex + 1}/{placementQuestions.length}
            </Text>
          </View>
          <ScrollView contentContainerStyle={styles.body}>
            <QuestionView
              question={placementQuestions[placementIndex]}
              answer={placementAnswer}
              onAnswer={setPlacementAnswer}
              checked={false}
            />
          </ScrollView>
          <View style={styles.footer}>
            <PrimaryButton
              label={placementIndex >= placementQuestions.length - 1 ? '결과 확인하기' : '다음'}
              disabled={placementAnswer === null}
              onPress={handlePlacementNext}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function Centered({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={styles.centered}>{children}</View>;
}

function StepBody({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={styles.optionList}>{children}</View>
    </ScrollView>
  );
}

function OptionCard({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable style={[styles.option, selected && styles.optionSelected]} onPress={onPress}>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Pressable style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
    body: { padding: spacing.lg, paddingBottom: spacing.xl, flexGrow: 1 },
    header: { padding: spacing.md, alignItems: 'center' },
    counter: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
    footer: { padding: spacing.md },
    emoji: { fontSize: 48, marginBottom: spacing.sm },
    title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'left', lineHeight: 30 },
    subtitle: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
    optionList: { gap: spacing.sm },
    option: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      backgroundColor: colors.surface,
    },
    optionSelected: { borderColor: colors.accent, backgroundColor: `${colors.accent}1A` },
    optionText: { fontSize: 15, color: colors.text },
    optionTextSelected: { fontWeight: '700', color: colors.accent },
    row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    goalCard: {
      flex: 1,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: spacing.lg,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    goalCardSelected: { borderColor: colors.accent, backgroundColor: `${colors.accent}1A` },
    goalLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
    goalSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    primaryButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    primaryButtonDisabled: { backgroundColor: colors.border },
    primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
