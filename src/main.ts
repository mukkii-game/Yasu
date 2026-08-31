import {
  advance, chooseKana, clearAnswer, createGame, currentDialogue, deleteKana, dialogueText,
  restart, startGame, submitAnswer, type GameState,
} from './game';
import { renderApp } from './render';
import './style.css';

function required<T>(value: T | null, message: string): T {
  if (value === null) throw new Error(message);
  return value;
}

const root = required(document.querySelector<HTMLElement>('#app'), 'Game root is missing');
const jingle = new Audio(`${import.meta.env.BASE_URL}audio/jingle.wav`);
jingle.preload = 'auto';
jingle.volume = 0.24;

let state: GameState = createGame();
let audio: AudioContext | undefined;
let visibleCharacters = Number.POSITIVE_INFINITY;
let typeTimer: number | undefined;
let punchlineTimer: number | undefined;
let punchlineSecondTimer: number | undefined;
let punchlineStage: 0 | 1 | 2 = 0;

function getAudio(): AudioContext {
  audio ??= new AudioContext();
  if (audio.state === 'suspended') void audio.resume();
  return audio;
}

function revealFanfare(): void {
  const context = getAudio();
  const now = context.currentTime;
  const notes = [
    { at: 0, frequency: 784, duration: 0.07, volume: 0.025 },
    { at: 0.12, frequency: 880, duration: 0.08, volume: 0.025 },
    { at: 0.27, frequency: 784, duration: 0.46, volume: 0.03 },
    { at: 0.27, frequency: 988, duration: 0.46, volume: 0.024 },
    { at: 0.27, frequency: 1175, duration: 0.46, volume: 0.018 },
  ];
  notes.forEach(({ at, frequency, duration, volume }) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, now + at);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + at);
    oscillator.stop(now + at + duration);
  });
}

function playJingle(): void {
  jingle.currentTime = 0;
  void jingle.play().catch(() => undefined);
}

function clearPunchlineTimers(): void {
  if (punchlineTimer !== undefined) window.clearTimeout(punchlineTimer);
  if (punchlineSecondTimer !== undefined) window.clearTimeout(punchlineSecondTimer);
  punchlineTimer = undefined;
  punchlineSecondTimer = undefined;
}

function render(): void {
  renderApp(root, state, { visibleCharacters, punchlineStage });
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
    playJingle();
    render();
    if (step.punchline === '人間としてヤスッ！') {
      punchlineSecondTimer = window.setTimeout(() => {
        punchlineSecondTimer = undefined;
        punchlineStage = 2;
        render();
      }, 500);
    }
  }, 500);
}

function finishTyping(): void {
  if (typeTimer !== undefined) window.clearTimeout(typeTimer);
  typeTimer = undefined;
  visibleCharacters = fullDialogueLength();
  render();
  schedulePunchline();
}

function beginTyping(): void {
  if (typeTimer !== undefined) window.clearTimeout(typeTimer);
  clearPunchlineTimers();
  typeTimer = undefined;
  punchlineStage = 0;
  const total = fullDialogueLength();
  if (!total) {
    visibleCharacters = Number.POSITIVE_INFINITY;
    render();
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    visibleCharacters = total;
    render();
    schedulePunchline();
    return;
  }
  visibleCharacters = 0;
  render();
  const tick = () => {
    visibleCharacters += 1;
    render();
    if (visibleCharacters < total) typeTimer = window.setTimeout(tick, 38);
    else {
      typeTimer = undefined;
      schedulePunchline();
    }
  };
  typeTimer = window.setTimeout(tick, 38);
}

function setState(next: GameState): void {
  if (next === state) return;
  state = next;
  beginTyping();
}

function advanceOrFinish(): void {
  const step = currentDialogue(state);
  if (step && visibleCharacters < fullDialogueLength()) {
    finishTyping();
    return;
  }
  if (step?.punchline) {
    if (punchlineStage === 0 || (step.punchline === '人間としてヤスッ！' && punchlineStage < 2)) return;
  }
  setState(advance(state));
}

function submit(): void {
  const next = submitAnswer(state);
  if (next === state) return;
  state = next;
  if (next.phase === 'reveal') revealFanfare();
  beginTyping();
}

root.addEventListener('click', (event) => {
  const target = (event.target as Element).closest<HTMLElement>('[data-action]');
  if (!target) {
    if (currentDialogue(state)) advanceOrFinish();
    return;
  }
  const action = target.dataset.action;
  if (action === 'start') { setState(startGame(state)); return; }
  if (action === 'kana') { setState(chooseKana(state, target.dataset.kana ?? '')); return; }
  if (action === 'delete') { setState(deleteKana(state)); return; }
  if (action === 'clear') { setState(clearAnswer(state)); return; }
  if (action === 'submit') { submit(); return; }
  if (action === 'advance') { advanceOrFinish(); return; }
  if (action === 'restart') { setState(restart()); }
});

document.addEventListener('keydown', (event) => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.key === 'Tab') return;
  if (state.phase === 'end') { event.preventDefault(); setState(restart()); return; }
  if (state.phase === 'input' && event.key === 'Backspace') {
    event.preventDefault(); setState(deleteKana(state)); return;
  }
  if (currentDialogue(state)) {
    event.preventDefault(); advanceOrFinish(); return;
  }
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  if (state.phase === 'title') setState(startGame(state));
  else if (state.phase === 'input') submit();
});

render();
