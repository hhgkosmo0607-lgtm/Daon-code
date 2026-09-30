import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '../../../shared/components/Toast';
import { setTeam } from '../../../shared/lib/edgeFunctions';
import { useTheme } from '../../../shared/theme/ThemeContext';
import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { useUserProgress } from '../../lesson/hooks/useUserProgress';
import { PetPortrait } from '../components/PetPortrait';
import { POINTS_PER_PRISM, TEAM_MAX, pointsPerHour } from '../domain/mining';
import { DEFAULT_PET_ID, PETS, miningPower, petById } from '../domain/petCatalog';

/*
 * 펫 관리 — 위에 팀 8칸, 아래에 가진 펫 2열.
 * 펫을 누르면 팀에 넣고/빼고 바로 저장한다(저장 버튼 없음, 잠깐 모아서 한 번에 보냄).
 * 팀만 광산·방에 나오고 채굴한다. 서버(set-team)가 가진 펫인지·개수를 다시 확인한다.
 * (daon-content/재화_경제.md)
 */

/** 연달아 누를 때 모아서 한 번에 저장하는 대기 시간 */
const SAVE_DELAY_MS = 600;

export function PetsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, reload } = useUserProgress();
  const toast = useToast();

  const owned = profile?.owned_pets ?? [DEFAULT_PET_ID];
  const savedTeam = profile?.team_pets ?? [DEFAULT_PET_ID];
  /** 저장이 끝나기 전 화면에 먼저 보여주는 팀 */
  const [draft, setDraft] = useState<string[] | null>(null);
  const team = draft ?? savedTeam;

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    []
  );

  const scheduleSave = (next: string[]) => {
    setDraft(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await setTeam(next);
        await reload();
        setDraft(null);
      } catch (e) {
        setDraft(null); // 저장된 팀으로 되돌린다
        toast.show(e instanceof Error ? e.message : '팀을 저장하지 못했어요', 'error');
      }
    }, SAVE_DELAY_MS);
  };

  const toggle = (id: string) => {
    if (team.includes(id)) {
      if (team.length <= 1) {
        toast.show('팀에는 최소 1마리가 있어야 해요', 'error');
        return;
      }
      scheduleSave(team.filter((t) => t !== id));
    } else {
      if (team.length >= TEAM_MAX) {
        toast.show(`팀은 ${TEAM_MAX}마리까지예요 · 위에서 한 마리를 빼 주세요`, 'error');
        return;
      }
      scheduleSave([...team, id]);
    }
  };

  // 프리즘 펫 먼저, 그다음 목록 순서
  const ownedPets = PETS.filter((p) => owned.includes(p.id));
  const perDay = (pointsPerHour(miningPower(team)) * 24) / POINTS_PER_PRISM;
  const slots = Array.from({ length: TEAM_MAX }, (_, i) => team[i] ?? null);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>펫 관리</Text>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="닫기">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.teamBar}>
        <View style={styles.teamHead}>
          <Text style={styles.teamTitle}>
            팀 {team.length}/{TEAM_MAX}
          </Text>
          <Text style={styles.teamSub}>하루 프리즘 약 {perDay.toFixed(1)}개</Text>
        </View>
        <View style={styles.slots}>
          {slots.map((id, i) =>
            id ? (
              <Pressable
                key={id}
                style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
                onPress={() => toggle(id)}
                accessibilityRole="button"
                accessibilityLabel={`${petById(id)?.label ?? id}, 팀에서 빼기`}
              >
                <PetPortrait petId={id} pixel={1} />
              </Pressable>
            ) : (
              <View key={`empty-${i}`} style={[styles.slot, styles.slotEmpty]} />
            )
          )}
        </View>
        <Text style={styles.hint}>펫을 누르면 팀에 넣고 빼요 · 팀만 광산에 나와 캐요</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionTitle}>가진 펫 {owned.length}마리</Text>
        <View style={styles.grid}>
          {ownedPets.map((pet) => {
            const inTeam = team.includes(pet.id);
            return (
              <Pressable
                key={pet.id}
                style={({ pressed }) => [
                  styles.card,
                  inTeam && styles.cardInTeam,
                  pressed && styles.pressed,
                ]}
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
                <Text style={[styles.state, inTeam && { color: colors.accent }]}>
                  {inTeam ? '✓ 팀' : '+ 팀에 넣기'}
                  {pet.power > 1 ? '  ★3배' : ''}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            style={({ pressed }) => [styles.card, styles.shopCard, pressed && styles.pressed]}
            onPress={() => router.push('/shop')}
            accessibilityRole="button"
            accessibilityLabel="상점에서 펫 더 데려오기"
          >
            <Text style={styles.shopText}>+ 상점에서{'\n'}더 데려오기</Text>
          </Pressable>
        </View>
      </ScrollView>
      {toast.element}
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
      gap: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    teamHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    teamTitle: { fontSize: 15, fontWeight: '800', color: colors.text, fontFamily: fonts.mono },
    teamSub: { fontSize: 12, color: colors.textMuted },
    // 팀 8칸 — 한 줄에 4칸씩 두 줄
    slots: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    slot: {
      width: '23.5%',
      aspectRatio: 30 / 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2a2533',
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: radius.sm,
    },
    slotEmpty: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
      borderStyle: 'dashed',
    },
    hint: { fontSize: 11, color: colors.textMuted },
    body: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl * 2 },
    sectionTitle: { fontSize: 13, fontWeight: '800', color: colors.textMuted },
    // 2열 격자
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    card: {
      width: '48%',
      flexGrow: 1,
      alignItems: 'center',
      gap: 6,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
    },
    cardInTeam: { borderColor: colors.accent, borderWidth: 2 },
    pressed: { opacity: 0.7 },
    shopCard: { justifyContent: 'center', minHeight: 120, borderStyle: 'dashed' },
    shopText: { fontSize: 13, color: colors.accent, textAlign: 'center', fontWeight: '700' },
    portraitBox: {
      backgroundColor: '#2a2533',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    name: { fontSize: 13, fontWeight: '700', color: colors.text },
    state: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.mono },
  });
