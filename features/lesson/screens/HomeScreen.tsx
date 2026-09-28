import { useFocusEffect, useRouter } from 'expo-router';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../shared/theme/ThemeContext';
import { fonts, radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { useAuth } from '../../auth/AuthContext';
import { TerminalPet } from '../../pet/components/TerminalPet';
import { useTrack } from '../../track/TrackContext';
import { getLessons, getStages, hasContent } from '../data/contentRepository';
import { XP_PER_LEVEL, levelProgress } from '../domain/scoring';
import { displayStreak, toKstDateString } from '../domain/streak';
import { useUserProgress } from '../hooks/useUserProgress';
import { useWrongAnswerCount } from '../hooks/useWrongAnswerCount';

/*
 * 홈 — 학습 경로 화면.
 *
 * 레슨은 순서와 상관없이 전부 자유롭게 눌러볼 수 있다 (잠금 없음).
 * 완료 표시(●)만 실제 진도(progress 테이블, useUserProgress)를 그대로 보여준다.
 */

export function HomeScreen() {
  const router = useRouter();
  const { track } = useTrack();
  const stages = getStages(track.id);
  const lessons = getLessons(track.id);

  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { user, isGuest } = useAuth();
  const { profile, statusMap, loading, error, reload } = useUserProgress();
  // 레슨·상점 같은 모달에서 돌아오면 XP·코인이 바뀌었을 수 있어서 다시 불러온다
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );
  const { count: wrongAnswerCount } = useWrongAnswerCount();

  // DB의 streak는 제출할 때만 갱신되므로, 며칠 쉬어서 끊긴 스트릭은 여기서 0으로 보여준다
  // 오늘 날짜가 바뀌면 결과도 바뀌므로 메모하지 않는다 (계산 자체는 가볍다)
  const streak = profile
    ? displayStreak({
        savedStreak: profile.streak,
        lastStudyDate: profile.last_study_date,
        freezeCount: profile.freeze_count,
        today: toKstDateString(),
      })
    : 0;
  const totalXp = profile?.total_xp ?? 0;
  const progress = levelProgress(totalXp);
  const coins = profile?.coins ?? 0;
  // 상단바 숫자를 누르면 뜻을 풀어서 보여준다 (7d, LV 진행바가 처음엔 낯설 수 있어서)
  // 직접 열고 닫기 전까지는, 게스트면 XP 80% 규칙을 알 수 있게 펼쳐서 보여준다.
  // (홈이 세션 복구보다 먼저 뜰 수 있어서 isGuest를 초기값으로 굳히지 않는다)
  const [statInfoToggled, setStatInfoToggled] = useState<boolean | null>(null);
  const showStatInfo = statInfoToggled ?? isGuest;

  const statusOf = (lessonId: string) => {
    return statusMap[lessonId] ?? 'open';
  };

  // 배치고사를 안 본 게스트가 1단계(5레슨)를 다 풀면 그 시점에 로그인을 강제한다.
  // (기획서 6번 — "게스트로 놓친 XP를 돌려받아요") isGuest가 true라서
  // AuthScreen이 알아서 "나중에 하기"를 숨긴다.
  useEffect(() => {
    if (loading || !isGuest) return;
    const stage1Lessons = lessons.filter((l) => l.stage === 1);
    const stage1AllDone =
      stage1Lessons.length > 0 && stage1Lessons.every((l) => statusOf(l.id) === 'completed');
    if (stage1AllDone) {
      router.replace('/auth');
    }
    // 커리큘럼을 바꾸면(track.id) 그 트랙의 1단계 기준으로 다시 확인한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isGuest, statusMap, track.id]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        {error ? (
          <Pressable
            style={styles.statGroup}
            onPress={reload}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="학습 기록을 불러오지 못했어요. 다시 시도"
          >
            <Text style={[styles.stat, { color: colors.error }]}>불러오기 실패 · 다시 시도</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.statGroup}
            onPress={() => setStatInfoToggled(!showStatInfo)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${streak}일 연속 학습, 레벨 ${progress.level}, 다음 레벨까지 ${progress.xpToNext} XP`}
            accessibilityHint="눌러서 설명 보기"
            accessibilityState={{ expanded: showStatInfo }}
          >
            <Text style={[styles.stat, { color: colors.streak }]}>{streak}d</Text>
            <Text style={[styles.stat, { color: colors.xp }]}>
              LV{progress.level} {levelBar(progress.xpIntoLevel)} {progress.xpIntoLevel}/{XP_PER_LEVEL}xp
            </Text>
            <Text style={[styles.stat, styles.mutedText]}>{showStatInfo ? '▴' : '▾'}</Text>
          </Pressable>
        )}
        {!error && user && (
          <Pressable
            onPress={() => router.push('/shop')}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`코인 ${coins}개, 상점 열기`}
          >
            <Text style={[styles.stat, { color: colors.accent }]}>{coins}c</Text>
          </Pressable>
        )}
        <View style={styles.rightGroup}>
          {wrongAnswerCount > 0 && (
            <Pressable style={styles.reviewButton} onPress={() => router.push('/review')}>
              <Text style={styles.reviewButtonText}>오답노트 {wrongAnswerCount}</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push('/settings/theme')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="테마 바꾸기"
          >
            <Text style={styles.themeButton}>◐</Text>
          </Pressable>
          <Pressable style={styles.badgeWrap} onPress={() => router.push('/auth')}>
            {!user && <Text style={styles.badge}>로그인</Text>}
            {isGuest && <Text style={styles.badge}>게스트</Text>}
          </Pressable>
        </View>
        {/* 상단바 둘째 줄 — 글자 펫이 돌아다니는 길 (topBar가 flexWrap이라 100% 폭이면 새 줄로 내려간다) */}
        <TerminalPet color={colors.text} />
      </View>

      {showStatInfo && (
        <Pressable style={styles.statInfo} onPress={() => setStatInfoToggled(false)}>
          <Text style={styles.statInfoText}>
            {streak}일 연속 학습 중 · 누적 {totalXp} XP · 다음 레벨까지 {progress.xpToNext} XP
          </Text>
          <Text style={styles.statInfoText}>
            코인 {coins}개 · 프리즈 {profile?.freeze_count ?? 0}개 · 코인(c)을 누르면 상점
          </Text>
          {isGuest && (
            <Text style={styles.statInfoText}>
              게스트는 XP·코인을 80%만 받아요 · 로그인하면 나머지를 돌려받아요
            </Text>
          )}
        </Pressable>
      )}

      <Pressable style={styles.trackBar} onPress={() => router.push('/settings/track')}>
        <Text style={styles.trackBarText}>{track.label}</Text>
        <Text style={styles.trackBarSwitch}>커리큘럼 ›</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.body}>
        {stages.map((stage) => (
          <Fragment key={stage.stage}>
            <View style={styles.stageHeader}>
              <Text style={styles.stageTitle}>
                {stage.stage}단계 · {stage.title}
              </Text>
              {stage.description && <Text style={styles.stageDesc}>{stage.description}</Text>}
            </View>

            {lessons
              .filter((l) => l.stage === stage.stage)
              .map((lesson) => {
                const status = statusOf(lesson.id);
                const ready = hasContent(lesson.id);

                return (
                  <Pressable
                    key={lesson.id}
                    disabled={status === 'locked'}
                    onPress={() => router.push(`/lesson/${lesson.id}`)}
                    style={[
                      styles.lessonCard,
                      status === 'completed' && styles.completed,
                      status === 'open' && styles.open,
                      status === 'locked' && styles.locked,
                    ]}
                  >
                    <Text style={[styles.dot, status !== 'completed' && styles.mutedText]}>
                      {status === 'completed' ? '●' : status === 'open' ? '◉' : '○'}
                    </Text>

                    <View style={styles.lessonText}>
                      <Text style={[styles.lessonTitle, status !== 'completed' && styles.mutedText]}>
                        {lesson.id} {lesson.title}
                      </Text>
                      {lesson.subtitle && (
                        <Text style={styles.lessonSubtitle}>{lesson.subtitle}</Text>
                      )}
                    </View>

                    {!ready && <Text style={styles.soon}>준비중</Text>}
                  </Pressable>
                );
              })}
          </Fragment>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const LEVEL_BAR_CELLS = 8;

/**
 * 현재 레벨에서 쌓은 XP를 ▓░ 블록 문자 진행바로 바꾼다. 예: 40xp → ▓▓▓░░░░░
 * XP가 조금이라도 있으면 최소 한 칸은 채워서, 문제를 풀었는데 바가 비어 보이지 않게 한다.
 */
function levelBar(xpIntoLevel: number): string {
  const cells = Math.floor((xpIntoLevel * LEVEL_BAR_CELLS) / XP_PER_LEVEL);
  const filled = xpIntoLevel > 0 ? Math.max(1, cells) : 0;
  return '▓'.repeat(filled) + '░'.repeat(LEVEL_BAR_CELLS - filled);
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      rowGap: spacing.xs,
      gap: spacing.lg,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    stat: { fontSize: 13, fontWeight: '700', fontFamily: fonts.mono },
    rightGroup: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    themeButton: { fontSize: 18, color: colors.text, fontFamily: fonts.mono },
    statInfo: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statInfoText: { fontSize: 12, color: colors.textMuted, fontFamily: fonts.mono },
    reviewButton: {
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    reviewButtonText: { fontSize: 12, color: colors.accent, fontWeight: '700' },
    badgeWrap: {},
    badge: { fontSize: 12, color: colors.accent, fontWeight: '600' },
    trackBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    trackBarText: { fontSize: 13, fontWeight: '700', color: colors.text },
    trackBarSwitch: { fontSize: 12, color: colors.accent, fontWeight: '600' },
    body: { padding: spacing.md, paddingBottom: spacing.xl },
    stageHeader: { marginTop: spacing.lg, marginBottom: spacing.sm },
    stageTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
    stageDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    lessonCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    completed: { borderColor: colors.success },
    open: { borderColor: colors.textMuted },
    locked: { borderStyle: 'dashed', borderColor: colors.textMuted },
    dot: { fontSize: 18, color: colors.accent },
    lessonText: { flex: 1 },
    lessonTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    lessonSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    mutedText: { color: colors.textMuted },
    soon: { fontSize: 12, color: colors.textMuted },
  });
