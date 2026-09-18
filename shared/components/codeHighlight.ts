/*
 * 코드 블록을 실제 에디터/터미널처럼 보이게 하는 아주 가벼운 문법 강조기.
 *
 * react-native는 <pre>/<code> DOM이 없어서 웹용 syntax-highlighter 라이브러리를
 * 그대로 못 쓴다. 이 앱의 코드 스니펫은 짧은 예시라서, 정식 파서 대신 "앞에서부터
 * 패턴에 맞는 토큰을 하나씩 떼어내는" 간단한 방식으로 충분하다. JS/JSX 키워드와
 * Java 키워드를 한 목록에 같이 두고 있는데, 두 언어 다 겹치는 단어가 많고
 * 이 정도 가벼운 강조기에서는 언어별로 나눌 실익이 없다.
 */
export type CodeTokenType = 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'tag' | 'plain';

export interface CodeToken {
  text: string;
  type: CodeTokenType;
}

const KEYWORDS =
  /^(const|let|var|function|return|if|else|for|while|of|in|import|export|default|from|async|await|new|class|extends|this|true|false|null|undefined|typeof|try|catch|finally|throw|switch|case|break|continue|do|yield|static|super|instanceof|public|private|protected|void|int|long|double|float|boolean|char|byte|short|interface|abstract|final|implements|package|enum|synchronized|throws)\b/;

const PATTERNS: { type: CodeTokenType; regex: RegExp }[] = [
  { type: 'comment', regex: /^(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/ },
  { type: 'string', regex: /^(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/ },
  { type: 'number', regex: /^\d+(?:\.\d+)?/ },
  { type: 'keyword', regex: KEYWORDS },
  { type: 'tag', regex: /^<\/?[A-Za-z][\w.]*/ },
  { type: 'function', regex: /^[A-Za-z_$][\w$]*(?=\s*\()/ },
  // 위 세 패턴에 안 걸린 식별자는 통째로 plain 처리한다. 이게 없으면 한 글자씩
  // plainBuffer에 쌓이다가, "main"의 뒷부분 "in"처럼 식별자 중간이 우연히
  // 키워드와 같아지는 지점에서 KEYWORDS가 오매칭한다 (식별자를 다 안 보고
  // 그 위치에서부터만 다시 패턴을 시도하기 때문).
  { type: 'plain', regex: /^[A-Za-z_$][\w$]*/ },
];

/**
 * 이 앱의 코드 스니펫이 순수 JS인지 JSX인지 라벨용으로만 가볍게 구분한다.
 *
 * `<태그` 형태가 나오면 무조건 JSX로 보면 `i<arr.length`처럼 공백 없는 비교문을
 * 태그로 오인한다. 그래서 "<" 다음 글자가 대문자(컴포넌트 관례)이거나 흔한 HTML
 * 태그명일 때만 JSX로 판단한다.
 */
const HTML_TAG_NAMES = new Set([
  'div', 'span', 'button', 'input', 'ul', 'ol', 'li', 'p',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img', 'a', 'form', 'label',
  'section', 'header', 'footer', 'nav', 'table', 'thead', 'tbody',
  'tr', 'td', 'th', 'br', 'svg', 'path', 'textarea', 'select', 'option',
  'main', 'article', 'aside', 'video', 'audio', 'canvas',
]);

function hasJsxTag(code: string): boolean {
  const tagName = /<\/?([A-Za-z][\w.]*)/g;
  let m: RegExpExecArray | null;
  while ((m = tagName.exec(code))) {
    const name = m[1];
    if (/^[A-Z]/.test(name) || HTML_TAG_NAMES.has(name)) return true;
  }
  return false;
}

/**
 * 중괄호/세미콜론/화살표함수/키워드가 없어도, "식별자(체이닝).호출(" 형태만으로도
 * 코드로 본다 — router.push('/'), setProducts(data) 처럼 그 자체로 완결된
 * 짧은 코드 라인이 이 앱 문제에 꽤 많이 나온다.
 */
function looksLikeJsCode(code: string): boolean {
  if (/[{};]|=>|\b(function|const|let|var|return|import|export|class|typeof|async|await|new|this)\b/.test(code)) {
    return true;
  }
  return /[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\(/.test(code);
}

/**
 * 문제 콘텐츠의 `code` 필드는 실제 코드 말고도 에러 메시지, 터미널 출력,
 * 파일 트리, 빈칸 채우기용 문장 등을 담는 데도 그대로 재사용되고 있다
 * (예: "TypeError: ...", "$ git branch", "npm ___ dayjs"). 그런 건 라벨을
 * 붙이면 오히려 틀린 정보라, 코드로 보이지 않으면 null을 돌려줘서 라벨을 아예 숨긴다.
 */
export function detectLanguageLabel(code: string): 'JSX' | 'JavaScript' | null {
  if (hasJsxTag(code)) return 'JSX';
  if (looksLikeJsCode(code)) return 'JavaScript';
  return null;
}

/**
 * 한 줄(또는 여러 줄) 코드를 토큰 배열로 쪼갠다.
 *
 * skipTags: true면 'tag' 패턴을 아예 건너뛴다. JSX가 아닌 언어(Java 등)는
 * `List<String>`처럼 대문자로 시작하는 제네릭 타입이 흔한데, "<" 다음 대문자로
 * JSX를 판단하는 규칙과 정확히 충돌해서 자동 구분이 불가능하다 — 그래서 JSX가
 * 아닌 언어라는 걸 아는 쪽(CodeBlock의 language prop)에서 아예 꺼버린다.
 */
export function tokenizeCode(code: string, opts: { skipTags?: boolean } = {}): CodeToken[] {
  const patterns = opts.skipTags ? PATTERNS.filter((p) => p.type !== 'tag') : PATTERNS;
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

    for (const { type, regex } of patterns) {
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
