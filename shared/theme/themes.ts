/*
 * Daon-code 테마 시스템 — 터미널 컨셉 10종 (다크 5 + 라이트 5)
 *
 * 모든 화면은 색상을 여기서만 가져다 쓴다. 컴포넌트에 색을 직접 하드코딩하지 않는다.
 * 새 테마를 추가할 때도 이 파일에 객체 하나만 더하면 된다 (레이아웃/컴포넌트는 안 건드림).
 *
 * 역할별 색상 (모든 테마가 동일한 키를 가진다):
 *   background   화면 배경
 *   surface      헤더바, 카드의 옅은 배경, 강조 행 배경
 *   border       테두리, 구분선
 *   text         본문 텍스트
 *   textMuted    보조 텍스트, 잠긴 항목, 비활성 상태
 *   success      완료 표시 [✓], 정답 배너
 *   accent       현재 진행중 표시 ▶, 선택된 보기, 진행바
 *   streak       스트릭(🔥) 숫자
 *   xp           XP/레벨 표시
 *   error        에러 메시지, 오답 표시
 *
 * mode: 'dark' | 'light' — 시스템 다크모드 감지 시 기본으로 보여줄 후보를 고를 때 사용
 * free: 무료로 기본 제공되는 테마인지 (상점 판매 여부 판단용, 가격은 아직 미정)
 * pairId: 다크/라이트 짝 테마를 묶는 키 (같은 pairId끼리는 톤만 다르고 성격이 같음)
 */

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
  success: string;
  accent: string;
  streak: string;
  xp: string;
  error: string;
}

export interface ThemeDefinition {
  id: string;
  label: string;
  mode: ThemeMode;
  free: boolean;
  pairId: string;
  colors: ThemeColors;
}

export const THEMES: Record<string, ThemeDefinition> = {
  // ============ 다크 5종 ============

  dracula: {
    id: 'dracula',
    label: 'Dracula',
    mode: 'dark',
    free: true, // 기본 테마
    pairId: 'dracula',
    colors: {
      background: '#282A36',
      surface: '#21222C',
      border: '#44475A',
      text: '#F8F8F2',
      textMuted: '#8490B5',
      success: '#50FA7B',
      accent: '#FFB86C',
      streak: '#F1FA8C',
      xp: '#BD93F9',
      error: '#FF5555',
    },
  },

  nord: {
    id: 'nord',
    label: 'Nord',
    mode: 'dark',
    free: false,
    pairId: 'nord',
    colors: {
      background: '#2E3440',
      surface: '#3B4252',
      border: '#4C566A',
      text: '#ECEFF4',
      textMuted: '#959CA9',
      success: '#A3BE8C',
      accent: '#88C0D0',
      streak: '#EBCB8B',
      xp: '#B48EAD',
      error: '#BF616A',
    },
  },

  solarizedDark: {
    id: 'solarizedDark',
    label: 'Solarized Dark',
    mode: 'dark',
    free: false,
    pairId: 'solarized',
    colors: {
      background: '#002B36',
      surface: '#073642',
      border: '#586E75',
      text: '#93A1A1',
      textMuted: '#7F9092',
      success: '#859900',
      accent: '#CB4B16',
      streak: '#B58900',
      xp: '#2AA198',
      error: '#DC322F',
    },
  },

  monokai: {
    id: 'monokai',
    label: 'Monokai',
    mode: 'dark',
    free: false,
    pairId: 'monokai',
    colors: {
      background: '#272822',
      surface: '#1E1F1A',
      border: '#49483E',
      text: '#F8F8F2',
      textMuted: '#918E7E',
      success: '#A6E22E',
      accent: '#FD971F',
      streak: '#E6DB74',
      xp: '#AE81FF',
      error: '#F92672',
    },
  },

  gruvbox: {
    id: 'gruvbox',
    label: 'Gruvbox',
    mode: 'dark',
    free: false,
    pairId: 'gruvbox',
    colors: {
      background: '#282828',
      surface: '#1D2021',
      border: '#504945',
      text: '#EBDBB2',
      textMuted: '#9B8C7A',
      success: '#B8BB26',
      accent: '#FE8019',
      streak: '#FABD2F',
      xp: '#D3869B',
      error: '#FB4934',
    },
  },

  // ============ 라이트 5종 ============

  alucard: {
    id: 'alucard',
    label: 'Alucard',
    mode: 'light',
    free: true, // 기본 테마 (라이트 모드 기기용 짝)
    pairId: 'dracula',
    colors: {
      background: '#F8F8F0',
      surface: '#EFEFEF',
      border: '#D5D5CC',
      text: '#1F1F1F',
      textMuted: '#727270',
      success: '#14710A',
      accent: '#A34D14',
      streak: '#846E15',
      xp: '#644AC9',
      error: '#CB3A2A',
    },
  },

  nordLight: {
    id: 'nordLight',
    label: 'Nord Light',
    mode: 'light',
    free: false,
    pairId: 'nord',
    colors: {
      background: '#ECEFF4',
      surface: '#E5E9F0',
      border: '#D8DEE9',
      text: '#2E3440',
      textMuted: '#656D7D',
      success: '#4C7433',
      accent: '#4C7A87',
      streak: '#B48214',
      xp: '#8C4E68',
      error: '#B04552',
    },
  },

  solarizedLight: {
    id: 'solarizedLight',
    label: 'Solarized Light',
    mode: 'light',
    free: false,
    pairId: 'solarized',
    colors: {
      background: '#FDF6E3',
      surface: '#EEE8D5',
      border: '#D3CBB7',
      text: '#586E75',
      textMuted: '#60757B',
      success: '#859900',
      accent: '#CB4B16',
      streak: '#B58900',
      xp: '#2AA198',
      error: '#DC322F',
    },
  },

  oneLight: {
    id: 'oneLight',
    label: 'One Light',
    mode: 'light',
    free: false,
    pairId: 'monokai', // Monokai엔 공식 라이트가 없어 인지도 비슷한 One Light로 짝지음
    colors: {
      background: '#FAFAFA',
      surface: '#F0F0F1',
      border: '#E5E5E6',
      text: '#383A42',
      textMuted: '#72737A',
      success: '#50A14F',
      accent: '#E45649',
      streak: '#C18401',
      xp: '#A626A4',
      error: '#E45649',
    },
  },

  gruvboxLight: {
    id: 'gruvboxLight',
    label: 'Gruvbox Light',
    mode: 'light',
    free: false,
    pairId: 'gruvbox',
    colors: {
      background: '#FBF1C7',
      surface: '#EBDBB2',
      border: '#D5C4A1',
      text: '#3C3836',
      textMuted: '#766D60',
      success: '#79740E',
      accent: '#AF3A03',
      streak: '#B57614',
      xp: '#8F3F71',
      error: '#9D0006',
    },
  },
};

export const DEFAULT_THEME_ID_DARK = 'dracula';
export const DEFAULT_THEME_ID_LIGHT = 'alucard';

/** 시스템 다크모드 감지 결과에 따라 기본 테마를 고른다 */
export function getDefaultThemeId(systemMode: ThemeMode): string {
  return systemMode === 'dark' ? DEFAULT_THEME_ID_DARK : DEFAULT_THEME_ID_LIGHT;
}

/** 상점에 진열할 순서 (무료 2개 제외, 다크→라이트 번갈아 배치) */
export const SHOP_THEME_ORDER = [
  'nord',
  'nordLight',
  'solarizedDark',
  'solarizedLight',
  'monokai',
  'oneLight',
  'gruvbox',
  'gruvboxLight',
];
