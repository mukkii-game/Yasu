import { ENDING, INTRO, KANA, isCutin, type DialogueStep, type GameState } from './game';

function dialogue(step: DialogueStep, testId = 'dialogue-next'): string {
  const lines = step.lines
    .map((line, index) => `<span>${line}${index === step.lines.length - 1 ? '」' : ''}</span>`)
    .join('');
  return `<button class="dialogue-box screen-button" data-testid="${testId}" data-action="advance" type="button" aria-label="会話を進める">
    <span class="dialogue-copy"><b>${step.speaker}</b>「${lines}</span><span class="next-mark" aria-hidden="true">▼</span>
  </button>`;
}

function officeScene(revealed: boolean): string {
  return `<div class="scene office-scene${revealed ? ' revealed' : ''}" aria-hidden="true">
    <div class="window"></div><div class="shelf"><i></i><i></i><i></i><i></i><i></i></div>
    <div class="person boss"><span class="head"></span><span class="body"></span></div>
    <div class="person yasu"><span class="head"></span><span class="hair"></span><span class="body"></span></div>
    <div class="desk"><span></span></div>${revealed ? '<div class="shock-lines"></div>' : ''}
  </div>`;
}

function endScene(): string {
  return `<div class="scene end-scene" aria-hidden="true">
    <div class="night-city"></div><div class="police-car"><span></span><i></i></div>
    <div class="watcher"><span></span><i></i></div>
    <div class="walkers"><span class="officer"></span><span class="cuffed"></span></div><div class="road"></div>
  </div>`;
}

function kanaPanel(state: GameState): string {
  const buttons = KANA.map((character) =>
    `<button type="button" data-action="kana" data-kana="${character}" aria-label="${character}" ${state.answer.length >= 2 ? 'disabled' : ''}>${character}</button>`,
  ).join('');
  return `<section class="kana-panel" data-testid="kana-panel" aria-label="犯人の名前を二文字で選ぶ">
    <div class="answer-line" data-testid="answer-slots"><span>はんにんは</span><span class="${state.answer[0] ? 'filled' : ''}">${state.answer[0] ?? '＿'}</span><span class="${state.answer[1] ? 'filled' : ''}">${state.answer[1] ?? '＿'}</span></div>
    <div class="kana-grid">${buttons}</div>
    <div class="input-controls">
      <button type="button" data-action="delete" ${state.answer.length ? '' : 'disabled'}>けす</button>
      <button type="button" data-action="clear" ${state.answer.length ? '' : 'disabled'}>クリア</button>
      <button class="decide" data-testid="decide" type="button" data-action="submit" ${state.answer.length === 2 ? '' : 'disabled'}>けってい</button>
    </div>
  </section>`;
}

export function renderApp(root: HTMLElement, state: GameState, muted: boolean): void {
  let content = '';
  if (state.phase === 'title') {
    content = `<button class="title-screen screen-button" data-testid="start-button" data-action="start" type="button">
      <span class="title-kicker">8-BIT MYSTERY</span><span class="title-main"><small>はんにんは</small>犯人はヤス</span>
      <span class="title-rule"></span><span class="press-start">▶ PRESS START</span>
      <span class="parody-note">オリジナル・パロディ作品</span><span class="city-pixels" aria-hidden="true"></span>
    </button>`;
  } else {
    const scene = state.phase === 'end' ? endScene() : officeScene(state.phase === 'reveal' || state.phase === 'ending');
    if (state.phase === 'dialogue') content = scene + dialogue(INTRO[state.introIndex]);
    else if (state.phase === 'input') content = scene + kanaPanel(state);
    else if (state.phase === 'wrong') content = scene + dialogue({ kind: 'dialogue', speaker: 'ヤス', lines: ['いや、ちがうでしょう。', 'もういちど かんがえてください。'] }, 'wrong-next');
    else if (state.phase === 'reveal') content = scene + dialogue({ kind: 'dialogue', speaker: 'ヤス', lines: ['な、なぜわかったんですかっ！？'] }, 'reveal-next') + '<div class="screen-flash"></div>';
    else if (state.phase === 'ending' && isCutin(state)) {
      const step = ENDING[state.endingIndex];
      if (step.kind === 'cutin') content = `${scene}<button class="cutin screen-button" data-testid="cutin" data-action="advance" type="button"><span>${step.lines[0]}</span><strong>${step.lines[1]}</strong><i>▶</i></button><div class="screen-flash"></div>`;
    } else if (state.phase === 'ending') {
      const step = ENDING[state.endingIndex];
      if (step.kind === 'dialogue') content = scene + dialogue(step, 'ending-next');
    } else if (state.phase === 'end') {
      content = `${scene}<div class="end-copy"><p data-testid="the-end">THE END</p><span>ヤスは しずかに れんこうされた</span><button type="button" data-action="restart">もういちど</button></div>`;
    }
    content = `<header class="title-bar"><span>じけんファイル 01</span><span>さいしゅうすいり</span></header>${content}`;
  }

  root.innerHTML = `<section class="game-shell"><div class="game-screen phase-${state.phase}" data-testid="game-screen">
    <button class="sound-toggle" type="button" data-action="sound" aria-label="${muted ? '音を出す' : '音を消す'}">${muted ? '♪×' : '♪'}</button>
    ${content}<div class="scanlines" aria-hidden="true"></div>
  </div><p class="outside-hint">タップ / クリック / ENTER　　♪ サウンドあり</p></section>`;
}
