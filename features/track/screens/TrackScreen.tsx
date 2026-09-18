import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing } from '../../../shared/theme/theme';
import { useTheme } from '../../../shared/theme/ThemeContext';
import type { ThemeColors } from '../../../shared/theme/themes';
import { useTrack } from '../TrackContext';

/*
 * 트랙(커리큘럼) 선택 화면.
 * 기존 "코딩 입문 + AI 활용"과 자격증 대비 등을 나란히 두고 고르게 한다.
 * (기능_로드맵.md 4번 — 자격증 트랙 병행 추가)
 */
export function TrackScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { trackId, tracks, setTrackId } = useTrack();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>커리큘럼</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {tracks.map((track) => {
          const selected = track.id === trackId;
          return (
            <Pressable
              key={track.id}
              style={[styles.row, selected && styles.rowSelected]}
              onPress={() => {
                setTrackId(track.id);
                router.back();
              }}
            >
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{track.label}</Text>
                {track.description && <Text style={styles.rowSub}>{track.description}</Text>}
              </View>
              {selected && <Text style={styles.check}>✓</Text>}
            </Pressable>
          );
        })}
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
    rowText: { flex: 1 },
    rowLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
    rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    check: { fontSize: 18, fontWeight: '800', color: colors.accent },
  });
