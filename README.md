# Flappy Bird — Responsive 2D Web Game

A complete, responsive Flappy Bird-style 2D browser game built with **HTML5**, **CSS3**, **Vanilla JavaScript**, **HTML5 Canvas**, **Web Audio API**, and **LocalStorage**.

## Features

- **Responsive Full-Screen Canvas**: Adapts cleanly to desktop monitors, Windows laptops, tablets, and mobile phones (portrait & landscape) with consistent delta-time physics.
- **Game Screens**:
  - **Main Menu**: Animated background flight, Play button, Best Score badge, and Sound toggle.
  - **Gameplay**: Live score counter, pause button, sound toggle, and "Get Ready" first-flap prompt.
  - **Pause & Game Over**: Score, Best Score, `NEW!` high-score indicator, Medal rewards (`Bronze` 10+, `Silver` 20+, `Gold` 30+, `Platinum` 50+), Play Again, and Main Menu.
- **Controls**:
  - **Desktop**: `Space` / `ArrowUp` / Left Mouse Click to flap, `P` or `Esc` to pause, `M` to mute/unmute, `Enter` to start or restart.
  - **Mobile / Touch**: Tap anywhere on the canvas to flap, with `touch-action: none` and `overscroll-behavior: none` to prevent accidental scrolling or zooming.
- **Procedural Sound Effects**: Web Audio API wing flap, score chime, collision impact, game-over cadence, and UI clicks.
- **Performance**: Single `requestAnimationFrame` loop, delta-time clamping, object pooling for particles and pipes, automatic pause on tab switch.

## Project Structure

```text
.
├── index.html
├── style.css
├── game.js
├── assets/
│   ├── images/
│   │   └── bird-icon.svg
│   └── sounds/
│       └── README.md
└── README.md
```

## Running Locally

Because this is a static HTML5 project, you can run it with any static server:

```bash
# Using Python 3
python -m http.server 8080

# Or using Node.js (npx)
npx serve .
```

Then open `http://localhost:8080` in your browser.

## Deploying to Vercel or Netlify

### Vercel
1. Install Vercel CLI (`npm i -g vercel`) or connect your Git repository at [vercel.com](https://vercel.com).
2. Run `vercel` in the project directory (Framework Preset: **Other**, Build Command: none, Output Directory: `.`).

### Netlify
1. Drag and drop the project folder onto [app.netlify.com/drop](https://app.netlify.com/drop), or deploy via CLI:
   ```bash
   npm i -g netlify-cli
   netlify deploy --prod --dir=.
   ```

