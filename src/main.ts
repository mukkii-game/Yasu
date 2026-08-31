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
const sfx = {
  select: new Audio(`${import.meta.env.BASE_URL}audio/select.wav`),
  wrong: new Audio(`${import.meta.env.BASE_URL}audio/wrong.wav`),
  shock: new Audio(`${import.meta.env.BASE_URL}audio/shock.wav`),
};
Object.values(sfx).forEach((sound) => { sound.preload = 'auto'; sound.volume = 0.32; });

let state: GameState = createGame();
let muted = false;
let audio: AudioContext | undefined;
let visibleCharacters = Number.POSITIVE_INFINITY;
let typeTimer: number | undefined;
let punchlineSoundKey = '';

function getAudio(): AudioContext | undefined {
  if (muted) return undefined;
  audio ??= new AudioContext();
  if (audio.state === 'suspended') void audio.resume();
  return audio;
}

function tone(frequency: number, duration = 0.025, volume = 0.022): void {
  const context = getAudio();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function play(name: keyof typeof sfx): void {
  if (muted) return;
  const sound = sfx[name];
  sound.currentTime = 0;
  void sound.play().catch(() => undefined);
}

function horrorSting(): void {
  play('shock');
  const context = getAudio();
  if (!context) return;
  const now = context.currentTime;

  ([
    ['square', 92, 43, 0.055],
    ['square', 99, 47, 0.042],
    ['triangle', 61, 36, 0.07],
  ] as const).forEach(([type, from, to, volume]) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(to, now + 0.78);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.82);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.84);
  });

  const noiseLength = Math.floor(context.sampleRate * 0.72);
  const buffer = context.createBuffer(1, noiseLength, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let register = 0x7fff;
  let value = 1;
  for (let index = 0; index < noiseLength; index += 1) {
    if (index % 18 === 0) {
      const bit = (register ^ (register >> 1)) & 1;
      register = (register >> 1) | (bit << 14);
      value = register & 1 ? 1 : -1;
    }
    samples[index] = value;
  }
  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  noise.buffer = buffer;
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1200, now);
  filter.frequency.exponentialRampToValueAtTime(120, now + 0.72);
  gain.gain.setValueAtTime(0.075, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);
  noise.connect(filter).connect(gain).connect(context.destination);
  noise.start(now);
}

function flashScreen(): void {
  root.classList.remove('reveal-flash');
  void root.offsetWidth;
  root.classList.add('reveal-flash');
  window.setTimeout(() => root.classList.remove('reveal-flash'), 760);
}

function render(): void {
  renderApp(root, state, { muted, visibleCharacters });
}

function fullDialogueLength(): number {
  const step = currentDialogue(state);
  return step ? Array.from(dialogueText(step)).length : 0;
}

function punchlineKey(): string {
  const step = currentDialogue(state);
  return step?.punchline ? `${state.phase}:${state.endingIndex}:${step.punchline}` : '';
}

function finishTyping(): void {
  if (typeTimer !== undefined) window.clearTimeout(typeTimer);
  typeTimer = undefined;
  visibleCharacters = fullDialogueLength();
  render();
  const key = punchlineKey();
  if (key && key !== punchlineSoundKey) {
    punchlineSoundKey = key;
    play('shock');
  }
}

function beginTyping(): void {
  if (typeTimer !== undefined) window.clearTimeout(typeTimer);
  typeTimer = undefined;
  const total = fullDialogueLength();
  if (!total) {
    visibleCharacters = Number.POSITIVE_INFINITY;
    render();
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    visibleCharacters = total;
    render();
    return;
  }
  visibleCharacters = 0;
  render();
  const tick = () => {
    visibleCharacters += 1;
    if (visibleCharacters % 2 === 0) tone(state.phase === 'ending' ? 294 : 330);
    render();
    if (visibleCharacters < total) typeTimer = window.setTimeout(tick, 38);
    else {
      typeTimer = undefined;
      const key = punchlineKey();
      if (key && key !== punchlineSoundKey) {
        punchlineSoundKey = key;
        play('shock');
      }
    }
  };
  typeTimer = window.setTimeout(tick, 38);
}

function setState(next: GameState, effect?: keyof typeof sfx): void {
  if (next === state) return;
  state = next;
  if (effect) play(effect);
  beginTyping();
}

function advanceOrFinish(): void {
  if (currentDialogue(state) && visibleCharacters < fullDialogueLength()) {
    finishTyping();
    return;
  }
  setState(advance(state), 'select');
}

root.addEventListener('click', (event) => {
  const target = (event.target as Element).closest<HTMLElement>('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'sound') { muted = !muted; render(); return; }
  if (action === 'start') { getAudio(); setState(startGame(state), 'select'); return; }
  if (action === 'kana') { setState(chooseKana(state, target.dataset.kana ?? '')); tone(420 + state.answer.length * 70); return; }
  if (action === 'delete') { setState(deleteKana(state)); tone(180); return; }
  if (action === 'clear') { setState(clearAnswer(state)); tone(140); return; }
  if (action === 'submit') {
    const next = submitAnswer(state);
    if (next === state) return;
    state = next;
    if (next.phase === 'reveal') { horrorSting(); flashScreen(); }
    else play('wrong');
    beginTyping();
    return;
  }
  if (action === 'advance') { advanceOrFinish(); return; }
  if (action === 'restart') { setState(restart(), 'select'); }
});

document.addEventListener('keydown', (event) => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  if (state.phase === 'end') { event.preventDefault(); setState(restart(), 'select'); return; }
  if (state.phase === 'input' && event.key === 'Backspace') {
    event.preventDefault(); setState(deleteKana(state)); tone(180); return;
  }
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  if (state.phase === 'title') { getAudio(); setState(startGame(state), 'select'); }
  else if (state.phase === 'input') {
    const next = submitAnswer(state);
    if (next !== state) {
      state = next;
      if (next.phase === 'reveal') { horrorSting(); flashScreen(); }
      else play('wrong');
      beginTyping();
    }
  } else advanceOrFinish();
});

render();
