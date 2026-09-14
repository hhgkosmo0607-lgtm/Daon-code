import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

/*
 * Supabase 클라이언트는 앱 전체에서 이 인스턴스 하나만 쓴다.
 * (제작플랜 5번 "축소판" 결정: Repository 인터페이스 레이어는 생략하고,
 *  Hooks가 이 클라이언트를 직접 호출한다. 유저 데이터에만 해당하고,
 *  레슨/문제 콘텐츠는 features/lesson/data의 로컬 JSON을 쓴다.)
 *
 * AsyncStorage에 세션을 저장해서, 앱을 껐다 켜도 로그인이 유지되게 한다.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY 가 .env에 설정되지 않았습니다.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // RN에는 브라우저 URL이 없어서 항상 false
  },
});
