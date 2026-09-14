import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../../shared/lib/supabase';

/*
 * 로그인 상태를 앱 전체에서 공유한다.
 *
 * 화면 곳곳(홈 상단바, 레슨 결과, 게이트 화면)에서 "지금 로그인한 사람이 누구이고
 * 게스트인지 정식 계정인지"를 알아야 해서 Context로 한 번에 공유한다.
 *
 * 세션은 AsyncStorage에 저장되므로(shared/lib/supabase.ts) 앱을 껐다 켜도 유지된다.
 */
interface AuthState {
  session: Session | null;
  user: User | null;
  /** 익명(게스트) 계정인지 — XP 80% 적용 여부를 가른다 */
  isGuest: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  isGuest: false,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 앱 시작 시 저장된 세션 복구
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // 로그인/로그아웃/토큰갱신 시 자동 반영
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(() => {
    const user = session?.user ?? null;
    return {
      session,
      user,
      // Supabase가 익명 계정에 붙여주는 표시
      isGuest: user?.is_anonymous === true,
      loading,
    };
  }, [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
