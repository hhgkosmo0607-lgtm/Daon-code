import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme/theme';
import type { ThemeColors } from '../theme/themes';
import { detectLanguageLabel } from './codeHighlight';
import { CODE_PANEL_BACKGROUND, HighlightedCode } from './HighlightedCode';

/*
 * 문제에 딸린 코드/터미널 출력을 보여주는 블록.
 * 가로로 긴 코드는 줄바꿈 대신 가로 스크롤로 처리한다.
 * (모바일에서 코드가 억지로 접히면 읽기가 더 어려워지기 때문)
 *
 * 배경은 테마의 border 색을 쓴다 — background/surface와는 다른 톤이라
 * "이건 코드 패널"이라는 구분이 생기면서도, 테마가 바뀌면 함께 바뀐다.
 *
 * 언어 라벨은 기본적으로 코드 내용에서 그때그때 추론한다(JS/JSX만 구분 —
 * ai-coding 트랙 스니펫은 전부 JS/JSX라서 콘텐츠 파일마다 값을 채워 넣을 이유가
 * 없다). `code` 필드가 에러 메시지·터미널 출력·빈칸 채우기 문장처럼 실제 코드가
 * 아닐 때도 있어서, 그런 경우는 라벨을 아예 안 띄운다.
 *
 * JS/JSX가 아닌 언어(Java 등)는 `language` prop으로 명시해야 한다 — 자동 추론은
 * "<대문자로시작하는이름"을 JSX 태그로 보기 때문에, 예를 들어 자바 제네릭
 * List<String>을 그대로 두면 JSX로 잘못 판단한다.
 */
export function CodeBlock({ code, language: explicitLanguage }: { code: string; language?: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const detected = useMemo(() => detectLanguageLabel(code), [code]);
  const language = explicitLanguage ?? detected;

  return (
    <View style={styles.wrap}>
      {language && <Text style={styles.language}>{language}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HighlightedCode code={code} style={styles.code} skipTags={!!explicitLanguage} />
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
    language: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.textMuted,
      marginBottom: spacing.xs,
    },
    code: {
      fontSize: 13,
      lineHeight: 20,
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    },
  });
