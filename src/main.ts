import { advance, chooseKana, clearAnswer, createGame, deleteKana, isCutin, restart, startGame, submitAnswer, type GameState } from './game';
import { renderApp } from './render';
import './style.css';

function required<T>(value: T | null, message: string): T {
  if (value === null) throw new Error(message);
  return value;
}

const root = required(document.querySelector<HTMLElement>('#app'), 'Game root is missing');

let state: GameState = createGame();
let muted = false;
let audio: AudioContext | undefined;
let endingTimer: number | undefined;

function getAudio(): AudioContext | undefined {
  if (muted) return undefined;
  audio ??= new AudioContext();
  if (audio.state === 'suspended') void audio.resume();
  return audio;
}

function tone(frequency = 440, duration = 0.06, type: OscillatorType = 'square', volume = 0.045): void {
  const context = getAudio();
  if (!context) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function shock(): void {
  const context = getAudio();
  if (!context) return;
  [0, 0.09, 0.18].forEach((offset, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index === 2 ? 'sawtooth' : 'square';
    oscillator.frequency.setValueAtTime(130 - index * 23, context.currentTime + offset);
    oscillator.frequency.exponentialRampToValueAtTime(52, context.currentTime + offset + 0.25);
    gain.gain.setValueAtTime(0.085, context.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + offset + 0.3);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + offset);
    oscillator.stop(context.currentTime + offset + 0.31);
  });
}

function syncEndingMusic(): void {
  if (endingTimer !== undefined) window.clearInterval(endingTimer);
  endingTimer = undefined;
  if (state.phase !== 'end' || muted) return;
  const notes = [262, 330, 392, 523, 392, 440, 494, 392];
  let note = 0;
  const play = () => { tone(notes[note++ % notes.length], 0.16, 'square', 0.025); };
  play();
  endingTimer = window.setInterval(play, 220);
}

function render(): void {
  renderApp(root, state, muted);
  syncEndingMusic();
}

function move(next: GameState, sound = 220): void {
  state = next;
  tone(sound, 0.04);
  render();
}

root.addEventListener('click', (event) => {
  const target = (event.target as Element).closest<HTMLElement>('[data-action]');
  if (!target) return;
  const action = target.dataset.action;
  if (action === 'sound') { muted = !muted; render(); return; }
  if (action === 'start') {
    tone(392, 0.08); window.setTimeout(() => tone(523, 0.12), 80);
    state = startGame(state); render(); return;
  }
  if (action === 'kana') { move(chooseKana(state, target.dataset.kana ?? ''), 360 + state.answer.length * 90); return; }
  if (action === 'delete') { move(deleteKana(state)); return; }
  if (action === 'clear') { move(clearAnswer(state)); return; }
  if (action === 'submit') {
    const next = submitAnswer(state);
    if (next.phase === 'reveal') shock(); else if (next.phase === 'wrong') tone(92, 0.28, 'square', 0.06);
    state = next; render(); return;
  }
  if (action === 'advance') {
    const next = advance(state);
    if (!isCutin(state) && isCutin(next)) shock();
    move(next, isCutin(next) ? 110 : 220); return;
  }
  if (action === 'restart') { move(restart(), 196); }
});

document.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  if (state.phase === 'input' && event.key === 'Backspace') {
    event.preventDefault(); move(deleteKana(state)); return;
  }
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  if (state.phase === 'title') { state = startGame(state); tone(392, 0.08); render(); }
  else if (state.phase === 'input') { state = submitAnswer(state); if (state.phase === 'reveal') shock(); render(); }
  else if (state.phase !== 'end') { move(advance(state)); }
});

render();
