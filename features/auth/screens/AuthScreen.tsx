import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../../../shared/theme/theme';
import { useAuth } from '../AuthContext';
import { signInAsGuest, signInWithEmail, signUpWithEmail, upgradeGuestToEmail } from '../authActions';

/*
 * 로그인 / 가입 화면.
 *
 * 게스트 상태에서 들어오면 "새 계정 만들기"가 아니라 "계정 연결"로 동작한다.
 * 그래야 user_id가 유지되어 그동안 쌓은 진도와 XP가 따라온다. (authActions 참고)
 *
 * 구글/카카오는 각 개발자 콘솔 키 발급이 필요해서 이후 단계에서 추가한다.
 */
export function AuthScreen() {
  const router = useRouter();
  const { isGuest } = useAuth();

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
          {isGuest ? '게스트로 놓친 XP를 돌려받아요' : mode === 'signup' ? '회원가입' : '로그인'}
        </Text>
        {isGuest && (
          <Text style={styles.subtitle}>
            지금까지의 학습 기록은 그대로 유지돼요
          </Text>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
        {notice && <Text style={styles.notice}>{notice}</Text>}

        <TextInput
          style={styles.input}
          placeholder="이메일"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="비밀번호 (6자 이상)"
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
          <>
            <Pressable onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
              <Text style={styles.link}>
                {mode === 'signup' ? '이미 계정이 있어요' : '계정이 없어요 · 가입하기'}
              </Text>
            </Pressable>

            <Pressable style={styles.ghost} onPress={() => run(signInAsGuest)} disabled={busy}>
              <Text style={styles.ghostText}>나중에 하기</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm },
  error: { color: colors.error, fontSize: 14 },
  notice: { color: colors.success, fontSize: 14, lineHeight: 20 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
  },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { color: colors.primary, textAlign: 'center', paddingVertical: spacing.sm },
  ghost: { alignItems: 'center', paddingVertical: spacing.sm },
  ghostText: { color: colors.textMuted, fontSize: 15 },
});
