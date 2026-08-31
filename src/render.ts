import { KANA, currentDialogue, dialogueText, type GameState } from './game';

export interface RenderOptions {
  readonly muted: boolean;
  readonly visibleCharacters: number;
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function dialogue(state: GameState, visibleCharacters: number): string {
  const step = currentDialogue(state);
  if (!step) return '';
  const fullText = dialogueText(step);
  const visibleText = Array.from(fullText).slice(0, visibleCharacters).join('');
  const complete = visibleText === fullText;
  const testId = state.phase === 'wrong' ? 'wrong-next' : state.phase === 'reveal' ? 'reveal-next' : state.phase === 'ending' ? 'ending-next' : 'dialogue-next';
  const punchline = complete && step.punchline
    ? `<div class="sprite-punchline" data-testid="punchline">${escapeHtml(step.punchline)}</div>`
    : '';
  return `${punchline}<button class="dialogue-box screen-button" data-testid="${testId}" data-action="advance" type="button" aria-label="${escapeHtml(fullText)}">
    <span class="dialogue-copy">${escapeHtml(visibleText)}<i class="type-cursor" aria-hidden="true"></i></span>
    ${complete ? '<span class="next-mark" aria-hidden="true">▼</span>' : ''}
  </button>`;
}

function officeScene(mode: 'normal' | 'shock' | 'after'): string {
  return `<div class="scene office-scene ${mode === 'shock' ? 'shock-reveal' : mode === 'after' ? 'after-reveal' : ''}" data-scene-mode="${mode}" aria-hidden="true">
    <div class="window"><i></i></div><div class="filing"><i></i><i></i><i></i></div><div class="clock"></div>
    <div class="person boss"><span class="head"></span><span class="hair"></span><span class="body"></span></div>
    <div class="person yasu"><span class="head"></span><span class="hair"></span><span class="face"></span><span class="body"></span></div>
    <div class="desk"><i></i></div>${mode === 'shock' ? '<div class="shock-lines"></div><div class="dread-shadow"></div><div class="alarm-streaks"></div>' : ''}
  </div>`;
}

function endScene(): string {
  return `<div class="end-city" aria-hidden="true"><i class="end-building a"></i><i class="end-building b"></i><i class="end-building c"></i><i class="end-road"></i></div>
    <div class="watcher" aria-hidden="true"><i></i></div>
    <div class="walkers" aria-hidden="true"><i class="officer"></i><i class="cuffed"></i><b class="handcuff"></b></div>`;
}

function kanaPanel(state: GameState): string {
  const buttons = KANA.map((character) =>
    `<button type="button" data-action="kana" data-kana="${character}" aria-label="${character}" ${state.answer.length >= 2 ? 'disabled' : ''}>${character}</button>`,
  ).join('');
  return `<section class="kana-panel" data-testid="kana-panel" aria-label="犯人の名前を二文字で選ぶ">
    <div class="answer-line" data-testid="answer-slots"><span>はんにんは</span><b>${state.answer[0] ?? '＿'}</b><b>${state.answer[1] ?? '＿'}</b></div>
    <div class="kana-grid">${buttons}</div>
    <div class="input-controls">
      <button type="button" data-action="delete" ${state.answer.length ? '' : 'disabled'}>けす</button>
      <button type="button" data-action="clear" ${state.answer.length ? '' : 'disabled'}>ぜんぶけす</button>
      <button class="decide" data-testid="decide" type="button" data-action="submit" ${state.answer.length === 2 ? '' : 'disabled'}>けってい</button>
    </div>
  </section>`;
}

function titleScreen(): string {
  return `<button class="title-screen screen-button" data-testid="start-button" data-action="start" type="button" aria-label="犯人はヤス スタート">
    <span class="title-city" aria-hidden="true">
      <i class="building building-a"></i><i class="building building-b"></i><i class="building building-c"></i>
      <i class="street"></i><i class="chalk-body"><b></b></i><i class="title-detective"></i><i class="sun"></i>
    </span>
    <span class="title-main">犯人はヤス</span><span class="press-start">▶ スタート</span>
  </button>`;
}

export function renderApp(root: HTMLElement, state: GameState, options: RenderOptions): void {
  let content: string;
  if (state.phase === 'title') {
    content = titleScreen();
  } else if (state.phase === 'end') {
    content = `<button class="end-screen screen-button" data-action="restart" type="button" aria-label="タイトルへ戻る">${endScene()}<span class="the-end" data-testid="the-end">THE END</span></button>`;
  } else {
    const scene = officeScene(state.phase === 'reveal' ? 'shock' : state.phase === 'ending' ? 'after' : 'normal');
    content = state.phase === 'input' ? scene + kanaPanel(state) : scene + dialogue(state, options.visibleCharacters);
  }

  root.innerHTML = `<main class="game-shell"><div class="screen-frame"><section class="game-screen phase-${state.phase}" data-testid="game-screen">
    ${state.phase !== 'title' && state.phase !== 'end' ? `<button class="sound-toggle" type="button" data-action="sound" aria-label="${options.muted ? '音を出す' : '音を消す'}">${options.muted ? '♪×' : '♪'}</button>` : ''}
    ${content}
  </section></div></main>`;
}
