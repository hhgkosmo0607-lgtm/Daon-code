import { useRouter } from 'expo-router';
import { Fragment, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../shared/theme/ThemeContext';
import { radius, spacing } from '../../../shared/theme/theme';
import type { ThemeColors } from '../../../shared/theme/themes';
import { useAuth } from '../../auth/AuthContext';
import { useTrack } from '../../track/TrackContext';
import { getLessons, getStages, hasContent } from '../data/contentRepository';
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
  const { profile, statusMap, loading } = useUserProgress();
  const { count: wrongAnswerCount } = useWrongAnswerCount();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isGuest, statusMap]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Text style={styles.stat}>🔥 {profile?.streak ?? 0}</Text>
        <Text style={styles.stat}>⭐ {profile?.total_xp ?? 0}</Text>
        <Text style={styles.stat}>Lv.{profile?.level ?? 1}</Text>
        <View style={styles.rightGroup}>
          {wrongAnswerCount > 0 && (
            <Pressable style={styles.reviewButton} onPress={() => router.push('/review')}>
              <Text style={styles.reviewButtonText}>오답노트 {wrongAnswerCount}</Text>
            </Pressable>
          )}
          <Pressable onPress={() => router.push('/settings/theme')} hitSlop={8}>
            <Text style={styles.themeButton}>🎨</Text>
          </Pressable>
          <Pressable style={styles.badgeWrap} onPress={() => router.push('/auth')}>
            {!user && <Text style={styles.badge}>로그인</Text>}
            {isGuest && <Text style={styles.badge}>게스트 · XP 80%</Text>}
          </Pressable>
        </View>
      </View>

      <Pressable style={styles.trackBar} onPress={() => router.push('/settings/track')}>
        <Text style={styles.trackBarText}>{track.label}</Text>
        <Text style={styles.trackBarSwitch}>바꾸기 ›</Text>
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row',
      gap: spacing.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    stat: { fontSize: 15, fontWeight: '600', color: colors.text },
    rightGroup: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    themeButton: { fontSize: 18 },
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
