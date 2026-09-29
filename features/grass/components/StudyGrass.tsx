import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { supabase } from '../../../shared/lib/supabase';
import { fonts, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { toKstDateString } from '../../lesson/domain/streak';
import {
  buildGrass,
  grassStartDate,
  studiedDays,
  type DailyXpRow,
  type GrassLevel,
} from '../domain/grass';

/*
 * 학습 잔디 — 홈 상단바의 레벨 바를 누르면 펼쳐지는 설명 패널 안에 들어간다.
 * 날짜별 XP는 submit-answer가 daily_xp에 이미 쌓고 있어서 읽기만 한다 (RLS: 본인 행만).
 */

const WEEKS = 17; // 약 4달 — 좁은 폰에서도 한 줄에 들어가는 폭
const CELL = 12;
const GAP = 3;
/** 진하기 단계별 불투명도 (0단계는 테두리 색 빈 칸) */
const LEVEL_OPACITY: Record<GrassLevel, number> = { 0: 1, 1: 0.3, 2: 0.55, 3: 0.8, 4: 1 };

async function fetchDailyXp(userId: string, from: string): Promise<DailyXpRow[]> {
  const { data, error } = await supabase
    .from('daily_xp')
    .select('date, xp')
    .eq('user_id', userId)
    .gte('date', from);
  if (error) throw error;
  return data ?? [];
}

export function StudyGrass({
  userId,
  dailyGoal,
  colors,
}: {
  userId: string;
  dailyGoal: number;
  colors: ThemeColors;
}) {
  const today = toKstDateString();
  const [rows, setRows] = useState<DailyXpRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchDailyXp(userId, grassStartDate(today, WEEKS))
      .then((data) => !cancelled && setRows(data))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [userId, today]);

  const columns = useMemo(
    () => buildGrass(rows ?? [], today, WEEKS, dailyGoal),
    [rows, today, dailyGoal]
  );
  const days = studiedDays(columns);

  if (failed) {
    return (
      <Text style={[styles.caption, { color: colors.textMuted }]}>잔디를 불러오지 못했어요</Text>
    );
  }

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={`최근 ${WEEKS}주 동안 ${days}일 학습했어요`}
    >
      <View style={styles.grid}>
        {columns.map((week) => (
          <View key={week[0].date} style={styles.column}>
            {week.map((cell) => (
              <View
                key={cell.date}
                style={[
                  styles.cell,
                  cell.future
                    ? styles.hidden
                    : cell.level === 0
                      ? { backgroundColor: colors.border }
                      : { backgroundColor: colors.success, opacity: LEVEL_OPACITY[cell.level] },
                  cell.date === today && { borderWidth: 1, borderColor: colors.text },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
      <Text style={[styles.caption, { color: colors.textMuted }]}>
        {rows === null
          ? '잔디 불러오는 중…'
          : `최근 ${WEEKS}주 · ${days}일 학습 · 진할수록 목표(${dailyGoal}xp)에 가까움`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.sm, gap: spacing.xs },
  grid: { flexDirection: 'row', gap: GAP },
  column: { gap: GAP },
  cell: { width: CELL, height: CELL, borderRadius: 2 },
  hidden: { opacity: 0 },
  caption: { fontSize: 11, fontFamily: fonts.mono },
});
