/** Pure state transitions for the two-character mystery game. */

export type Phase = 'title' | 'dialogue' | 'input' | 'wrong' | 'reveal' | 'ending' | 'end' | 'boss' | 'boss-end';

export interface DialogueStep {
  readonly speaker: 'ヤス' | 'あなた';
  readonly text: string;
  readonly punchline?: 'なぞときがヤスッ！' | '動機がヤスッ！' | '報酬もヤスッ！' | '人としてヤスッ！' | 'みとおしがヤスッ！' | '表現がヤスッ！';
  /** The finished line lands with the reveal's shock cue and tremble. */
  readonly impact?: true;
  /** The page opens on the unease cue Yasu first walked in on. */
  readonly unease?: true;
  /** Yasu's shoulders start going once the line lands, on that same cue. */
  readonly laugh?: true;
  /** The muzzle is already up as the page opens, on a clack. */
  readonly gun?: true;
}

export interface GameState {
  readonly phase: Phase;
  readonly introIndex: number;
  readonly endingIndex: number;
  readonly bossIndex: number;
  readonly answer: readonly string[];
}

export const INTRO: readonly DialogueStep[] = [
  { speaker: 'ヤス', text: 'ボス、これいじょうのてがかりがありません。めいきゅういりです。' },
  { speaker: 'ヤス', text: 'えっ？　はんにんがわかったんですか？' },
  { speaker: 'あなた', text: 'はんにんは・・・' },
];

export const ENDING: readonly DialogueStep[] = [
  { speaker: 'あなた', text: 'タイトルにかいてあったよ', punchline: 'なぞときがヤスッ！' },
  { speaker: 'あなた', text: 'いわゆる　かおにかいてある\nじょうたいだよ', punchline: '表現がヤスッ！' },
  { speaker: 'あなた', text: 'ヤス、なんで　ごうとうさつじんなんてしたんだ' },
  { speaker: 'ヤス', text: 'いやー ラクしてもうかるバイトだってネットでみて', punchline: '動機がヤスッ！' },
  { speaker: 'ヤス', text: 'でももらったほうしゅうは\n３０００円でしたよ　はっはっは', punchline: '報酬もヤスッ！' },
  { speaker: 'ヤス', text: 'まあ しょはんだし すぐでてこれますよねｗ', punchline: '人としてヤスッ！' },
  { speaker: 'あなた', text: 'ごうとうさつじんだから\nしけいか　むきちょうえきだぞ' },
  {
    speaker: 'ヤス',
    text: 'エッ？　しっこうゆうよはつかないですか！？',
    punchline: 'みとおしがヤスッ！',
    impact: true,
  },
];

/** Naming the boss instead of Yasu turns the confession into evidence. */
export const BOSS: readonly DialogueStep[] = [
  { speaker: 'ヤス', text: 'ボス　じはくとして\nろくおんさせてもらいましたよ', unease: true },
  { speaker: 'ヤス', text: 'それ　そのままじじつに\nさせてもらいますわ', laugh: true },
  { speaker: 'ヤス', text: 'はんにん　ていこうのため\nやむなくせいあつ', gun: true },
  { speaker: 'ヤス', text: 'ボス　ありがとう\nそしてさようなら' },
];

/** Once Yasu draws, the muzzle stays up for the rest of the route. */
export function gunDrawn(state: GameState): boolean {
  if (state.phase === 'boss-end') return true;
  if (state.phase !== 'boss') return false;
  const drawnAt = BOSS.findIndex((step) => step.gun);
  return drawnAt !== -1 && state.bossIndex >= drawnAt;
}

export const ANSWER = 'ヤス';
export const BOSS_ANSWER = 'ボス';
/** Every letter either ending needs, drawn slightly bolder as a nudge. */
export const HINT_KANA: readonly string[] = [...new Set([...ANSWER, ...BOSS_ANSWER])];

export const WRONG: DialogueStep = { speaker: 'ヤス', text: 'いや、ちがうでしょう。やっぱめいきゅういりですよ。' };
export const REVEAL: DialogueStep = { speaker: 'ヤス', text: 'な、なぜわかったんですかっ！？' };

export const KANA = [
  'ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ',
  'サ', 'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト',
  'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ボ',
  'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ',
  'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン',
] as const;

export function createGame(): GameState {
  return { phase: 'title', introIndex: 0, endingIndex: 0, bossIndex: 0, answer: [] };
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
  if (state.phase === 'boss') {
    return state.bossIndex < BOSS.length - 1
      ? { ...state, bossIndex: state.bossIndex + 1 }
      : { ...state, phase: 'boss-end' };
  }
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
  const answer = state.answer.join('');
  if (answer === ANSWER) return { ...state, phase: 'reveal' };
  if (answer === BOSS_ANSWER) return { ...state, phase: 'boss', bossIndex: 0 };
  return { ...state, phase: 'wrong', answer: [] };
}

export function restart(): GameState {
  return createGame();
}

export function currentDialogue(state: GameState): DialogueStep | undefined {
  if (state.phase === 'dialogue') return INTRO[state.introIndex];
  if (state.phase === 'wrong') return WRONG;
  if (state.phase === 'reveal') return REVEAL;
  if (state.phase === 'ending') return ENDING[state.endingIndex];
  if (state.phase === 'boss') return BOSS[state.bossIndex];
  return undefined;
}

export function dialogueText(step: DialogueStep): string {
  return `${step.speaker}「${step.text}」`;
}
