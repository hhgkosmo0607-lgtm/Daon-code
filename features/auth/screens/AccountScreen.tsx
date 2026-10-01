import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getReadableTextColor } from '../../../shared/theme/contrast';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { useAuth } from '../AuthContext';
import { deleteAccountAndSignOut, signOut } from '../authActions';

/*
 * 계정 화면 — 홈 상단바의 "게스트"/"계정" 배지로 들어온다.
 *
 * 스토어 정책상 계정을 만들 수 있는 앱은 앱 안에서 로그아웃·계정 삭제를 할 수 있어야 한다.
 * 게스트(익명) 계정도 서버에 기록이 남으므로 똑같이 지울 수 있게 했다.
 *
 * 게스트 로그아웃은 일부러 두지 않았다: 익명 계정은 로그아웃하면 다시 들어갈 방법이 없어서
 * 기록만 서버에 고아로 남는다. 게스트는 "계정 연결" 또는 "기록 삭제" 둘 중 하나로 정리한다.
 *
 * 로그아웃·삭제 뒤에는 이 모달만 닫는다 — 세션이 없으면 첫 화면(app/index.tsx)이
 * 알아서 로그인 화면을 보여준다.
 */
export function AccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, isGuest } = useAuth();

  // 삭제는 두 번 눌러야 한다: 한 번 누르면 경고와 확인 버튼이 펼쳐진다.
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.back();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : '문제가 생겼어요');
      setBusy(false);
    }
  };

  const provider = user?.app_metadata?.provider;
  const providerLabel =
    provider === 'google' ? '구글' : provider === 'kakao' ? '카카오' : provider === 'email' ? '이메일' : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>계정</Text>
        <Pressable onPress={() => router.back()} hitSlop={12} disabled={busy}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Text style={styles.label}>{isGuest ? '게스트' : '로그인 계정'}</Text>
          <Text style={styles.value}>
            {isGuest
              ? '이 기기에서만 이어지는 임시 계정이에요'
              : `${user?.email ?? '이메일 없음'}${providerLabel ? ` · ${providerLabel}` : ''}`}
          </Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {isGuest ? (
          <>
            <Pressable style={styles.primary} onPress={() => router.push('/auth')} disabled={busy}>
              <Text style={styles.primaryText}>계정 연결하기 (기록 유지)</Text>
            </Pressable>
            <Pressable
              style={styles.row}
              onPress={() => router.push({ pathname: '/auth', params: { guestMode: 'signin' } })}
              disabled={busy}
            >
              <Text style={styles.rowText}>이미 있는 계정으로 로그인</Text>
              <Text style={styles.rowHint}>지금 게스트 기록은 옮겨지지 않아요</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.row} onPress={() => run(signOut)} disabled={busy}>
            <Text style={styles.rowText}>로그아웃</Text>
          </Pressable>
        )}

        <Pressable style={styles.row} onPress={() => router.push('/settings/privacy')} disabled={busy}>
          <Text style={styles.rowText}>개인정보처리방침</Text>
        </Pressable>

        <View style={styles.danger}>
          {!confirmingDelete ? (
            <Pressable onPress={() => setConfirmingDelete(true)} disabled={busy}>
              <Text style={styles.dangerLink}>{isGuest ? '게스트 기록 삭제' : '계정 삭제'}</Text>
            </Pressable>
          ) : (
            <>
              <Text style={styles.dangerText}>
                학습 기록·XP·코인·프리즘·펫이 전부 지워지고 되돌릴 수 없어요.
                {isGuest ? '' : ' 같은 이메일로 다시 가입해도 복구되지 않아요.'}
              </Text>
              <View style={styles.dangerButtons}>
                <Pressable
                  style={styles.cancel}
                  onPress={() => setConfirmingDelete(false)}
                  disabled={busy}
                >
                  <Text style={styles.cancelText}>취소</Text>
                </Pressable>
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => run(deleteAccountAndSignOut)}
                  disabled={busy}
                >
                  {busy ? (
                    <ActivityIndicator color={getReadableTextColor(colors.error)} />
                  ) : (
                    <Text style={styles.deleteText}>영구 삭제</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
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
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    label: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.mono },
    value: { fontSize: 15, color: colors.text, fontWeight: '600' },
    error: { color: colors.error, fontSize: 14 },
    primary: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    primaryText: { color: getReadableTextColor(colors.accent), fontSize: 15, fontWeight: '700' },
    row: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: 2,
    },
    rowText: { fontSize: 15, color: colors.text, fontWeight: '600' },
    rowHint: { fontSize: 12, color: colors.textMuted },
    danger: {
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing.sm,
    },
    dangerLink: { color: colors.error, fontSize: 14, textAlign: 'center', paddingVertical: spacing.sm },
    dangerText: { color: colors.text, fontSize: 14, lineHeight: 20 },
    dangerButtons: { flexDirection: 'row', gap: spacing.sm },
    cancel: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    cancelText: { color: colors.text, fontSize: 15, fontWeight: '600' },
    deleteButton: {
      flex: 1,
      backgroundColor: colors.error,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    deleteText: { color: getReadableTextColor(colors.error), fontSize: 15, fontWeight: '700' },
  });
