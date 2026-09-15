import { useRouter } from 'expo-router';
import { Fragment, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../../../shared/theme/theme';
import { useAuth } from '../../auth/AuthContext';
import { getLessons, getStages, hasContent } from '../data/contentRepository';
import { useUserProgress } from '../hooks/useUserProgress';

/*
 * 홈 — 학습 경로 화면.
 *
 * 레슨 잠금 상태 판정 (기획서 10번 progress 테이블 규칙):
 *   progress 행 없음      → locked
 *   completed = false     → open  (진행중 또는 배치고사로 건너뜀)
 *   completed = true      → completed
 *
 * 상태는 Supabase progress 테이블에서 읽어온다 (useUserProgress).
 * 로그인 전에는 빈 맵이라 1단계 첫 레슨만 열어둔다.
 */

/**
 * 디자인/UI 작업 중 모든 레슨을 자유롭게 눌러볼 수 있게 잠금을 해제한다.
 * 완료 표시(●)는 실제 진도를 그대로 보여주고, "잠김"만 없앤다.
 * 출시 전에는 반드시 false로 되돌려야 한다.
 */
const UNLOCK_ALL_LESSONS_FOR_DEV = true;

export function HomeScreen() {
  const router = useRouter();
  const stages = getStages();
  const lessons = getLessons();

  const { user, isGuest } = useAuth();
  const { profile, statusMap, loading } = useUserProgress();

  const firstLessonId = lessons[0]?.id;

  const statusOf = (lessonId: string) => {
    const fromServer = statusMap[lessonId];
    if (fromServer) return fromServer;
    if (UNLOCK_ALL_LESSONS_FOR_DEV) return 'open';
    // 진도 기록이 없어도 맨 첫 레슨은 항상 열어둔다 (진입점 확보)
    return lessonId === firstLessonId ? 'open' : 'locked';
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
        <Pressable style={styles.badgeWrap} onPress={() => router.push('/auth')}>
          {!user && <Text style={styles.badge}>로그인</Text>}
          {isGuest && <Text style={styles.badge}>게스트 · XP 80%</Text>}
        </Pressable>
      </View>

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
                    <Text style={styles.dot}>
                      {status === 'completed' ? '●' : status === 'open' ? '◉' : '○'}
                    </Text>

                    <View style={styles.lessonText}>
                      <Text style={[styles.lessonTitle, status === 'locked' && styles.mutedText]}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stat: { fontSize: 15, fontWeight: '600', color: colors.text },
  badgeWrap: { marginLeft: 'auto' },
  badge: { fontSize: 12, color: colors.accent, fontWeight: '600' },
  body: { padding: spacing.md, paddingBottom: spacing.xl },
  stageHeader: { marginTop: spacing.lg, marginBottom: spacing.sm },
  stageTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  stageDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  completed: { borderColor: colors.success },
  open: { borderColor: colors.accent },
  locked: { opacity: 0.5 },
  dot: { fontSize: 18, color: colors.primary },
  lessonText: { flex: 1 },
  lessonTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  lessonSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  mutedText: { color: colors.textMuted },
  soon: { fontSize: 12, color: colors.textMuted },
});
