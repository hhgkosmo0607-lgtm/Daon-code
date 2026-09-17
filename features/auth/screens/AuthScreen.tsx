import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getReadableTextColor } from '../../../shared/theme/contrast';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { useAuth } from '../AuthContext';
import { signInAsGuest, signInWithEmail, signUpWithEmail, upgradeGuestToEmail } from '../authActions';

/*
 * 로그인 / 가입 화면.
 *
 * 게스트 상태에서 들어오면 "새 계정 만들기"가 아니라 "계정 연결"로 동작한다.
 * 그래야 user_id가 유지되어 그동안 쌓은 진도와 XP가 따라온다. (authActions 참고)
 *
 * 구글/카카오는 각 개발자 콘솔 키 발급이 필요해서 이후 단계에서 추가한다.
 *
 * 이 화면은 두 경로에서 재사용된다 (기획서 6번 온보딩):
 *  - 배치고사를 본 사람: ?allowGuest=false&context=placement — "나중에 하기" 없음
 *  - 1단계를 게스트로 다 푼 사람: isGuest=true라서 아래에서 자동으로 "나중에 하기"가 숨겨짐
 *  - 배치고사를 안 본 사람이 온보딩 마지막에 처음 보는 로그인: 기본값(둘 다 허용)
 */
export function AuthScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { isGuest } = useAuth();
  const { allowGuest, context } = useLocalSearchParams<{ allowGuest?: string; context?: string }>();
  const isPlacementGate = context === 'placement' && !isGuest;
  const showGuestOption = !isGuest && allowGuest !== 'false';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /**
   * 인증 동작 공통 처리.
   *
   * Supabase는 기본 설정에서 이메일 확인을 요구한다. 그 경우 가입/연결 직후에는
   * 세션이 생기지 않으므로, 무조건 홈으로 보내면 "가입했는데 로그인이 안 된" 상태가 된다.
   * 그래서 세션이 실제로 생겼을 때만 이동하고, 아니면 안내 문구를 띄운다.
   */
  const run = async (fn: () => Promise<{ session?: unknown } | unknown>, pendingMessage?: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = (await fn()) as { session?: unknown } | null;
      const hasSession = !!(result && typeof result === 'object' && 'session' in result && result.session);

      if (hasSession) {
        router.replace('/');
      } else {
        setNotice(pendingMessage ?? '메일함에서 인증 링크를 눌러 완료해주세요.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '문제가 생겼어요');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }

    if (isGuest) {
      // 게스트 → 정식 계정 전환 (진도 유지)
      return run(
        () => upgradeGuestToEmail(email, password),
        '메일함에서 인증 링크를 누르면 계정 연결이 끝나요. 그때까지 학습은 계속 이어서 할 수 있어요.'
      );
    }
    if (mode === 'signup') {
      return run(() => signUpWithEmail(email, password));
    }
    return run(() => signInWithEmail(email, password));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>
          {isGuest
            ? '게스트로 놓친 XP를 돌려받아요'
            : isPlacementGate
              ? '결과를 보려면 로그인이 필요해요'
              : mode === 'signup'
                ? '회원가입'
                : '로그인'}
        </Text>
        {isGuest && (
          <Text style={styles.subtitle}>
            지금까지의 학습 기록은 그대로 유지돼요
          </Text>
        )}
        {isPlacementGate && (
          <Text style={styles.subtitle}>
            가입하면 배치고사 결과에 맞는 레슨부터 바로 시작할 수 있어요
          </Text>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
        {notice && <Text style={styles.notice}>{notice}</Text>}

        <TextInput
          style={styles.input}
          placeholder="이메일"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호 (6자 이상)"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.primary} onPress={handleSubmit} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>
              {isGuest ? '계정 연결하기' : mode === 'signup' ? '가입하기' : '로그인'}
            </Text>
          )}
        </Pressable>

        {!isGuest && (
          <Pressable onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
            <Text style={styles.link}>
              {mode === 'signup' ? '이미 계정이 있어요' : '계정이 없어요 · 가입하기'}
            </Text>
          </Pressable>
        )}

        {showGuestOption && (
          <Pressable style={styles.ghost} onPress={() => run(signInAsGuest)} disabled={busy}>
            <Text style={styles.ghostText}>나중에 하기</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    body: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
    title: { fontSize: 22, fontWeight: '800', color: colors.text },
    subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm },
    error: { color: colors.error, fontSize: 14 },
    notice: { color: colors.success, fontSize: 14, lineHeight: 20 },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      fontSize: 15,
      color: colors.text,
    },
    primary: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    primaryText: { color: getReadableTextColor(colors.accent), fontSize: 16, fontWeight: '700' },
    link: { color: colors.accent, textAlign: 'center', paddingVertical: spacing.sm },
    ghost: { alignItems: 'center', paddingVertical: spacing.sm },
    ghostText: { color: colors.textMuted, fontSize: 15 },
  });
