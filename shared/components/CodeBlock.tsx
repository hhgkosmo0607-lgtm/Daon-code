import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { radius, spacing } from '../theme/theme';

/*
 * 문제에 딸린 코드/터미널 출력을 보여주는 블록.
 * 가로로 긴 코드는 줄바꿈 대신 가로 스크롤로 처리한다.
 * (모바일에서 코드가 억지로 접히면 읽기가 더 어려워지기 때문)
 */
export function CodeBlock({ code }: { code: string }) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text style={styles.code}>{code}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#1E2430',
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  code: {
    color: '#E6E6E6',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
});
