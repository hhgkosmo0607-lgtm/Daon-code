import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { adminTool, type AdminAction } from '../../../shared/lib/edgeFunctions';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { useUserProgress } from '../../lesson/hooks/useUserProgress';

/*
 * 운영자 테스트 메뉴 — 운영자 계정(profiles.is_admin)에만 홈에 🛠 버튼이 보인다.
 * 실제 권한 확인은 서버(admin-tools Edge Function)가 한다.
 */

const TOOLS: { label: string; desc: string; request: AdminAction }[] = [
  {
    label: '코인 +1,000',
    desc: '코인 고양이 구매 확인',
    request: { action: 'grant', coins: 1000 },
  },
  {
    label: '프리즘 +100',
    desc: '무지개·교환·스트릭 지키기 확인',
    request: { action: 'grant', prisms: 100 },
  },
  {
    label: '오늘 출석 초기화',
    desc: '홈으로 돌아가면 출석 채굴 보상을 다시 받는다',
    request: { action: 'reset_checkin' },
  },
  {
    label: '하루 빠진 상태 만들기',
    desc: '마지막 학습을 그저께로 → 홈에 "스트릭 지킬래요?" 배너',
    request: { action: 'miss_day' },
  },
  { label: '고양이 초기화', desc: '치즈만 남기기', request: { action: 'reset_cats' } },
];

export function AdminScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, reload } = useUserProgress();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const run = async (label: string, request: AdminAction) => {
    setBusy(label);
    setMessage(null);
    try {
      await adminTool(request);
      await reload();
      setMessage({ text: `${label} 완료`, ok: true });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : '실패했어요', ok: false });
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>🛠 운영자 테스트</Text>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="닫기">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {profile && (
          <Text style={styles.state}>
            코인 {profile.coins} · 프리즘 {profile.prisms} · 스트릭 {profile.streak}일 · 고양이{' '}
            {profile.owned_cats.length}마리{'\n'}
            마지막 학습 {profile.last_study_date ?? '-'} · 마지막 출석{' '}
            {profile.last_checkin_date ?? '-'}
          </Text>
        )}
        {message && (
          <Text style={[styles.desc, { color: message.ok ? colors.success : colors.error }]}>
            {message.text}
          </Text>
        )}

        {TOOLS.map((tool) => (
          <Pressable
            key={tool.label}
            style={[styles.tool, busy && styles.disabled]}
            onPress={() => run(tool.label, tool.request)}
            disabled={!!busy}
            accessibilityRole="button"
            accessibilityLabel={tool.label}
          >
            <View style={styles.toolText}>
              <Text style={styles.label}>{tool.label}</Text>
              <Text style={styles.desc}>{tool.desc}</Text>
            </View>
            {busy === tool.label && <ActivityIndicator color={colors.accent} />}
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { fontSize: 18, fontWeight: '800', color: colors.text },
    close: { fontSize: 20, color: colors.textMuted },
    body: { padding: spacing.md, gap: spacing.sm },
    state: { fontSize: 12, color: colors.text, fontFamily: fonts.mono, marginBottom: spacing.sm },
    tool: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: spacing.md,
    },
    disabled: { opacity: 0.5 },
    toolText: { flex: 1 },
    label: { fontSize: 15, fontWeight: '700', color: colors.text },
    desc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  });
