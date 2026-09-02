import { describe, expect, it } from 'vitest';
import { ENDING, INTRO, WRONG, advance, chooseKana, clearAnswer, createGame, currentDialogue, deleteKana, dialogueText, restart, startGame, submitAnswer } from './game';

function reachInput() {
  let state = startGame(createGame());
  for (let index = 0; index < INTRO.length; index += 1) state = advance(state);
  return state;
}

describe('game flow', () => {
  it('starts on the title and reaches the two-character input after the intro', () => {
    const state = reachInput();
    expect(state.phase).toBe('input');
    expect(state.answer).toEqual([]);
  });

  it('accepts exactly two valid kana', () => {
    let state = reachInput();
    state = chooseKana(state, 'ヤ');
    state = chooseKana(state, 'ス');
    expect(state.answer).toEqual(['ヤ', 'ス']);
    expect(chooseKana(state, 'ア')).toBe(state);
    expect(chooseKana(state, 'A')).toBe(state);
  });

  it('supports delete and clear without mutating earlier state', () => {
    const empty = reachInput();
    const one = chooseKana(empty, 'ヤ');
    const two = chooseKana(one, 'ス');
    expect(deleteKana(two).answer).toEqual(['ヤ']);
    expect(clearAnswer(two).answer).toEqual([]);
    expect(empty.answer).toEqual([]);
  });

  it('reveals the ending only for ヤス', () => {
    let correct = reachInput();
    correct = chooseKana(chooseKana(correct, 'ヤ'), 'ス');
    expect(submitAnswer(correct).phase).toBe('reveal');

    let wrong = reachInput();
    wrong = chooseKana(chooseKana(wrong, 'ア'), 'イ');
    const rejected = submitAnswer(wrong);
    expect(rejected.phase).toBe('wrong');
    expect(rejected.answer).toEqual([]);
    expect(advance(rejected).phase).toBe('input');
  });

  it('does not submit an incomplete answer', () => {
    const one = chooseKana(reachInput(), 'ヤ');
    expect(submitAnswer(one)).toBe(one);
  });

  it('keeps each punchline on the dialogue beat that triggers it', () => {
    let state = reachInput();
    state = chooseKana(chooseKana(state, 'ヤ'), 'ス');
    state = advance(submitAnswer(state));
    const punchlines: string[] = [];
    for (let index = 0; index < ENDING.length; index += 1) {
      const step = currentDialogue(state);
      if (step?.punchline) punchlines.push(step.punchline);
      state = advance(state);
    }
    expect(punchlines).toEqual(['なぞときがヤスッ！', '動機がヤスッ！', '報酬もヤスッ！', '人としてヤスッ！', 'みとおしがヤスッ！']);
    expect(state.phase).toBe('end');
  });

  it('formats speaker quotes and preserves the requested reward line break', () => {
    expect(dialogueText(INTRO[0])).toBe('ヤス「ボス、これいじょうのてがかりがありません。めいきゅういりです。」');
    expect(dialogueText(INTRO[2])).toBe('あなた「はんにんは・・・」');
    expect(dialogueText(WRONG)).toBe('ヤス「いや、ちがうでしょう。やっぱめいきゅういりですよ。」');
    expect(dialogueText(ENDING[0])).toBe('あなた「タイトルにかいてあったよ」');
    expect(dialogueText(ENDING[1])).toBe('あなた「ヤス、なんで　ごうとうさつじんなんてしたんだ」');
    expect(dialogueText(ENDING[3])).toBe('ヤス「でももらったほうしゅうは\n３０００円でしたよ　はっはっは」');
  });

  it('closes on the sentence, with the shock on it and the comeback on Yasu\'s plea', () => {
    const boast = ENDING[ENDING.length - 3];
    expect(dialogueText(boast)).toBe('ヤス「まあ しょはんだし すぐでてこれますよねｗ」');
    expect(boast.punchline).toBe('人としてヤスッ！');

    const sentence = ENDING[ENDING.length - 2];
    expect(dialogueText(sentence)).toBe('あなた「ごうとうさつじんだから\nしけいか　むきちょうえきだぞ」');
    expect(sentence.impact).toBe(true);
    expect(sentence.punchline).toBeUndefined();

    const plea = ENDING[ENDING.length - 1];
    expect(dialogueText(plea)).toBe('ヤス「エッ？　しっこうゆうよはつかないですか！？」');
    expect(plea.punchline).toBe('みとおしがヤスッ！');
    expect(plea.impact).toBeUndefined();

    // Only the sentence carries the shock.
    expect(ENDING.filter((step) => step.impact)).toHaveLength(1);
  });

  it('restart always returns to a clean title state', () => {
    expect(restart()).toEqual(createGame());
  });
});
