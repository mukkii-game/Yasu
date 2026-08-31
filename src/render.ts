import { KANA, currentDialogue, dialogueText, type GameState } from './game';

export interface RenderOptions {
  readonly visibleCharacters: number;
  readonly punchlineStage: 0 | 1 | 2;
  readonly endPunchlineVisible: boolean;
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function dialogue(state: GameState, options: RenderOptions): string {
  const step = currentDialogue(state);
  if (!step) return '';
  const fullText = dialogueText(step);
  const visibleText = Array.from(fullText).slice(0, options.visibleCharacters).join('');
  const complete = visibleText === fullText;
  const testId = state.phase === 'wrong' ? 'wrong-next' : state.phase === 'reveal' ? 'reveal-next' : state.phase === 'ending' ? 'ending-next' : 'dialogue-next';
  let punchline = '';
  if (complete && step.punchline && options.punchlineStage > 0) {
    const prefix = step.punchline.replace('ヤスッ！', '');
    punchline = `<div class="sprite-punchline split stage-${options.punchlineStage}" data-testid="punchline"><span>${escapeHtml(prefix)}</span>${options.punchlineStage > 1 ? '<strong>ヤスッ！</strong>' : ''}</div>`;
  }
  return `${punchline}<button class="dialogue-box screen-button" data-testid="${testId}" data-action="advance" type="button" aria-label="${escapeHtml(fullText)}">
    <span class="dialogue-copy">${escapeHtml(visibleText)}</span>
    ${complete ? '<span class="next-mark" aria-hidden="true">▼</span>' : ''}
  </button>`;
}

function officeScene(mode: 'plain' | 'nervous' | 'smiling'): string {
  return `<div class="scene office-scene ${mode}" data-scene-mode="${mode}" aria-hidden="true">
    <div class="window"><i></i></div><div class="filing"><i></i><i></i><i></i></div><div class="clock"></div>
    <div class="yasu"><span class="head"><i class="face-name"><b>ヤ</b><b>ス</b></i><i class="mouth"></i></span><span class="body"></span></div>
  </div>`;
}

function endScene(): string {
  return `<div class="end-city" aria-hidden="true"><i class="setting-sun"></i><i class="end-building a"></i><i class="end-building b"></i><i class="end-building c"></i><i class="end-road"></i></div>
    <div class="walkers" aria-hidden="true"><i class="escort"></i><i class="cuffed-yasu"></i><b class="handcuff"></b></div>`;
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
    </span>
    <span class="title-main">犯人はヤス</span><span class="press-start">▶ スタート</span>
  </button>`;
}

export function renderApp(root: HTMLElement, state: GameState, options: RenderOptions): void {
  let content: string;
  if (state.phase === 'title') {
    content = titleScreen();
  } else if (state.phase === 'end') {
    const finalPunchline = options.endPunchlineVisible
      ? '<span class="end-final" data-testid="end-punchline"><strong>ヤスッ！</strong><small>と つっこんでください</small></span>'
      : '';
    content = `<button class="end-screen screen-button" data-action="restart" type="button" aria-label="タイトルへ戻る">${endScene()}<span class="the-end" data-testid="the-end">THE END</span>${finalPunchline}</button>`;
  } else {
    const comedyMode = state.phase === 'ending' && (state.endingIndex >= 1 || options.punchlineStage > 0);
    const sceneMode = comedyMode ? 'smiling' : state.phase === 'reveal' || state.phase === 'ending' ? 'nervous' : 'plain';
    const scene = officeScene(sceneMode);
    content = state.phase === 'input' ? scene + kanaPanel(state) : scene + dialogue(state, options);
  }

  root.innerHTML = `<main class="game-shell"><div class="screen-frame"><section class="game-screen phase-${state.phase}" data-testid="game-screen">
    ${content}
  </section></div></main>`;
}
