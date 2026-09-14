import { supabase } from '../../shared/lib/supabase';

/*
 * 인증 관련 동작을 모아둔 곳.
 * 화면은 이 함수들만 호출하고, Supabase API를 직접 부르지 않는다.
 */

/**
 * 게스트로 시작하기 ("나중에 하기")
 *
 * 화면엔 안 보이지만 내부적으로 익명 계정이 생성되어 user_id가 발급된다.
 * 이게 있어야 progress/daily_xp 저장이 정상 동작한다. (기획서 아키텍처 원칙)
 *
 * 주의: Supabase 대시보드에서 Authentication → Providers →
 * "Anonymous sign-ins"를 켜둬야 동작한다. (기본값 꺼짐)
 */
export async function signInAsGuest() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data;
}

/** 이메일 회원가입 */
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

/** 이메일 로그인 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/**
 * 게스트 → 정식 계정 전환 (계정 연결)
 *
 * 새 계정을 만드는 게 아니라, 지금 쓰고 있는 익명 계정에 이메일/비밀번호를
 * 붙이는 방식이다. user_id가 그대로 유지되므로 그동안 쌓은 progress,
 * daily_xp가 전부 따라온다. (기획서 6번: "게스트로 놓친 XP를 돌려받아요")
 *
 * 새로 signUp을 하면 다른 user_id가 발급되어 기존 진도가 끊긴다.
 */
export async function upgradeGuestToEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.updateUser({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
