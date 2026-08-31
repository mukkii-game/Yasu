import { describe, expect, it } from 'vitest';
import { ENDING, INTRO, advance, chooseKana, clearAnswer, createGame, deleteKana, isCutin, restart, startGame, submitAnswer } from './game';

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

  it('runs all ending beats and exposes each cut-in', () => {
    let state = reachInput();
    state = chooseKana(chooseKana(state, 'ヤ'), 'ス');
    state = advance(submitAnswer(state));
    const cutins: string[] = [];
    for (let index = 0; index < ENDING.length; index += 1) {
      if (isCutin(state)) cutins.push(ENDING[state.endingIndex].lines.join(''));
      state = advance(state);
    }
    expect(cutins).toEqual(['動機がヤスッ！', '報酬もヤスッ！', '人間としてヤスッ！']);
    expect(state.phase).toBe('end');
  });

  it('restart always returns to a clean title state', () => {
    expect(restart()).toEqual(createGame());
  });
});
