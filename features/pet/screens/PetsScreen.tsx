import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setTeam } from '../../../shared/lib/edgeFunctions';
import { getReadableTextColor } from '../../../shared/theme/contrast';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { useUserProgress } from '../../lesson/hooks/useUserProgress';
import { PetPortrait } from '../components/PetPortrait';
import { MINE_PER_CAT, TEAM_MAX, minePerCheckIn } from '../domain/mining';
import { DEFAULT_PET_ID, PETS, miningPower, petById } from '../domain/petCatalog';

/*
 * 내 펫 — 가진 펫을 2열로 보여주고, 팀(화면에 나오고 출석 때 채굴하는 펫, 최대 8마리)을 고른다.
 * 누르면 팀에 넣고 빼고, "팀 저장"을 누르면 서버(set-team)가 확인하고 저장한다.
 * (daon-content/재화_경제.md)
 */
export function PetsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, reload } = useUserProgress();

  const owned = profile?.owned_pets ?? [DEFAULT_PET_ID];
  const savedTeam = profile?.team_pets ?? [DEFAULT_PET_ID];
  /** 고치는 중인 팀 — 저장 전까지는 화면에만 */
  const [draft, setDraft] = useState<string[] | null>(null);
  const team = draft ?? savedTeam;
  const changed = draft !== null && draft.join() !== savedTeam.join();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  // 프리즘 펫 먼저, 그다음 목록 순서
  const ownedPets = PETS.filter((p) => owned.includes(p.id));

  const toggle = (id: string) => {
    setMessage(null);
    if (team.includes(id)) {
      if (team.length <= 1) {
        setMessage({ text: '팀에는 최소 1마리가 있어야 해요', ok: false });
        return;
      }
      setDraft(team.filter((t) => t !== id));
    } else {
      if (team.length >= TEAM_MAX) {
        setMessage({ text: `팀은 ${TEAM_MAX}마리까지예요 · 한 마리를 먼저 빼 주세요`, ok: false });
        return;
      }
      setDraft([...team, id]);
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await setTeam(team);
      await reload();
      setDraft(null);
      setMessage({ text: '팀을 저장했어요', ok: true });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : '저장하지 못했어요', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const power = miningPower(team);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>
          내 펫 {owned.length}/{PETS.length}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="닫기">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.teamBar}>
        <Text style={styles.teamTitle}>
          팀 {team.length}/{TEAM_MAX} · 출석마다 게이지 +{minePerCheckIn(power)}
        </Text>
        <Text style={styles.sub}>
          팀만 광산·방에 나오고 채굴해요 · 코인 펫 +{MINE_PER_CAT}, 프리즘 펫 +3
        </Text>
        {message && (
          <Text style={[styles.sub, { color: message.ok ? colors.success : colors.error }]}>
            {message.text}
          </Text>
        )}
        {changed && (
          <Pressable
            style={[styles.saveButton, saving && styles.disabled]}
            onPress={save}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="팀 저장"
          >
            {saving ? (
              <ActivityIndicator color={getReadableTextColor(colors.accent)} />
            ) : (
              <Text style={styles.saveText}>팀 저장</Text>
            )}
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {ownedPets.map((pet) => {
          const inTeam = team.includes(pet.id);
          return (
            <Pressable
              key={pet.id}
              style={[styles.card, inTeam && styles.cardInTeam]}
              onPress={() => toggle(pet.id)}
              accessibilityRole="button"
              accessibilityLabel={`${pet.label}, ${inTeam ? '팀에 있음' : '팀에 없음'}`}
              accessibilityState={{ selected: inTeam }}
            >
              <View style={styles.portraitBox}>
                <PetPortrait petId={pet.id} />
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {pet.label}
              </Text>
              <Text style={[styles.sub, inTeam && { color: colors.accent }]}>
                {inTeam ? '팀 ✓' : '팀에 넣기'} · 채굴력 {petById(pet.id)?.power ?? 1}
                {pet.power > 1 ? ' ★' : ''}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          style={[styles.card, styles.shopCard]}
          onPress={() => router.push('/shop')}
          accessibilityRole="button"
          accessibilityLabel="상점에서 펫 더 데려오기"
        >
          <Text style={styles.shopText}>+ 상점에서{'\n'}더 데려오기</Text>
        </Pressable>
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
    teamBar: {
      padding: spacing.md,
      gap: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    teamTitle: { fontSize: 14, fontWeight: '800', color: colors.text, fontFamily: fonts.mono },
    saveButton: {
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      minWidth: 96,
      alignItems: 'center',
    },
    saveText: { fontSize: 14, fontWeight: '800', color: getReadableTextColor(colors.accent) },
    disabled: { opacity: 0.5 },
    // 2열 격자
    grid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.md, gap: spacing.sm },
    card: {
      width: '48%',
      flexGrow: 1,
      alignItems: 'center',
      gap: 4,
      paddingVertical: spacing.sm,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
    },
    cardInTeam: { borderColor: colors.accent },
    shopCard: { justifyContent: 'center', minHeight: 96, borderStyle: 'dashed' },
    shopText: { fontSize: 13, color: colors.accent, textAlign: 'center', fontWeight: '700' },
    portraitBox: {
      backgroundColor: '#2a2533',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    name: { fontSize: 13, fontWeight: '700', color: colors.text },
    sub: { fontSize: 11, color: colors.textMuted, fontFamily: fonts.mono },
  });
