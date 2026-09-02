import {
  ENDING, advance, chooseKana, clearAnswer, createGame, currentDialogue, deleteKana, dialogueText,
  restart, startGame, submitAnswer, type GameState,
} from './game';
import { renderApp } from './render';
import './style.css';

function required<T>(value: T | null, message: string): T {
  if (value === null) throw new Error(message);
  return value;
}

const root = required(document.querySelector<HTMLElement>('#app'), 'Game root is missing');
const anxiety = new Audio(`${import.meta.env.BASE_URL}audio/anxiety.mp3`);
const punchlineHit = new Audio(`${import.meta.env.BASE_URL}audio/punchline-hit.mp3`);
const revealShock = new Audio(`${import.meta.env.BASE_URL}audio/reveal-shock.mp3`);
const finalBoom = new Audio(`${import.meta.env.BASE_URL}audio/final-boom.mp3`);

[
  { sound: anxiety, volume: 0.65 },
  { sound: punchlineHit, volume: 0.8 },
  { sound: revealShock, volume: 0.85 },
  { sound: finalBoom, volume: 1 },
].forEach(({ sound, volume }) => {
  sound.preload = 'auto';
  sound.volume = volume;
});

let state: GameState = createGame();
let audio: AudioContext | undefined;
let visibleCharacters = Number.POSITIVE_INFINITY;
let typeTimer: number | undefined;
let punchlineTimer: number | undefined;
let punchlineSecondTimer: number | undefined;
let endTimer: number | undefined;
let endSecondTimer: number | undefined;
let endReturnTimer: number | undefined;
let revealTimer: number | undefined;
let custodyTimer: number | undefined;
let fadeTimer: number | undefined;
let impactTimer: number | undefined;
let punchlineStage: 0 | 1 | 2 = 0;
let endPunchlineStage: 0 | 1 | 2 = 0;
let revealImpact = false;
let impactShake = false;
let fadeOut = false;
let punchlineHoldUntil = 0;

/** Matches the verdict-fade animation in style.css. */
const FADE_MS = 1800;
/** The reveal's shake, reused when a finished line lands as a shock. */
const IMPACT_MS = 1000;
/** How long a landed 「ヤスッ！」 is protected from an impatient tap. */
const PUNCHLINE_HOLD_MS = 900;

function getAudio(): AudioContext {
  audio ??= new AudioContext();
  if (audio.state === 'suspended') void audio.resume();
  return audio;
}

function playSound(sound: HTMLAudioElement): void {
  sound.pause();
  sound.currentTime = 0;
  void sound.play().catch(() => undefined);
}

function textBlip(): void {
  const context = getAudio();
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = visibleCharacters % 4 === 0 ? 392 : 330;
  gain.gain.setValueAtTime(0.018, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.018);
}

function selectionBlip(): void {
  const context = getAudio();
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = 523;
  gain.gain.setValueAtTime(0.022, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.045);
}

function decisionBlip(): void {
  const context = getAudio();
  const now = context.currentTime;
  [523, 659].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.022, now + index * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.07 + 0.065);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + index * 0.07);
    oscillator.stop(now + index * 0.07 + 0.065);
  });
}

function handcuffClack(): void {
  const context = getAudio();
  const now = context.currentTime;
  [
    { at: 0, frequency: 1760, duration: 0.045, volume: 0.04 },
    { at: 0.075, frequency: 880, duration: 0.065, volume: 0.045 },
  ].forEach(({ at, frequency, duration, volume }) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, now + at);
    oscillator.frequency.exponentialRampToValueAtTime(frequency / 2, now + at + duration);
    gain.gain.setValueAtTime(volume, now + at);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + at);
    oscillator.stop(now + at + duration);
  });
}

function punchlineLeadBlip(): void {
  const context = getAudio();
  const now = context.currentTime;
  [659, 784].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.018, now + index * 0.055);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.055 + 0.05);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + index * 0.055);
    oscillator.stop(now + index * 0.055 + 0.05);
  });
}

function clearPunchlineTimers(): void {
  if (punchlineTimer !== undefined) window.clearTimeout(punchlineTimer);
  if (punchlineSecondTimer !== undefined) window.clearTimeout(punchlineSecondTimer);
  punchlineTimer = undefined;
  punchlineSecondTimer = undefined;
}

function isFinalEndingPage(): boolean {
  return state.phase === 'ending' && state.endingIndex === ENDING.length - 1;
}

function clearCustodyTimer(): void {
  if (custodyTimer !== undefined) window.clearTimeout(custodyTimer);
  if (fadeTimer !== undefined) window.clearTimeout(fadeTimer);
  custodyTimer = undefined;
  fadeTimer = undefined;
}

/**
 * The sentence beat holds on the tremble, then the room drains of colour and
 * light before the sunset ending takes over.
 */
function scheduleCustodyTransition(): void {
  clearCustodyTimer();
  custodyTimer = window.setTimeout(() => {
    custodyTimer = undefined;
    if (!isFinalEndingPage() || punchlineStage < 2) return;
    handcuffClack();
    fadeOut = true;
    render();
    fadeTimer = window.setTimeout(() => {
      fadeTimer = undefined;
      setState(advance(state));
    }, FADE_MS);
  }, 1000);
}

function render(): void {
  renderApp(root, state, {
    visibleCharacters, punchlineStage, endPunchlineStage, revealImpact, impactShake, fadeOut,
  });
}

function clearImpactTimer(): void {
  if (impactTimer !== undefined) window.clearTimeout(impactTimer);
  impactTimer = undefined;
  impactShake = false;
}

/** The correction lands the moment it finishes typing, exactly like the reveal. */
function landImpact(): void {
  clearImpactTimer();
  impactShake = true;
  playSound(revealShock);
  render();
  impactTimer = window.setTimeout(() => {
    impactTimer = undefined;
    impactShake = false;
    render();
  }, IMPACT_MS);
}

function fullDialogueLength(): number {
  const step = currentDialogue(state);
  return step ? Array.from(dialogueText(step)).length : 0;
}

function schedulePunchline(): void {
  const step = currentDialogue(state);
  if (!step?.punchline || punchlineStage > 0 || punchlineTimer !== undefined) return;
  punchlineTimer = window.setTimeout(() => {
    punchlineTimer = undefined;
    punchlineStage = 1;
    punchlineLeadBlip();
    render();
    punchlineSecondTimer = window.setTimeout(() => {
      punchlineSecondTimer = undefined;
      punchlineStage = 2;
      playSound(punchlineHit);
      punchlineHoldUntil = Date.now() + PUNCHLINE_HOLD_MS;
      render();
      if (isFinalEndingPage()) scheduleCustodyTransition();
    }, 700);
  }, 1250);
}

function completeLine(): void {
  render();
  if (currentDialogue(state)?.impact) landImpact();
  schedulePunchline();
}

function finishTyping(): void {
  if (typeTimer !== undefined) window.clearTimeout(typeTimer);
  typeTimer = undefined;
  visibleCharacters = fullDialogueLength();
  completeLine();
}

function beginTyping(): void {
  if (typeTimer !== undefined) window.clearTimeout(typeTimer);
  clearPunchlineTimers();
  typeTimer = undefined;
  punchlineStage = 0;
  punchlineHoldUntil = 0;
  clearImpactTimer();
  const total = fullDialogueLength();
  if (!total) {
    visibleCharacters = Number.POSITIVE_INFINITY;
    render();
    return;
  }
  visibleCharacters = 0;
  render();
  const tick = () => {
    visibleCharacters += 1;
    const character = Array.from(dialogueText(currentDialogue(state)!))[visibleCharacters - 1];
    if (visibleCharacters % 2 === 0 && character?.trim()) textBlip();
    render();
    if (visibleCharacters < total) typeTimer = window.setTimeout(tick, 38);
    else {
      typeTimer = undefined;
      completeLine();
    }
  };
  typeTimer = window.setTimeout(tick, 38);
}

function clearEndTimer(): void {
  if (endTimer !== undefined) window.clearTimeout(endTimer);
  if (endSecondTimer !== undefined) window.clearTimeout(endSecondTimer);
  if (endReturnTimer !== undefined) window.clearTimeout(endReturnTimer);
  endTimer = undefined;
  endSecondTimer = undefined;
  endReturnTimer = undefined;
}

function clearRevealTimer(): void {
  if (revealTimer !== undefined) window.clearTimeout(revealTimer);
  revealTimer = undefined;
  revealImpact = false;
}

function scheduleEndPunchline(): void {
  clearEndTimer();
  endTimer = window.setTimeout(() => {
    endTimer = undefined;
    endPunchlineStage = 1;
    punchlineLeadBlip();
    render();
    endSecondTimer = window.setTimeout(() => {
      endSecondTimer = undefined;
      endPunchlineStage = 2;
      playSound(finalBoom);
      render();
      endReturnTimer = window.setTimeout(() => {
        endReturnTimer = undefined;
        setState(restart());
      }, 4200);
    }, 700);
  }, 3650);
}

function setState(next: GameState): void {
  if (next === state) return;
  clearCustodyTimer();
  clearEndTimer();
  clearRevealTimer();
  clearImpactTimer();
  endPunchlineStage = 0;
  fadeOut = false;
  state = next;
  beginTyping();
  if (next.phase === 'end') scheduleEndPunchline();
}

function advanceOrFinish(): void {
  if (revealImpact || impactShake) return;
  const step = currentDialogue(state);
  if (step && visibleCharacters < fullDialogueLength()) {
    finishTyping();
    return;
  }
  if (step?.punchline) {
    if (punchlineStage < 2) return;
    // Let 「ヤスッ！」 finish landing before an eager tap can skip past it.
    if (Date.now() < punchlineHoldUntil) return;
    if (isFinalEndingPage()) return;
  }
  setState(advance(state));
}

function submit(): void {
  const next = submitAnswer(state);
  if (next === state) return;
  state = next;
  if (next.phase === 'reveal') {
    if (typeTimer !== undefined) window.clearTimeout(typeTimer);
    clearPunchlineTimers();
    typeTimer = undefined;
    visibleCharacters = 0;
    revealImpact = true;
    playSound(revealShock);
    render();
    revealTimer = window.setTimeout(() => {
      revealTimer = undefined;
      revealImpact = false;
      beginTyping();
    }, 1000);
    return;
  }
  beginTyping();
}

root.addEventListener('click', (event) => {
  const target = (event.target as Element).closest<HTMLElement>('[data-action]');
  if (!target) {
    if (currentDialogue(state)) advanceOrFinish();
    return;
  }
  const action = target.dataset.action;
  if (action === 'start') { getAudio(); playSound(anxiety); setState(startGame(state)); return; }
  if (action === 'kana') {
    const next = chooseKana(state, target.dataset.kana ?? '');
    if (next !== state) selectionBlip();
    setState(next);
    return;
  }
  if (action === 'delete') { setState(deleteKana(state)); return; }
  if (action === 'clear') { setState(clearAnswer(state)); return; }
  if (action === 'submit') { decisionBlip(); submit(); return; }
  if (action === 'advance') { advanceOrFinish(); return; }
  if (action === 'restart') { setState(restart()); }
});

document.addEventListener('keydown', (event) => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.key === 'Tab') return;
  if (state.phase === 'end') { event.preventDefault(); return; }
  if (state.phase === 'input' && event.key === 'Backspace') {
    event.preventDefault(); setState(deleteKana(state)); return;
  }
  if (currentDialogue(state)) {
    event.preventDefault(); advanceOrFinish(); return;
  }
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  if (state.phase === 'title') { getAudio(); playSound(anxiety); setState(startGame(state)); }
  else if (state.phase === 'input' && state.answer.length === 2) { decisionBlip(); submit(); }
});

render();

function updatePhoneScale(): void {
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  if (viewportWidth < 660) {
    const scale = Math.min(viewportWidth / 320, viewportHeight / 240);
    document.documentElement.style.setProperty('--scale', String(scale));
  } else {
    document.documentElement.style.removeProperty('--scale');
  }
}

updatePhoneScale();
window.addEventListener('resize', updatePhoneScale);
window.visualViewport?.addEventListener('resize', updatePhoneScale);
