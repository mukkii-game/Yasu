/** Pure state transitions for the two-character mystery game. */

export type Phase = 'title' | 'dialogue' | 'input' | 'wrong' | 'reveal' | 'ending' | 'end';

export interface DialogueStep {
  readonly kind: 'dialogue';
  readonly speaker: 'ヤス' | 'あなた';
  readonly lines: readonly string[];
}

export interface CutinStep {
  readonly kind: 'cutin';
  readonly lines: readonly [string, string];
}

export type EndingStep = DialogueStep | CutinStep;

export interface GameState {
  readonly phase: Phase;
  readonly introIndex: number;
  readonly endingIndex: number;
  readonly answer: readonly string[];
}

export const INTRO: readonly DialogueStep[] = [
  { kind: 'dialogue', speaker: 'ヤス', lines: ['ボス、これいじょうの', 'てがかりがありません。', 'めいきゅういりです。'] },
  { kind: 'dialogue', speaker: 'ヤス', lines: ['えっ？　はんにんが', 'わかったんですか？'] },
  { kind: 'dialogue', speaker: 'あなた', lines: ['はんにんは⋯'] },
];

export const ENDING: readonly EndingStep[] = [
  { kind: 'dialogue', speaker: 'あなた', lines: ['なぜこんなころしを・・・'] },
  { kind: 'dialogue', speaker: 'ヤス', lines: ['いやー ラクしてもうかる', 'バイトだってネットでみて'] },
  { kind: 'cutin', lines: ['動機が', 'ヤスッ！'] },
  { kind: 'dialogue', speaker: 'ヤス', lines: ['でも もらったほうしゅうは', '3000えんでした'] },
  { kind: 'cutin', lines: ['報酬も', 'ヤスッ！'] },
  { kind: 'dialogue', speaker: 'ヤス', lines: ['まあ しょはんだし', 'そこそこででてこれますよね'] },
  { kind: 'cutin', lines: ['人間として', 'ヤスッ！'] },
];

export const KANA = [
  'ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ',
  'サ', 'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト',
  'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
  'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ',
  'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン',
] as const;

export function createGame(): GameState {
  return { phase: 'title', introIndex: 0, endingIndex: 0, answer: [] };
}

export function startGame(state: GameState): GameState {
  if (state.phase !== 'title') return state;
  return { ...state, phase: 'dialogue', introIndex: 0 };
}

export function advance(state: GameState): GameState {
  if (state.phase === 'dialogue') {
    if (state.introIndex < INTRO.length - 1) {
      return { ...state, introIndex: state.introIndex + 1 };
    }
    return { ...state, phase: 'input', answer: [] };
  }
  if (state.phase === 'wrong') return { ...state, phase: 'input' };
  if (state.phase === 'reveal') return { ...state, phase: 'ending', endingIndex: 0 };
  if (state.phase === 'ending') {
    if (state.endingIndex < ENDING.length - 1) {
      return { ...state, endingIndex: state.endingIndex + 1 };
    }
    return { ...state, phase: 'end' };
  }
  return state;
}

export function chooseKana(state: GameState, character: string): GameState {
  if (state.phase !== 'input' || state.answer.length >= 2 || !KANA.includes(character as typeof KANA[number])) {
    return state;
  }
  return { ...state, answer: [...state.answer, character] };
}

export function deleteKana(state: GameState): GameState {
  if (state.phase !== 'input' || state.answer.length === 0) return state;
  return { ...state, answer: state.answer.slice(0, -1) };
}

export function clearAnswer(state: GameState): GameState {
  if (state.phase !== 'input' || state.answer.length === 0) return state;
  return { ...state, answer: [] };
}

export function submitAnswer(state: GameState): GameState {
  if (state.phase !== 'input' || state.answer.length !== 2) return state;
  return state.answer.join('') === 'ヤス'
    ? { ...state, phase: 'reveal' }
    : { ...state, phase: 'wrong', answer: [] };
}

export function restart(): GameState {
  return createGame();
}

export function isCutin(state: GameState): boolean {
  return state.phase === 'ending' && ENDING[state.endingIndex]?.kind === 'cutin';
}
