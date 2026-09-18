import { describe, expect, it } from 'vitest';
import { detectLanguageLabel, tokenizeCode } from './codeHighlight';

describe('detectLanguageLabel', () => {
  it('JSX 태그가 있으면 JSX로 본다 (컴포넌트, 흔한 HTML 태그 둘 다)', () => {
    expect(detectLanguageLabel('<UserCard name="김철수" />')).toBe('JSX');
    expect(detectLanguageLabel('<button className="bg-blue-500">구매하기</button>')).toBe('JSX');
  });

  it('중괄호/화살표/키워드가 있으면 JavaScript로 본다', () => {
    expect(detectLanguageLabel('const [x, setX] = useState(0)')).toBe('JavaScript');
    expect(detectLanguageLabel('items.map(item => item.id)')).toBe('JavaScript');
  });

  it('완결된 짧은 함수 호출 한 줄도 JavaScript로 본다', () => {
    expect(detectLanguageLabel("router.push('/')")).toBe('JavaScript');
    expect(detectLanguageLabel('setProducts(data)')).toBe('JavaScript');
  });

  it('"<" 다음이 소문자·비HTML 식별자면 비교 연산자로 보고 JSX로 오인하지 않는다', () => {
    expect(detectLanguageLabel('i < arr.length')).toBe(null);
  });

  it('에러 메시지·터미널 출력·빈칸 채우기 문장은 라벨을 안 붙인다', () => {
    expect(detectLanguageLabel("TypeError: Cannot read property 'name' of undefined")).toBe(null);
    expect(detectLanguageLabel('$ git branch\n* main\n  feature/login')).toBe(null);
    expect(detectLanguageLabel('npm ___ dayjs')).toBe(null);
    expect(detectLanguageLabel('app/\n  index.tsx\n  about.tsx')).toBe(null);
  });
});

describe('tokenizeCode skipTags', () => {
  it('skipTags 없이는 List<String> 같은 자바 제네릭을 태그로 오인한다', () => {
    const tokens = tokenizeCode('List<String> names;');
    expect(tokens.some((t) => t.type === 'tag')).toBe(true);
  });

  it('skipTags: true면 제네릭을 태그로 오인하지 않는다', () => {
    const tokens = tokenizeCode('List<String> names;', { skipTags: true });
    expect(tokens.some((t) => t.type === 'tag')).toBe(false);
  });

  it('skipTags: true여도 자바 키워드는 정상적으로 강조된다', () => {
    const tokens = tokenizeCode('public static void main', { skipTags: true });
    const keywords = tokens.filter((t) => t.type === 'keyword').map((t) => t.text);
    expect(keywords).toEqual(['public', 'static', 'void']);
  });
});
