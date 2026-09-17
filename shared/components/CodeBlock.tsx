import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/theme';
import type { ThemeColors } from '../theme/themes';
import { CODE_PANEL_BACKGROUND, HighlightedCode } from './HighlightedCode';

/*
 * 문제에 딸린 코드/터미널 출력을 보여주는 블록.
 * 가로로 긴 코드는 줄바꿈 대신 가로 스크롤로 처리한다.
 * (모바일에서 코드가 억지로 접히면 읽기가 더 어려워지기 때문)
 *
 * 배경은 테마의 border 색을 쓴다 — background/surface와는 다른 톤이라
 * "이건 코드 패널"이라는 구분이 생기면서도, 테마가 바뀌면 함께 바뀐다.
 */
export function CodeBlock({ code }: { code: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HighlightedCode code={code} style={styles.code} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: CODE_PANEL_BACKGROUND(colors),
      borderRadius: radius.md,
      padding: spacing.md,
      marginVertical: spacing.md,
    },
    code: {
      fontSize: 13,
      lineHeight: 20,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    },
  });
