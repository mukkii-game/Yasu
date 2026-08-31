/** Pure state transitions for the two-character mystery game. */

export type Phase = 'title' | 'dialogue' | 'input' | 'wrong' | 'reveal' | 'ending' | 'end';

export interface DialogueStep {
  readonly speaker: 'ヤス' | 'あなた';
  readonly text: string;
  readonly punchline?: 'トリックがヤスッ！' | '動機がヤスッ！' | '報酬もヤスッ！' | '人間としてヤスッ！';
}

export interface GameState {
  readonly phase: Phase;
  readonly introIndex: number;
  readonly endingIndex: number;
  readonly answer: readonly string[];
}

export const INTRO: readonly DialogueStep[] = [
  { speaker: 'ヤス', text: 'ボス、これいじょうのてがかりがありません。めいきゅういりです。' },
  { speaker: 'ヤス', text: 'えっ？　はんにんがわかったんですか？' },
  { speaker: 'あなた', text: 'はんにんは⋯' },
];

export const ENDING: readonly DialogueStep[] = [
  { speaker: 'あなた', text: 'かおにかいてあるから', punchline: 'トリックがヤスッ！' },
  { speaker: 'あなた', text: 'ヤス、なぜこんなころしをしたんだ' },
  { speaker: 'ヤス', text: 'いやー ラクしてもうかるバイトだってネットでみて', punchline: '動機がヤスッ！' },
  { speaker: 'ヤス', text: 'でも もらったほうしゅうは3000えんでした', punchline: '報酬もヤスッ！' },
  { speaker: 'ヤス', text: 'まあ しょはんだし すぐでてこれますよねｗ', punchline: '人間としてヤスッ！' },
];

export const WRONG: DialogueStep = { speaker: 'ヤス', text: 'いや、ちがうでしょう。' };
export const REVEAL: DialogueStep = { speaker: 'ヤス', text: 'な、なぜわかったんですかっ！？' };

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
  return state.phase === 'title' ? { ...state, phase: 'dialogue', introIndex: 0 } : state;
}

export function advance(state: GameState): GameState {
  if (state.phase === 'dialogue') {
    return state.introIndex < INTRO.length - 1
      ? { ...state, introIndex: state.introIndex + 1 }
      : { ...state, phase: 'input', answer: [] };
  }
  if (state.phase === 'wrong') return { ...state, phase: 'input' };
  if (state.phase === 'reveal') return { ...state, phase: 'ending', endingIndex: 0 };
  if (state.phase === 'ending') {
    return state.endingIndex < ENDING.length - 1
      ? { ...state, endingIndex: state.endingIndex + 1 }
      : { ...state, phase: 'end' };
  }
  return state;
}

export function chooseKana(state: GameState, character: string): GameState {
  if (state.phase !== 'input' || state.answer.length >= 2 || !KANA.includes(character as typeof KANA[number])) return state;
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

export function currentDialogue(state: GameState): DialogueStep | undefined {
  if (state.phase === 'dialogue') return INTRO[state.introIndex];
  if (state.phase === 'wrong') return WRONG;
  if (state.phase === 'reveal') return REVEAL;
  if (state.phase === 'ending') return ENDING[state.endingIndex];
  return undefined;
}

export function dialogueText(step: DialogueStep): string {
  return `${step.speaker}「${step.text}」`;
}
