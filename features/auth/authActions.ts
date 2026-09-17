import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../shared/lib/supabase';

/*
 * 인증 관련 동작을 모아둔 곳.
 * 화면은 이 함수들만 호출하고, Supabase API를 직접 부르지 않는다.
 */

// OAuth 인증 화면(브라우저)이 앱으로 돌아올 때 한 번 정리해줘야 하는 절차 (Supabase 공식 가이드).
WebBrowser.maybeCompleteAuthSession();

type OAuthProvider = 'google' | 'kakao';

/**
 * 구글/카카오 로그인 — RN 전용 플로우.
 *
 * 웹의 signInWithOAuth 예제는 브라우저 주소창(URL)에 토큰이 실리는 걸 전제로 하는데,
 * RN 앱에는 주소창이 없다. 그래서:
 *  1) skipBrowserRedirect로 "이동은 하지 말고 인증 URL만 달라"고 요청하고
 *  2) 그 URL을 WebBrowser로 직접 열어서 로그인을 받고
 *  3) 앱으로 돌아온 딥링크 URL에서 토큰을 직접 꺼내(setSession) 세션을 만든다.
 * (제작플랜 3번: "웹 기준 예제 그대로 쓰면 동작 안 함" 이 부분)
 *
 * 사전 준비 (Supabase 대시보드 + 각 개발자 콘솔에서 해야 함):
 *  - Google Cloud Console / Kakao Developers에 앱 등록 후 클라이언트 ID 발급
 *  - Supabase 대시보드 Authentication → Providers에서 Google/Kakao 활성화 + 키 입력
 *  - Supabase 대시보드 Authentication → URL Configuration → Redirect URLs에
 *    이 앱의 딥링크(`daoncode://auth-callback`, 개발 중엔 `exp://...`)를 등록
 */
async function performOAuth(provider: OAuthProvider) {
  const redirectTo = Linking.createURL('auth-callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('로그인 주소를 받아오지 못했어요');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return null;

  return createSessionFromCallbackUrl(result.url);
}

async function createSessionFromCallbackUrl(url: string) {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) return null;

  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) throw error;
  return data;
}

export function signInWithGoogle() {
  return performOAuth('google');
}

export function signInWithKakao() {
  return performOAuth('kakao');
}

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
