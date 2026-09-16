import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing } from '../../../shared/theme/theme';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { THEMES, type ThemeColors, type ThemeDefinition } from '../../../shared/theme/themes';

/*
 * 테마 선택 화면 (상점 아님 — 가격/구매 개념 없이 10종 전부 바로 고를 수 있다).
 * 나중에 유료화를 붙이게 되면 이 화면 위에 `free` 필드로 잠금만 얹으면 된다.
 */
export function ThemeScreen() {
  const router = useRouter();
  const { themeId, colors, setThemeId } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>테마</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {Object.values(THEMES).map((theme) => (
          <ThemeRow
            key={theme.id}
            theme={theme}
            selected={theme.id === themeId}
            onPress={() => setThemeId(theme.id)}
            rowStyles={styles}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ThemeRow({
  theme,
  selected,
  onPress,
  rowStyles,
}: {
  theme: ThemeDefinition;
  selected: boolean;
  onPress: () => void;
  rowStyles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[rowStyles.row, selected && rowStyles.rowSelected]}
    >
      <View style={[rowStyles.swatch, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
        <View style={[rowStyles.swatchDot, { backgroundColor: theme.colors.accent }]} />
        <View style={[rowStyles.swatchDot, { backgroundColor: theme.colors.success }]} />
        <View style={[rowStyles.swatchDot, { backgroundColor: theme.colors.error }]} />
      </View>

      <View style={rowStyles.rowText}>
        <Text style={rowStyles.rowLabel}>{theme.label}</Text>
        <Text style={rowStyles.rowSub}>{theme.mode === 'dark' ? '다크' : '라이트'}</Text>
      </View>

      {selected && <Text style={rowStyles.check}>✓</Text>}
    </Pressable>
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
    list: { padding: spacing.md, gap: spacing.sm },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      padding: spacing.md,
    },
    rowSelected: { borderColor: colors.accent },
    swatch: {
      width: 44,
      height: 44,
      borderRadius: radius.sm,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    swatchDot: { width: 8, height: 8, borderRadius: 4 },
    rowText: { flex: 1 },
    rowLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
    rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    check: { fontSize: 18, fontWeight: '800', color: colors.accent },
  });
