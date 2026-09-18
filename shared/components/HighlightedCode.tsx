import { useMemo } from 'react';
import { Text, type TextStyle } from 'react-native';
import { ensureContrast } from '../theme/contrast';
import { useTheme } from '../theme/ThemeContext';
import type { ThemeColors } from '../theme/themes';
import { tokenizeCode, type CodeTokenType } from './codeHighlight';

/** 코드 블록의 배경 — CodeBlock/QuestionCompare가 실제로 칠하는 배경과 반드시 맞춰야 한다. */
export const CODE_PANEL_BACKGROUND = (colors: ThemeColors) => colors.border;

/*
 * 토큰 종류별 색을 테마의 강조색(accent/success/error/xp/textMuted)에서 가져오되,
 * 코드 배경(CODE_PANEL_BACKGROUND) 위에서 대비가 부족하면 검정/흰색 쪽으로 살짝
 * 밝기를 옮겨서(ensureContrast) 테마가 뭐든 항상 읽히게 만든다.
 */
function buildTokenColors(colors: ThemeColors): Record<CodeTokenType, string> {
  const bg = CODE_PANEL_BACKGROUND(colors);
  return {
    keyword: ensureContrast(colors.accent, bg),
    tag: ensureContrast(colors.error, bg),
    string: ensureContrast(colors.success, bg),
    number: ensureContrast(colors.xp, bg),
    function: ensureContrast(colors.success, bg),
    comment: ensureContrast(colors.textMuted, bg),
    plain: ensureContrast(colors.text, bg),
  };
}

/** 코드 문자열을 토큰별로 색을 입혀서 보여준다 (CodeBlock, compare 유형이 함께 씀). */
export function HighlightedCode({
  code,
  style,
  skipTags,
}: {
  code: string;
  style?: TextStyle;
  skipTags?: boolean;
}) {
  const { colors } = useTheme();
  const tokenColors = useMemo(() => buildTokenColors(colors), [colors]);
  const tokens = useMemo(() => tokenizeCode(code, { skipTags }), [code, skipTags]);

  return (
    <Text style={[{ color: tokenColors.plain }, style]}>
      {tokens.map((token, i) => (
        <Text key={i} style={{ color: tokenColors[token.type] }}>
          {token.text}
        </Text>
      ))}
    </Text>
  );
}
