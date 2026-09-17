/*
 * 코드 블록을 실제 에디터/터미널처럼 보이게 하는 아주 가벼운 문법 강조기.
 *
 * react-native는 <pre>/<code> DOM이 없어서 웹용 syntax-highlighter 라이브러리를
 * 그대로 못 쓴다. 이 앱의 코드 스니펫은 전부 JS/JSX 짧은 예시라서, 정식 파서 대신
 * "앞에서부터 패턴에 맞는 토큰을 하나씩 떼어내는" 간단한 방식으로 충분하다.
 */
export type CodeTokenType = 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'tag' | 'plain';

export interface CodeToken {
  text: string;
  type: CodeTokenType;
}

const KEYWORDS =
  /^(const|let|var|function|return|if|else|for|while|of|in|import|export|default|from|async|await|new|class|extends|this|true|false|null|undefined|typeof|try|catch|finally|throw|switch|case|break|continue|do|yield|static|super|instanceof)\b/;

const PATTERNS: { type: CodeTokenType; regex: RegExp }[] = [
  { type: 'comment', regex: /^(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/ },
  { type: 'string', regex: /^(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/ },
  { type: 'number', regex: /^\d+(?:\.\d+)?/ },
  { type: 'keyword', regex: KEYWORDS },
  { type: 'tag', regex: /^<\/?[A-Za-z][\w.]*/ },
  { type: 'function', regex: /^[A-Za-z_$][\w$]*(?=\s*\()/ },
];

/** 한 줄(또는 여러 줄) 코드를 토큰 배열로 쪼갠다. */
export function tokenizeCode(code: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let rest = code;
  let plainBuffer = '';

  const flushPlain = () => {
    if (plainBuffer) {
      tokens.push({ text: plainBuffer, type: 'plain' });
      plainBuffer = '';
    }
  };

  while (rest.length > 0) {
    let matchedLength = 0;

    for (const { type, regex } of PATTERNS) {
      const m = rest.match(regex);
      if (m && m[0]) {
        flushPlain();
        tokens.push({ text: m[0], type });
        matchedLength = m[0].length;
        break;
      }
    }

    if (matchedLength > 0) {
      rest = rest.slice(matchedLength);
    } else {
      plainBuffer += rest[0];
      rest = rest.slice(1);
    }
  }

  flushPlain();
  return tokens;
}
