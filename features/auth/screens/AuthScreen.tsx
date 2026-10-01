import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchGuestEarnedXp } from '../../lesson/data/userRepository';
import { calculatePendingBonus } from '../../lesson/domain/scoring';
import { getReadableTextColor } from '../../../shared/theme/contrast';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { useAuth } from '../AuthContext';
import {
  signInAsGuest,
  signInWithEmail,
  signInWithGoogle,
  signInWithKakao,
  signUpWithEmail,
  upgradeGuestToEmail,
} from '../authActions';

/*
 * 로그인 / 가입 화면.
 *
 * 게스트 상태에서 들어오면 "새 계정 만들기"가 아니라 "계정 연결"로 동작한다.
 * 그래야 user_id가 유지되어 그동안 쌓은 진도와 XP가 따라온다. (authActions 참고)
 *
 * 구글/카카오 버튼은 코드상으로는 동작하지만, Supabase 대시보드에 각 프로바이더의
 * 클라이언트 키가 등록돼야 실제로 로그인까지 이어진다(authActions.ts 참고).
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
  const { user, isGuest } = useAuth();
  const { allowGuest, context, guestMode: initialGuestMode } = useLocalSearchParams<{
    allowGuest?: string;
    context?: string;
    /** 계정 화면의 "이미 있는 계정으로 로그인"에서 오면 'signin'으로 바로 연다 */
    guestMode?: string;
  }>();
  const isPlacementGate = context === 'placement' && !isGuest;
  const showGuestOption = !isGuest && allowGuest !== 'false';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  // 게스트: 'link' = 지금 기록에 이메일을 붙여 계정 연결, 'signin' = 이미 있는 계정(운영자·테스트 등)으로 로그인
  const [guestMode, setGuestMode] = useState<'link' | 'signin'>(
    initialGuestMode === 'signin' ? 'signin' : 'link'
  );
  const linking = isGuest && guestMode === 'link';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingBonus, setPendingBonus] = useState<number | null>(null);

  // 게스트가 이 화면에 들어오면, 지금 계정을 연결했을 때 얼마를 더 받는지 미리 계산해둔다.
  // (로그인 전환 성공 시 이 화면을 바로 벗어나므로, isGuest가 꺼질 때 되돌릴 필요는 없다)
  useEffect(() => {
    if (!isGuest || !user) return;
    let cancelled = false;
    fetchGuestEarnedXp(user.id)
      .then((earnedXp) => {
        if (!cancelled) setPendingBonus(calculatePendingBonus(earnedXp));
      })
      .catch(() => {
        if (!cancelled) setPendingBonus(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isGuest, user]);

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
        // replace('/')는 모달 위에 홈을 하나 더 쌓는다. 이미 있는 홈까지 닫고, 없으면 홈으로 바꾼다.
        router.dismissTo('/');
      } else {
        setNotice(pendingMessage ?? '메일함에서 인증 링크를 눌러 완료해주세요.');
      }
    } catch (e) {
      setError(authErrorMessage(e, linking));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = () => run(signInWithGoogle, '로그인이 취소됐어요');
  const handleKakao = () => run(signInWithKakao, '로그인이 취소됐어요');

  const handleSubmit = () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }

    if (linking) {
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
          {linking
            ? '게스트로 놓친 XP를 돌려받아요'
            : isGuest
              ? '이미 있는 계정으로 로그인'
              : isPlacementGate
              ? '결과를 보려면 로그인이 필요해요'
              : mode === 'signup'
                ? '회원가입'
                : '로그인'}
        </Text>
        {isGuest && (
          <Text style={styles.subtitle}>
            {linking
              ? '지금까지의 학습 기록은 그대로 유지돼요'
              : '지금 게스트 기록은 그 계정으로 옮겨지지 않아요'}
          </Text>
        )}
        {linking && pendingBonus !== null && pendingBonus > 0 && (
          <Text style={styles.bonus}>지금 가입하면 XP {pendingBonus}와 코인을 추가로 받아요</Text>
        )}
        {isPlacementGate && (
          <Text style={styles.subtitle}>
            가입하면 배치고사 결과에 맞는 레슨부터 바로 시작할 수 있어요
          </Text>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
        {notice && <Text style={styles.notice}>{notice}</Text>}

        {/*
          게스트(isGuest)는 여기서 숨긴다: signInWithOAuth는 "새 로그인"이라
          지금 이 익명 세션과는 별개의 새 계정을 만들어버려서, 그동안 쌓은
          진도가 끊긴다. 게스트를 이어서 데려가려면 linkIdentity로 별도
          구현해야 하는데 RN에서는 동작이 더 까다로워서 아직 안 붙였다 —
          게스트는 지금처럼 이메일 연결(upgradeGuestToEmail)만 가능하다.
        */}
        {!isGuest && (
          <>
            <Pressable style={styles.social} onPress={handleGoogle} disabled={busy}>
              <Text style={styles.socialText}>구글로 계속하기</Text>
            </Pressable>
            <Pressable style={styles.social} onPress={handleKakao} disabled={busy}>
              <Text style={styles.socialText}>카카오로 계속하기</Text>
            </Pressable>
            <Text style={styles.divider}>또는 이메일로</Text>
          </>
        )}

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
            <ActivityIndicator color={getReadableTextColor(colors.accent)} />
          ) : (
            <Text style={styles.primaryText}>
              {linking ? '계정 연결하기' : isGuest ? '로그인' : mode === 'signup' ? '가입하기' : '로그인'}
            </Text>
          )}
        </Pressable>

        {isGuest && (
          <Pressable
            onPress={() => {
              setGuestMode(linking ? 'signin' : 'link');
              setError(null);
              setNotice(null);
            }}
          >
            <Text style={styles.link}>
              {linking ? '이미 계정이 있어요 · 로그인' : '← 지금 기록으로 계정 연결하기'}
            </Text>
          </Pressable>
        )}

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

/** Supabase 인증 오류(영어)를 사용자에게 보여줄 한국어로 */
function authErrorMessage(e: unknown, linking: boolean): string {
  const raw = e instanceof Error ? e.message : '';
  if (/already (been )?registered|already exists/i.test(raw)) {
    return linking
      ? '이미 가입된 이메일이에요. 아래 "이미 계정이 있어요 · 로그인"으로 들어가세요'
      : '이미 가입된 이메일이에요';
  }
  if (/invalid login credentials/i.test(raw)) return '이메일이나 비밀번호가 맞지 않아요';
  if (/password should be at least/i.test(raw)) return '비밀번호는 6자 이상이어야 해요';
  if (/invalid.*email|email.*invalid/i.test(raw)) return '이메일 형식을 확인해주세요';
  return raw || '문제가 생겼어요';
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    body: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
    title: { fontSize: 22, fontWeight: '800', color: colors.text },
    subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm },
    bonus: { fontSize: 14, color: colors.accent, fontWeight: '700', marginBottom: spacing.sm },
    error: { color: colors.error, fontSize: 14 },
    notice: { color: colors.success, fontSize: 14, lineHeight: 20 },
    social: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    socialText: { color: colors.text, fontSize: 15, fontWeight: '600' },
    divider: {
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 12,
      marginVertical: spacing.sm,
    },
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
