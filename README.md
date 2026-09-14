# Still

A minimal, dependency-free Pomodoro timer PWA.

## Features

- 25-minute focus sessions
- 5-minute short breaks
- 15-minute long breaks after four focus sessions
- Circular progress indicator
- Start, pause, reset and skip controls
- Optional auto-start
- Optional completion sound and device vibration
- Light and dark modes
- Offline support via service worker
- Installable as a PWA
- Background-safe timing based on timestamps rather than interval counting
- Keyboard shortcuts: Space = start/pause, R = reset, S = skip

## Local preview

Because service workers require HTTP(S), preview with a tiny local server rather than opening `index.html` directly.

For example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy

This project is designed to work directly with GitHub Pages.
