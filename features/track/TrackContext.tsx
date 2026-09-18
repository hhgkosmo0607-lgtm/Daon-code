import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_TRACK_ID, getTracks } from '../lesson/data/contentRepository';
import type { Track } from '../lesson/domain/types';

const STORAGE_KEY = 'daon_track_id';

interface TrackContextValue {
  trackId: string;
  track: Track;
  tracks: Track[];
  setTrackId: (id: string) => void;
}

const TrackContext = createContext<TrackContextValue | null>(null);

/*
 * 지금 홈 화면에 어떤 커리큘럼(트랙)을 보여줄지 — 기기에만 저장하는 화면 설정이다.
 * progress/XP 같은 서버 데이터와 달리 트랙 선택 자체는 계정에 안 묶는다 (그냥 "지금 뭘
 * 보고 있는지"일 뿐이라서). 기본값은 기존 커리큘럼(ai-coding) — 트랙을 고른 적 없는
 * 기존 사용자도 그대로 원래 화면을 본다.
 */
export function TrackProvider({ children }: { children: ReactNode }) {
  const tracks = useMemo(() => getTracks(), []);
  const [storedTrackId, setStoredTrackId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (cancelled || !saved || !tracks.some((t) => t.id === saved)) return;
      setStoredTrackId(saved);
    });
    return () => {
      cancelled = true;
    };
  }, [tracks]);

  const setTrackId = useCallback(
    (id: string) => {
      if (!tracks.some((t) => t.id === id)) return;
      setStoredTrackId(id);
      AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
    },
    [tracks]
  );

  const value = useMemo<TrackContextValue>(() => {
    const trackId = storedTrackId ?? DEFAULT_TRACK_ID;
    const track = tracks.find((t) => t.id === trackId) ?? tracks[0];
    return { trackId: track.id, track, tracks, setTrackId };
  }, [storedTrackId, tracks, setTrackId]);

  return <TrackContext.Provider value={value}>{children}</TrackContext.Provider>;
}

export function useTrack(): TrackContextValue {
  const ctx = useContext(TrackContext);
  if (!ctx) throw new Error('useTrack은 TrackProvider 안에서만 쓸 수 있어요');
  return ctx;
}
