import { describe, expect, it } from 'vitest';
import { ENDING, INTRO, advance, chooseKana, clearAnswer, createGame, currentDialogue, deleteKana, dialogueText, restart, startGame, submitAnswer } from './game';

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
    expect(punchlines).toEqual(['なぞときがヤスッ！', '動機がヤスッ！', '報酬もヤスッ！', '人間としてヤスッ！']);
    expect(state.phase).toBe('end');
  });

  it('formats the speaker and quote on one continuous line', () => {
    expect(dialogueText(INTRO[0])).toBe('ヤス「ボス、これいじょうのてがかりがありません。めいきゅういりです。」');
    expect(dialogueText(ENDING[0])).toBe('あなた「おまえのかおにかいてあるよ」');
    expect(dialogueText(ENDING[1])).toBe('あなた「ヤス、なぜこんなころしをしたんだ」');
    expect(dialogueText(ENDING[3])).toBe('ヤス「でももらったほうしゅうは３０００円でしたよ　はっはっは」');
  });

  it('restart always returns to a clean title state', () => {
    expect(restart()).toEqual(createGame());
  });
});
