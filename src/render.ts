import { HINT_KANA, KANA, currentDialogue, dialogueText, gunDrawn, type GameState } from './game';
import yasuSpriteUrl from './assets/yasu.png';

export interface RenderOptions {
  readonly visibleCharacters: number;
  readonly punchlineStage: 0 | 1 | 2;
  /** The payoff has already played its pop; a re-render must not replay it. */
  readonly payoffPopped: boolean;
  readonly endPunchlineStage: 0 | 1 | 2;
  readonly revealImpact: boolean;
  /** The finished line is landing its shock: same tremble as the reveal. */
  readonly impactShake: boolean;
  /** The screen is draining to black on the way to the ending. */
  readonly fadeOut: boolean;
  /** Progress through the boss ending: gun, shot, red, setup, payoff. */
  readonly bossStage: 0 | 1 | 2 | 3 | 4;
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function punchlineMarkup(state: GameState, options: RenderOptions): string {
  const step = currentDialogue(state);
  if (!step?.punchline || options.punchlineStage === 0) return '';
  if (Array.from(dialogueText(step)).length > options.visibleCharacters) return '';
  const prefix = step.punchline.replace('ヤスッ！', '');
  return `<div class="sprite-punchline split stage-${options.punchlineStage}${options.payoffPopped ? ' settled' : ''}" data-testid="punchline"><span>${escapeHtml(prefix)}</span>${options.punchlineStage > 1 ? '<strong>ヤスッ！</strong>' : ''}</div>`;
}

function dialogue(state: GameState, options: RenderOptions): string {
  const step = currentDialogue(state);
  if (!step) return '';
  const fullText = dialogueText(step);
  const visibleText = Array.from(fullText).slice(0, options.visibleCharacters).join('');
  const complete = visibleText === fullText;
  const testId = state.phase === 'wrong' ? 'wrong-next' : state.phase === 'reveal' ? 'reveal-next' : state.phase === 'ending' ? 'ending-next' : state.phase === 'boss' ? 'boss-next' : 'dialogue-next';
  return `${punchlineMarkup(state, options)}<button class="dialogue-box screen-button" data-testid="${testId}" data-action="advance" type="button" aria-label="${escapeHtml(fullText)}">
    <span class="dialogue-copy">${escapeHtml(visibleText)}${complete ? '<span class="next-mark" aria-hidden="true">▼</span>' : ''}</span>
  </button>`;
}

function officeScene(
  mode: 'plain' | 'nervous' | 'impact' | 'settled',
  laughing: boolean,
  nodding: boolean,
  gun = false,
  nodOnce = false,
): string {
  return `<div class="scene office-scene ${mode}${laughing ? ' laughing' : ''}${nodding ? ' nodding' : ''}${nodOnce ? ' nodding-once' : ''}" data-scene-mode="${mode}" aria-hidden="true">
    <div class="window"><i></i></div>
    ${gun ? '<i class="gun" data-testid="gun"></i>' : ''}
    <div class="yasu"><span class="head"><img src="${yasuSpriteUrl}" alt="" draggable="false"><i class="face-name"><b>ヤ</b><b>ス</b></i></span><span class="body"><img src="${yasuSpriteUrl}" alt="" draggable="false"></span></div>
  </div>`;
}

function endScene(hideWalkers: boolean): string {
  return `<div class="end-city" aria-hidden="true"><i class="setting-sun"></i><i class="end-building a"></i><i class="end-building b"></i><i class="end-building c"></i><i class="end-road"></i></div>
    ${hideWalkers ? '' : '<div class="walkers" aria-hidden="true"><i class="escort"></i><i class="cuffed-yasu"></i><b class="handcuff"></b></div>'}`;
}

/** Yasu's own ending: the confession was the recording, and you were the mark. */
function bossEndScreen(options: RenderOptions): string {
  const stage = options.bossStage;
  const payoff = stage > 2
    ? `<span class="end-final stage-${stage > 3 ? 2 : 1}" data-testid="boss-punchline"><span class="end-setup"><b>ボスのいのち</b></span>${stage > 3 ? '<strong>ヤスッ！</strong>' : ''}</span>`
    : '';
  return `<div class="boss-screen stage-${stage}${stage > 3 ? ' finale' : ''}" data-testid="boss-screen" aria-label="エンディング">
    ${officeScene('plain', false, false, true)}
    <i class="redout" aria-hidden="true"></i>
    ${stage > 1 ? '<span class="the-end" data-testid="the-end">THE END</span>' : ''}
    ${payoff}
  </div>`;
}

function kanaPanel(state: GameState): string {
  const buttons = KANA.map((character) =>
    `<button type="button" class="${HINT_KANA.includes(character) ? 'hint' : ''}" data-action="kana" data-kana="${character}" aria-label="${character}" ${state.answer.length >= 2 ? 'disabled' : ''}>${character}</button>`,
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
      <i class="title-yasu"><img src="${yasuSpriteUrl}" alt="" draggable="false"></i>
    </span>
    <span class="title-main">犯人はヤス</span><span class="press-start">▶ スタート</span>
  </button>`;
}

export function renderApp(root: HTMLElement, state: GameState, options: RenderOptions): void {
  let content: string;
  if (state.phase === 'title') {
    content = titleScreen();
  } else if (state.phase === 'boss-end') {
    content = bossEndScreen(options);
  } else if (state.phase === 'end') {
    const finalPunchline = options.endPunchlineStage > 0
      ? `<span class="end-final stage-${options.endPunchlineStage}" data-testid="end-punchline"><span class="end-setup"><b>このゲーム</b><b>なにもかも</b></span>${options.endPunchlineStage > 1 ? '<strong>ヤスッ！</strong>' : ''}</span>`
      : '';
    content = `<div class="end-screen${options.endPunchlineStage > 1 ? ' finale' : ''}" data-testid="end-screen" aria-label="エンディング">${endScene(options.endPunchlineStage > 0)}<span class="the-end" data-testid="the-end">THE END</span>${finalPunchline}</div>`;
  } else {
    const comedyMode = state.phase === 'ending' && (state.endingIndex >= 1 || options.punchlineStage > 0);
    const shaking = options.revealImpact || options.impactShake;
    const sceneMode = shaking ? 'impact'
      : comedyMode ? 'settled'
      : state.phase === 'reveal' || state.phase === 'ending' || state.phase === 'boss' ? 'nervous'
      : 'plain';
    const step = currentDialogue(state);
    const shownText = step ? Array.from(dialogueText(step)).slice(0, options.visibleCharacters).join('') : '';
    // Keyed off the lines themselves, so inserting a page cannot silently move
    // these onto the wrong one.
    const laughing = (state.phase === 'ending' && shownText.includes('はっはっは'))
      || (state.phase === 'boss' && step?.laughing === true);
    const nodding = state.phase === 'ending' && step !== undefined
      && step.text.startsWith('まあ しょはんだし')
      && shownText === dialogueText(step) && options.punchlineStage === 0;
    // A single nod once the thanks has landed, not the ending's double take.
    const nodOnce = state.phase === 'boss' && step !== undefined && step.nod === true
      && shownText === dialogueText(step);
    // He draws on the line that justifies it, not once the screen has gone.
    const scene = officeScene(sceneMode, laughing, nodding, gunDrawn(state), nodOnce);
    content = state.phase === 'input'
      ? scene + kanaPanel(state)
      : options.revealImpact
        ? scene
        : scene + dialogue(state, options);
  }

  const screenModifiers = `${options.revealImpact ? ' reveal-impact' : ''}${options.impactShake ? ' impact-shake' : ''}${options.fadeOut ? ' fading' : ''}`;
  root.innerHTML = `<main class="game-shell"><div class="screen-frame"><section class="game-screen phase-${state.phase}${screenModifiers}" data-testid="game-screen">
    ${content}
  </section></div></main>`;
}
