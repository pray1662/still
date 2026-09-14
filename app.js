const MODES = {
  focus: { label: 'Focus', seconds: 25 * 60 },
  short: { label: 'Short break', seconds: 5 * 60 },
  long: { label: 'Long break', seconds: 15 * 60 }
};

const app = document.querySelector('.app');
const timeDisplay = document.getElementById('timeDisplay');
const modeLabel = document.getElementById('modeLabel');
const timerHint = document.getElementById('timerHint');
const timerButton = document.getElementById('timerButton');
const progressCircle = document.getElementById('progressCircle');
const resetButton = document.getElementById('resetButton');
const skipButton = document.getElementById('skipButton');
const themeToggle = document.getElementById('themeToggle');
const soundToggle = document.getElementById('soundToggle');
const autoToggle = document.getElementById('autoToggle');
const presetButtons = [...document.querySelectorAll('.preset')];
const sessionDots = [...document.querySelectorAll('.dot')];

const radius = 116;
const circumference = 2 * Math.PI * radius;
progressCircle.style.strokeDasharray = String(circumference);

let mode = 'focus';
let focusIndex = 0;
let remaining = MODES.focus.seconds;
let duration = remaining;
let running = false;
let endAt = null;
let tickId = null;
let soundOn = localStorage.getItem('still-sound') !== 'off';
let autoStart = localStorage.getItem('still-auto') === 'on';

function formatTime(seconds) {
  const whole = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateUI() {
  timeDisplay.textContent = formatTime(remaining);
  modeLabel.textContent = MODES[mode].label;
  timerHint.textContent = running ? 'Pause' : (remaining < duration ? 'Resume' : 'Start');
  timerButton.setAttribute('aria-label', running ? 'Pause timer' : 'Start timer');

  const progress = duration ? 1 - remaining / duration : 0;
  progressCircle.style.strokeDashoffset = String(circumference * (1 - progress));

  app.classList.toggle('running', running);
  presetButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));

  sessionDots.forEach((dot, index) => {
    dot.classList.toggle('completed', index < focusIndex);
    dot.classList.toggle('active', mode === 'focus' && index === focusIndex);
  });

  soundToggle.textContent = `Sound ${soundOn ? 'on' : 'off'}`;
  soundToggle.setAttribute('aria-pressed', String(soundOn));
  autoToggle.textContent = `Auto-start ${autoStart ? 'on' : 'off'}`;
  autoToggle.setAttribute('aria-pressed', String(autoStart));

  document.title = running ? `${formatTime(remaining)} · ${MODES[mode].label} · Still` : 'Still';
}

function start() {
  if (running) return;
  running = true;
  endAt = Date.now() + remaining * 1000;
  tickId = window.setInterval(tick, 250);
  tick();
}

function pause() {
  if (!running) return;
  tick();
  running = false;
  endAt = null;
  window.clearInterval(tickId);
  tickId = null;
  updateUI();
}

function tick() {
  if (!running || !endAt) return;
  remaining = Math.max(0, (endAt - Date.now()) / 1000);
  updateUI();
  if (remaining <= 0) completeSession();
}

function reset() {
  pause();
  duration = MODES[mode].seconds;
  remaining = duration;
  updateUI();
}

function setMode(nextMode, shouldStart = false) {
  pause();
  mode = nextMode;
  duration = MODES[mode].seconds;
  remaining = duration;
  updateUI();
  if (shouldStart) start();
}

function advanceSequence() {
  if (mode === 'focus') {
    focusIndex += 1;
    if (focusIndex >= 4) {
      focusIndex = 0;
      setMode('long', autoStart);
    } else {
      setMode('short', autoStart);
    }
  } else {
    setMode('focus', autoStart);
  }
}

function completeSession() {
  running = false;
  window.clearInterval(tickId);
  tickId = null;
  remaining = 0;
  updateUI();
  signalComplete();
  window.setTimeout(advanceSequence, 650);
}

function skip() {
  pause();
  advanceSequence();
}

function signalComplete() {
  if (soundOn) playChime();
  if ('vibrate' in navigator) navigator.vibrate([80, 70, 130]);
}

function playChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    [523.25, 659.25].forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + index * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.12, now + index * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.18 + 0.45);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + index * 0.18);
      osc.stop(now + index * 0.18 + 0.48);
    });
  } catch (_) {}
}

function initTheme() {
  const saved = localStorage.getItem('still-theme');
  const darkPreferred = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = saved || (darkPreferred ? 'dark' : 'light');
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('still-theme', next);
}

timerButton.addEventListener('click', () => running ? pause() : start());
resetButton.addEventListener('click', reset);
skipButton.addEventListener('click', skip);
themeToggle.addEventListener('click', toggleTheme);

presetButtons.forEach(button => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

soundToggle.addEventListener('click', () => {
  soundOn = !soundOn;
  localStorage.setItem('still-sound', soundOn ? 'on' : 'off');
  updateUI();
});

autoToggle.addEventListener('click', () => {
  autoStart = !autoStart;
  localStorage.setItem('still-auto', autoStart ? 'on' : 'off');
  updateUI();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && running) tick();
});

window.addEventListener('keydown', event => {
  if (event.code === 'Space') {
    event.preventDefault();
    running ? pause() : start();
  }
  if (event.key.toLowerCase() === 'r') reset();
  if (event.key.toLowerCase() === 's') skip();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}

initTheme();
updateUI();
