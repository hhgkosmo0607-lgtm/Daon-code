import lessonsData from '../../../content/lessons.json';
import tracksData from '../../../content/tracks.json';
import questions1_1 from '../../../content/questions/1-1.json';
import questions1_2 from '../../../content/questions/1-2.json';
import questions1_3 from '../../../content/questions/1-3.json';
import questions1_4 from '../../../content/questions/1-4.json';
import questions1_5 from '../../../content/questions/1-5.json';
import questions2_1 from '../../../content/questions/2-1.json';
import questions2_2 from '../../../content/questions/2-2.json';
import questions2_3 from '../../../content/questions/2-3.json';
import questions2_4 from '../../../content/questions/2-4.json';
import questions2_5 from '../../../content/questions/2-5.json';
import questions2_6 from '../../../content/questions/2-6.json';
import questions3_1 from '../../../content/questions/3-1.json';
import questions3_2 from '../../../content/questions/3-2.json';
import questions3_3 from '../../../content/questions/3-3.json';
import questions3_4 from '../../../content/questions/3-4.json';
import questions3_5 from '../../../content/questions/3-5.json';
import questions4_1 from '../../../content/questions/4-1.json';
import questions4_2 from '../../../content/questions/4-2.json';
import questions4_3 from '../../../content/questions/4-3.json';
import questions4_4 from '../../../content/questions/4-4.json';
import questions4_5 from '../../../content/questions/4-5.json';
import questions4_6 from '../../../content/questions/4-6.json';
import questions5_1 from '../../../content/questions/5-1.json';
import questions5_2 from '../../../content/questions/5-2.json';
import questions5_3 from '../../../content/questions/5-3.json';
import questions5_4 from '../../../content/questions/5-4.json';
import questions5_5 from '../../../content/questions/5-5.json';
import questions6_1 from '../../../content/questions/6-1.json';
import questions6_2 from '../../../content/questions/6-2.json';
import questions6_3 from '../../../content/questions/6-3.json';
import questions6_4 from '../../../content/questions/6-4.json';
import questions6_5 from '../../../content/questions/6-5.json';
import questions7_1 from '../../../content/questions/7-1.json';
import questions7_2 from '../../../content/questions/7-2.json';
import questions7_3 from '../../../content/questions/7-3.json';
import questions7_4 from '../../../content/questions/7-4.json';
import questions8_1 from '../../../content/questions/8-1.json';
import questions8_2 from '../../../content/questions/8-2.json';
import questions8_3 from '../../../content/questions/8-3.json';
import questions8_4 from '../../../content/questions/8-4.json';
import questions9_1 from '../../../content/questions/9-1.json';
import questions9_2 from '../../../content/questions/9-2.json';
import questions9_3 from '../../../content/questions/9-3.json';
import questions9_4 from '../../../content/questions/9-4.json';
import questions10_1 from '../../../content/questions/10-1.json';
import questions10_2 from '../../../content/questions/10-2.json';
import questions10_3 from '../../../content/questions/10-3.json';
import questions10_4 from '../../../content/questions/10-4.json';
import questions10_5 from '../../../content/questions/10-5.json';
import questions11_1 from '../../../content/questions/11-1.json';
import questions11_2 from '../../../content/questions/11-2.json';
import questions11_3 from '../../../content/questions/11-3.json';
import questions11_4 from '../../../content/questions/11-4.json';
import questions12_1 from '../../../content/questions/12-1.json';
import questions12_2 from '../../../content/questions/12-2.json';
import questions12_3 from '../../../content/questions/12-3.json';
import questions12_4 from '../../../content/questions/12-4.json';
import questions12_5 from '../../../content/questions/12-5.json';
import questionsSqld1_1 from '../../../content/questions/sqld-1-1.json';
import questionsSqld1_2 from '../../../content/questions/sqld-1-2.json';
import questionsSqld1_3 from '../../../content/questions/sqld-1-3.json';
import questionsSqld1_4 from '../../../content/questions/sqld-1-4.json';
import questionsSqld2_1 from '../../../content/questions/sqld-2-1.json';
import questionsSqld2_2 from '../../../content/questions/sqld-2-2.json';
import questionsSqld2_3 from '../../../content/questions/sqld-2-3.json';
import questionsSqld2_4 from '../../../content/questions/sqld-2-4.json';
import questionsSqld3_1 from '../../../content/questions/sqld-3-1.json';
import questionsSqld3_2 from '../../../content/questions/sqld-3-2.json';
import questionsSqld3_3 from '../../../content/questions/sqld-3-3.json';
import questionsSqld3_4 from '../../../content/questions/sqld-3-4.json';
import questionsSqld3_5 from '../../../content/questions/sqld-3-5.json';
import questionsSqld3_6 from '../../../content/questions/sqld-3-6.json';
import questionsSqld4_1 from '../../../content/questions/sqld-4-1.json';
import questionsSqld4_2 from '../../../content/questions/sqld-4-2.json';
import questionsSqld4_3 from '../../../content/questions/sqld-4-3.json';
import questionsSqld4_4 from '../../../content/questions/sqld-4-4.json';
import questionsSqld4_5 from '../../../content/questions/sqld-4-5.json';
import questionsSqld5_1 from '../../../content/questions/sqld-5-1.json';
import questionsSqld5_2 from '../../../content/questions/sqld-5-2.json';
import questionsSqld5_3 from '../../../content/questions/sqld-5-3.json';
import questionsJava1_1 from '../../../content/questions/java-1-1.json';
import questionsJava1_2 from '../../../content/questions/java-1-2.json';
import questionsJava2_1 from '../../../content/questions/java-2-1.json';
import questionsJava2_2 from '../../../content/questions/java-2-2.json';
import questionsJava2_3 from '../../../content/questions/java-2-3.json';
import questionsJava2_4 from '../../../content/questions/java-2-4.json';
import questionsJava2_5 from '../../../content/questions/java-2-5.json';
import questionsJava2_6 from '../../../content/questions/java-2-6.json';
import questionsJava3_1 from '../../../content/questions/java-3-1.json';
import questionsJava3_2 from '../../../content/questions/java-3-2.json';
import questionsJava3_3 from '../../../content/questions/java-3-3.json';
import questionsJava3_4 from '../../../content/questions/java-3-4.json';
import questionsJava3_5 from '../../../content/questions/java-3-5.json';
import questionsJava4_1 from '../../../content/questions/java-4-1.json';
import questionsJava4_2 from '../../../content/questions/java-4-2.json';
import questionsJava4_3 from '../../../content/questions/java-4-3.json';
import questionsJava4_4 from '../../../content/questions/java-4-4.json';
import questionsJava4_5 from '../../../content/questions/java-4-5.json';
import questionsJava5_1 from '../../../content/questions/java-5-1.json';
import questionsJava5_2 from '../../../content/questions/java-5-2.json';
import questionsJava5_3 from '../../../content/questions/java-5-3.json';
import questionsJava5_4 from '../../../content/questions/java-5-4.json';
import questionsJava5_5 from '../../../content/questions/java-5-5.json';
import questionsJava6_1 from '../../../content/questions/java-6-1.json';
import questionsJava6_2 from '../../../content/questions/java-6-2.json';
import questionsJava6_3 from '../../../content/questions/java-6-3.json';
import questionsJava6_4 from '../../../content/questions/java-6-4.json';
import questionsJava7_1 from '../../../content/questions/java-7-1.json';
import questionsJava7_2 from '../../../content/questions/java-7-2.json';
import questionsJava7_3 from '../../../content/questions/java-7-3.json';
import questionsJava8_1 from '../../../content/questions/java-8-1.json';
import questionsJava8_2 from '../../../content/questions/java-8-2.json';
import questionsJava8_3 from '../../../content/questions/java-8-3.json';
import questionsJava9_1 from '../../../content/questions/java-9-1.json';
import questionsJava10_1 from '../../../content/questions/java-10-1.json';
import questionsJava10_2 from '../../../content/questions/java-10-2.json';
import questionsJava11_1 from '../../../content/questions/java-11-1.json';
import questionsJava11_2 from '../../../content/questions/java-11-2.json';
import questionsJava11_3 from '../../../content/questions/java-11-3.json';
import questionsJava12_1 from '../../../content/questions/java-12-1.json';
import questionsJava12_2 from '../../../content/questions/java-12-2.json';
import questionsJava12_3 from '../../../content/questions/java-12-3.json';
import questionsJava13_1 from '../../../content/questions/java-13-1.json';
import questionsJava13_2 from '../../../content/questions/java-13-2.json';
import questionsJava14_1 from '../../../content/questions/java-14-1.json';
import questionsJava15_1 from '../../../content/questions/java-15-1.json';
import questionsJava15_2 from '../../../content/questions/java-15-2.json';
import questionsJava15_3 from '../../../content/questions/java-15-3.json';
import questionsJava15_4 from '../../../content/questions/java-15-4.json';
import questionsJava16_1 from '../../../content/questions/java-16-1.json';
import questionsJava16_2 from '../../../content/questions/java-16-2.json';
import questionsJava16_3 from '../../../content/questions/java-16-3.json';
import questionsJava17_1 from '../../../content/questions/java-17-1.json';
import questionsJava17_2 from '../../../content/questions/java-17-2.json';
import questionsJava17_3 from '../../../content/questions/java-17-3.json';
import questionsJava17_4 from '../../../content/questions/java-17-4.json';
import questionsJava18_1 from '../../../content/questions/java-18-1.json';
import questionsJava18_2 from '../../../content/questions/java-18-2.json';
import questionsJava18_3 from '../../../content/questions/java-18-3.json';
import questionsJava18_4 from '../../../content/questions/java-18-4.json';
import questionsJava18_5 from '../../../content/questions/java-18-5.json';
import questionsJava19_1 from '../../../content/questions/java-19-1.json';
import questionsJava19_2 from '../../../content/questions/java-19-2.json';
import questionsJava19_3 from '../../../content/questions/java-19-3.json';
import questionsJava19_4 from '../../../content/questions/java-19-4.json';
import questionsJava19_5 from '../../../content/questions/java-19-5.json';
import questionsJava20_1 from '../../../content/questions/java-20-1.json';
import questionsJava20_2 from '../../../content/questions/java-20-2.json';
import questionsJava20_3 from '../../../content/questions/java-20-3.json';
import questionsJava20_4 from '../../../content/questions/java-20-4.json';
import questionsPython1_1 from '../../../content/questions/python-1-1.json';
import questionsPython2_1 from '../../../content/questions/python-2-1.json';
import questionsPython2_2 from '../../../content/questions/python-2-2.json';
import questionsPython2_3 from '../../../content/questions/python-2-3.json';
import questionsPython2_4 from '../../../content/questions/python-2-4.json';
import questionsPython3_1 from '../../../content/questions/python-3-1.json';
import questionsPython4_1 from '../../../content/questions/python-4-1.json';
import questionsPython5_1 from '../../../content/questions/python-5-1.json';
import questionsPython6_1 from '../../../content/questions/python-6-1.json';
import questionsPython7_1 from '../../../content/questions/python-7-1.json';
import questionsPython8_1 from '../../../content/questions/python-8-1.json';
import questionsPython8_2 from '../../../content/questions/python-8-2.json';
import questionsPython9_1 from '../../../content/questions/python-9-1.json';
import questionsPython10_1 from '../../../content/questions/python-10-1.json';
import questionsPython10_2 from '../../../content/questions/python-10-2.json';
import questionsPython11_1 from '../../../content/questions/python-11-1.json';
import questionsPython12_1 from '../../../content/questions/python-12-1.json';
import questionsPython12_2 from '../../../content/questions/python-12-2.json';
import questionsPython12_3 from '../../../content/questions/python-12-3.json';
import questionsPython12_4 from '../../../content/questions/python-12-4.json';
import questionsPython13_1 from '../../../content/questions/python-13-1.json';
import questionsPython14_1 from '../../../content/questions/python-14-1.json';
import questionsPython14_2 from '../../../content/questions/python-14-2.json';
import questionsPython14_3 from '../../../content/questions/python-14-3.json';
import questionsPython15_1 from '../../../content/questions/python-15-1.json';
import questionsPython15_2 from '../../../content/questions/python-15-2.json';
import questionsPython16_1 from '../../../content/questions/python-16-1.json';
import questionsPython17_1 from '../../../content/questions/python-17-1.json';
import questionsPython17_2 from '../../../content/questions/python-17-2.json';
import questionsPython17_3 from '../../../content/questions/python-17-3.json';
import questionsPython18_1 from '../../../content/questions/python-18-1.json';
import questionsPython18_2 from '../../../content/questions/python-18-2.json';
import questionsPython19_1 from '../../../content/questions/python-19-1.json';
import questionsPython19_2 from '../../../content/questions/python-19-2.json';
import questionsPython20_1 from '../../../content/questions/python-20-1.json';
import questionsPython20_2 from '../../../content/questions/python-20-2.json';
import questionsPython20_3 from '../../../content/questions/python-20-3.json';
import questionsPython20_4 from '../../../content/questions/python-20-4.json';
import questionsHtml1_1 from '../../../content/questions/html-1-1.json';
import questionsHtml1_2 from '../../../content/questions/html-1-2.json';
import questionsHtml2_1 from '../../../content/questions/html-2-1.json';
import questionsHtml2_2 from '../../../content/questions/html-2-2.json';
import questionsHtml3_1 from '../../../content/questions/html-3-1.json';
import questionsHtml4_1 from '../../../content/questions/html-4-1.json';
import questionsHtml5_1 from '../../../content/questions/html-5-1.json';
import questionsHtml5_2 from '../../../content/questions/html-5-2.json';
import questionsHtml6_1 from '../../../content/questions/html-6-1.json';
import questionsHtml7_1 from '../../../content/questions/html-7-1.json';
import questionsHtml8_1 from '../../../content/questions/html-8-1.json';
import questionsHtml8_2 from '../../../content/questions/html-8-2.json';
import questionsHtml9_1 from '../../../content/questions/html-9-1.json';
import questionsHtml9_2 from '../../../content/questions/html-9-2.json';

import type { Lesson, Question, Stage, Track } from '../domain/types';

/*
 * 레슨·문제 콘텐츠를 읽어오는 곳.
 *
 * 콘텐츠 원본은 Supabase가 아니라 이 로컬 JSON이다. (기획서 10번)
 * 앱에 번들되므로 오프라인에서도 동작하고, 새 문제를 추가하면
 * EAS Update로 스토어 심사 없이 반영한다.
 *
 * 화면(screens)은 이 파일을 직접 부르지 않고 hooks를 거친다.
 */

// import한 JSON을 문제 id 기준으로 모아둔다.
// 레슨이 늘어나면 여기에 한 줄씩 추가한다 (스크립트로 자동 생성 예정).
const QUESTION_BANK: Record<string, unknown> = {
  '1-1': questions1_1,
  '1-2': questions1_2,
  '1-3': questions1_3,
  '1-4': questions1_4,
  '1-5': questions1_5,
  '2-1': questions2_1,
  '2-2': questions2_2,
  '2-3': questions2_3,
  '2-4': questions2_4,
  '2-5': questions2_5,
  '2-6': questions2_6,
  '3-1': questions3_1,
  '3-2': questions3_2,
  '3-3': questions3_3,
  '3-4': questions3_4,
  '3-5': questions3_5,
  '4-1': questions4_1,
  '4-2': questions4_2,
  '4-3': questions4_3,
  '4-4': questions4_4,
  '4-5': questions4_5,
  '4-6': questions4_6,
  '5-1': questions5_1,
  '5-2': questions5_2,
  '5-3': questions5_3,
  '5-4': questions5_4,
  '5-5': questions5_5,
  '6-1': questions6_1,
  '6-2': questions6_2,
  '6-3': questions6_3,
  '6-4': questions6_4,
  '6-5': questions6_5,
  '7-1': questions7_1,
  '7-2': questions7_2,
  '7-3': questions7_3,
  '7-4': questions7_4,
  '8-1': questions8_1,
  '8-2': questions8_2,
  '8-3': questions8_3,
  '8-4': questions8_4,
  '9-1': questions9_1,
  '9-2': questions9_2,
  '9-3': questions9_3,
  '9-4': questions9_4,
  '10-1': questions10_1,
  '10-2': questions10_2,
  '10-3': questions10_3,
  '10-4': questions10_4,
  '10-5': questions10_5,
  '11-1': questions11_1,
  '11-2': questions11_2,
  '11-3': questions11_3,
  '11-4': questions11_4,
  '12-1': questions12_1,
  '12-2': questions12_2,
  '12-3': questions12_3,
  '12-4': questions12_4,
  '12-5': questions12_5,
  'sqld-1-1': questionsSqld1_1,
  'sqld-1-2': questionsSqld1_2,
  'sqld-1-3': questionsSqld1_3,
  'sqld-1-4': questionsSqld1_4,
  'sqld-2-1': questionsSqld2_1,
  'sqld-2-2': questionsSqld2_2,
  'sqld-2-3': questionsSqld2_3,
  'sqld-2-4': questionsSqld2_4,
  'sqld-3-1': questionsSqld3_1,
  'sqld-3-2': questionsSqld3_2,
  'sqld-3-3': questionsSqld3_3,
  'sqld-3-4': questionsSqld3_4,
  'sqld-3-5': questionsSqld3_5,
  'sqld-3-6': questionsSqld3_6,
  'sqld-4-1': questionsSqld4_1,
  'sqld-4-2': questionsSqld4_2,
  'sqld-4-3': questionsSqld4_3,
  'sqld-4-4': questionsSqld4_4,
  'sqld-4-5': questionsSqld4_5,
  'sqld-5-1': questionsSqld5_1,
  'sqld-5-2': questionsSqld5_2,
  'sqld-5-3': questionsSqld5_3,
  'java-1-1': questionsJava1_1,
  'java-1-2': questionsJava1_2,
  'java-2-1': questionsJava2_1,
  'java-2-2': questionsJava2_2,
  'java-2-3': questionsJava2_3,
  'java-2-4': questionsJava2_4,
  'java-2-5': questionsJava2_5,
  'java-2-6': questionsJava2_6,
  'java-3-1': questionsJava3_1,
  'java-3-2': questionsJava3_2,
  'java-3-3': questionsJava3_3,
  'java-3-4': questionsJava3_4,
  'java-3-5': questionsJava3_5,
  'java-4-1': questionsJava4_1,
  'java-4-2': questionsJava4_2,
  'java-4-3': questionsJava4_3,
  'java-4-4': questionsJava4_4,
  'java-4-5': questionsJava4_5,
  'java-5-1': questionsJava5_1,
  'java-5-2': questionsJava5_2,
  'java-5-3': questionsJava5_3,
  'java-5-4': questionsJava5_4,
  'java-5-5': questionsJava5_5,
  'java-6-1': questionsJava6_1,
  'java-6-2': questionsJava6_2,
  'java-6-3': questionsJava6_3,
  'java-6-4': questionsJava6_4,
  'java-7-1': questionsJava7_1,
  'java-7-2': questionsJava7_2,
  'java-7-3': questionsJava7_3,
  'java-8-1': questionsJava8_1,
  'java-8-2': questionsJava8_2,
  'java-8-3': questionsJava8_3,
  'java-9-1': questionsJava9_1,
  'java-10-1': questionsJava10_1,
  'java-10-2': questionsJava10_2,
  'java-11-1': questionsJava11_1,
  'java-11-2': questionsJava11_2,
  'java-11-3': questionsJava11_3,
  'java-12-1': questionsJava12_1,
  'java-12-2': questionsJava12_2,
  'java-12-3': questionsJava12_3,
  'java-13-1': questionsJava13_1,
  'java-13-2': questionsJava13_2,
  'java-14-1': questionsJava14_1,
  'java-15-1': questionsJava15_1,
  'java-15-2': questionsJava15_2,
  'java-15-3': questionsJava15_3,
  'java-15-4': questionsJava15_4,
  'java-16-1': questionsJava16_1,
  'java-16-2': questionsJava16_2,
  'java-16-3': questionsJava16_3,
  'java-17-1': questionsJava17_1,
  'java-17-2': questionsJava17_2,
  'java-17-3': questionsJava17_3,
  'java-17-4': questionsJava17_4,
  'java-18-1': questionsJava18_1,
  'java-18-2': questionsJava18_2,
  'java-18-3': questionsJava18_3,
  'java-18-4': questionsJava18_4,
  'java-18-5': questionsJava18_5,
  'java-19-1': questionsJava19_1,
  'java-19-2': questionsJava19_2,
  'java-19-3': questionsJava19_3,
  'java-19-4': questionsJava19_4,
  'java-19-5': questionsJava19_5,
  'java-20-1': questionsJava20_1,
  'java-20-2': questionsJava20_2,
  'java-20-3': questionsJava20_3,
  'java-20-4': questionsJava20_4,
  'python-1-1': questionsPython1_1,
  'python-2-1': questionsPython2_1,
  'python-2-2': questionsPython2_2,
  'python-2-3': questionsPython2_3,
  'python-2-4': questionsPython2_4,
  'python-3-1': questionsPython3_1,
  'python-4-1': questionsPython4_1,
  'python-5-1': questionsPython5_1,
  'python-6-1': questionsPython6_1,
  'python-7-1': questionsPython7_1,
  'python-8-1': questionsPython8_1,
  'python-8-2': questionsPython8_2,
  'python-9-1': questionsPython9_1,
  'python-10-1': questionsPython10_1,
  'python-10-2': questionsPython10_2,
  'python-11-1': questionsPython11_1,
  'python-12-1': questionsPython12_1,
  'python-12-2': questionsPython12_2,
  'python-12-3': questionsPython12_3,
  'python-12-4': questionsPython12_4,
  'python-13-1': questionsPython13_1,
  'python-14-1': questionsPython14_1,
  'python-14-2': questionsPython14_2,
  'python-14-3': questionsPython14_3,
  'python-15-1': questionsPython15_1,
  'python-15-2': questionsPython15_2,
  'python-16-1': questionsPython16_1,
  'python-17-1': questionsPython17_1,
  'python-17-2': questionsPython17_2,
  'python-17-3': questionsPython17_3,
  'python-18-1': questionsPython18_1,
  'python-18-2': questionsPython18_2,
  'python-19-1': questionsPython19_1,
  'python-19-2': questionsPython19_2,
  'python-20-1': questionsPython20_1,
  'python-20-2': questionsPython20_2,
  'python-20-3': questionsPython20_3,
  'python-20-4': questionsPython20_4,
  'html-1-1': questionsHtml1_1,
  'html-1-2': questionsHtml1_2,
  'html-2-1': questionsHtml2_1,
  'html-2-2': questionsHtml2_2,
  'html-3-1': questionsHtml3_1,
  'html-4-1': questionsHtml4_1,
  'html-5-1': questionsHtml5_1,
  'html-5-2': questionsHtml5_2,
  'html-6-1': questionsHtml6_1,
  'html-7-1': questionsHtml7_1,
  'html-8-1': questionsHtml8_1,
  'html-8-2': questionsHtml8_2,
  'html-9-1': questionsHtml9_1,
  'html-9-2': questionsHtml9_2,
};

/** 기본 트랙 — 온보딩/배치고사 등 트랙을 아직 명시하지 않은 기존 화면이 쓰는 값 */
export const DEFAULT_TRACK_ID = 'ai-coding';

export function getTracks(): Track[] {
  return tracksData as Track[];
}

export function getStages(trackId: string = DEFAULT_TRACK_ID): Stage[] {
  return (lessonsData.stages as Stage[]).filter((s) => s.trackId === trackId);
}

export function getLessons(trackId: string = DEFAULT_TRACK_ID): Lesson[] {
  return (lessonsData.lessons as Lesson[])
    .filter((l) => l.trackId === trackId)
    .sort((a, b) => {
      if (a.stage !== b.stage) return a.stage - b.stage;
      return a.orderNo - b.orderNo;
    });
}

/** 어느 트랙인지 몰라도 id만으로 찾는다 (lessonId는 트랙과 무관하게 전역에서 유일하다) */
export function getLesson(lessonId: string): Lesson | undefined {
  return (lessonsData.lessons as Lesson[]).find((l) => l.id === lessonId);
}

export function getQuestions(lessonId: string): Question[] {
  const raw = QUESTION_BANK[lessonId];
  if (!raw) return [];
  return raw as Question[];
}

/** 콘텐츠가 준비된(문제가 실제로 있는) 레슨인지 */
export function hasContent(lessonId: string): boolean {
  return getQuestions(lessonId).length > 0;
}

/**
 * 문제 id 하나로 문제를 찾는다 (오답노트용 — 어느 레슨 문제인지 모르는 상태에서 조회).
 * id 형식이 "{lessonId}-q{n}" 이라는 점을 이용한다 (getPlacementQuestions와 동일한 방식).
 */
export function getQuestionById(questionId: string): Question | undefined {
  const lessonId = questionId.split('-q')[0];
  return getQuestions(lessonId).find((q) => q.id === questionId);
}

/**
 * 배치고사 5문제. (기획서 6번 — 변수/객체접근/map()/props/state 순, 난이도 오름차순)
 * 새 문제를 따로 만들지 않고, 각 개념을 대표하는 레슨의 Q1을 그대로 재사용한다.
 * (콘텐츠를 이중으로 관리하지 않기 위해 — 제작플랜 4번)
 */
const PLACEMENT_QUESTION_IDS = ['2-2-q1', '2-4-q1', '2-5-q1', '2-6-q1', '3-3-q1'];

export function getPlacementQuestions(): Question[] {
  return PLACEMENT_QUESTION_IDS.map((id) => {
    const lessonId = id.split('-q')[0];
    return getQuestions(lessonId).find((q) => q.id === id);
  }).filter((q): q is Question => q !== undefined);
}

/**
 * startLessonId까지(포함) 순서상 앞서는 모든 레슨.
 * 배치고사 통과로 건너뛴 레슨들을 "잠김"이 아니게 열어둘 때 쓴다. (기획서 10번 progress 규칙)
 */
export function getLessonsUpTo(startLessonId: string): Lesson[] {
  const lessons = getLessons();
  const idx = lessons.findIndex((l) => l.id === startLessonId);
  if (idx === -1) return [];
  return lessons.slice(0, idx + 1);
}
