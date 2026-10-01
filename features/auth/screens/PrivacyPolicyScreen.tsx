import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../shared/theme/ThemeContext';
import { spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';

/*
 * 개인정보처리방침 — 계정 화면에서 연다.
 *
 * 내용은 지금 앱이 실제로 모으는 것(supabase/migrations의 테이블, 기기 저장소)에 맞춰 썼다.
 * 수집 항목이 늘면(결제, 푸시 알림 토큰 등) 여기도 같이 고쳐야 한다.
 *
 * TODO(출시 전): 아래 [대괄호] 자리를 실제 값으로 채운다. 플레이 콘솔에는 같은 내용을
 * 웹 주소로도 올려야 한다(앱 안 화면만으로는 안 됨).
 */
const OPERATOR = '[운영자 이름]';
const CONTACT = '[문의 이메일]';
const EFFECTIVE_DATE = '[시행일]';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. 수집하는 정보',
    body: [
      '• 계정: 계정 식별번호, 로그인 방식(이메일·구글·카카오·게스트), 이메일 주소(이메일 가입·계정 연결·소셜 로그인 시). 비밀번호는 암호화된 형태로만 저장되며 운영자도 볼 수 없습니다.',
      '• 학습 기록: 레슨 진도와 점수, 경험치(XP)·레벨, 연속 학습일, 날짜별 학습량, 틀린 문제 목록.',
      '• 앱 안 재화: 코인, 프리즘, 보유 펫과 팀, 채굴 기록.',
      '• 설정: 하루 목표, 온보딩에서 고른 알림 시간.',
      '• 기기에만 저장되는 정보(서버로 보내지 않음): 테마, 고른 커리큘럼, 온보딩을 마쳤는지 여부.',
      '이름·전화번호·위치·연락처·사진은 수집하지 않습니다.',
    ].join('\n'),
  },
  {
    title: '2. 이용 목적',
    body: '로그인과 계정 유지, 학습 진도 저장과 채점, 경험치·코인 지급, 연속 학습 기록, 문의 응대에만 씁니다. 광고나 마케팅에는 쓰지 않습니다.',
  },
  {
    title: '3. 보관 기간과 삭제',
    body: '계정을 삭제할 때까지 보관합니다. 앱의 [계정 → 계정 삭제](게스트는 [게스트 기록 삭제])를 누르면 위 정보가 즉시 모두 삭제되며 되돌릴 수 없습니다. 앱을 쓸 수 없는 경우 아래 문의처로 삭제를 요청할 수 있습니다.',
  },
  {
    title: '4. 제3자 제공',
    body: '수집한 정보를 다른 회사나 개인에게 제공하거나 판매하지 않습니다. 법령에 따라 요구되는 경우는 예외입니다.',
  },
  {
    title: '5. 처리를 맡기는 곳',
    body: [
      '• Supabase Inc.: 로그인과 데이터 저장 (서버 위치: 대한민국 서울)',
      '• Google LLC, (주)카카오: 해당 계정으로 로그인할 때의 본인 확인',
      '• 650 Industries, Inc.(Expo): 앱 업데이트 전송',
    ].join('\n'),
  },
  {
    title: '6. 이용자의 권리',
    body: '언제든 자신의 정보를 열람하거나 삭제할 수 있습니다. 학습 기록은 앱 화면에서 바로 볼 수 있고, 삭제는 3번의 방법으로 할 수 있습니다. 그 밖의 요청은 아래 문의처로 보내주세요.',
  },
  {
    title: '7. 개인정보 보호책임자',
    body: `${OPERATOR}\n${CONTACT}`,
  },
  {
    title: '8. 시행일',
    body: `이 방침은 ${EFFECTIVE_DATE}부터 적용됩니다. 내용이 바뀌면 앱 안에서 알려드립니다.`,
  },
];

export function PrivacyPolicyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>개인정보처리방침</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.intro}>
          {OPERATOR}(이하 &quot;운영자&quot;)는 Daon-code 앱 이용자의 개인정보를 아래와 같이 처리합니다.
        </Text>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
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
    body: { padding: spacing.lg, gap: spacing.lg },
    intro: { fontSize: 14, lineHeight: 21, color: colors.text },
    section: { gap: spacing.xs },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    sectionBody: { fontSize: 14, lineHeight: 21, color: colors.textMuted },
  });
