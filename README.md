# Bounce Loop

Bounce Loop is a Canvas API browser game about keeping a glowing ball alive through shifting obstacle patterns. The current build includes escalating difficulty, multiple gate variants, particle feedback, synth audio, pause controls, and mobile touch input.

## Run locally

Open `index.html` in a browser. No build step or dependencies are required.

## Controls

- `Space`, `W`, `ArrowUp`, click, or the `Boost` touch button: boost upward
- `A` / `ArrowLeft` or the `Left` touch button: steer left
- `D` / `ArrowRight` or the `Right` touch button: steer right
- `P`: pause or resume
- `M`: toggle sound
- `R`: restart

## Project layout

- `index.html`: page shell, toolbar, and touch-control markup
- `style.css`: responsive layout and UI styling
- `src/player.js`: ball movement, bounce handling, and rendering
- `src/obstacles.js`: obstacle patterns, difficulty scaling, and collisions
- `src/effects.js`: particle effects and Web Audio synth cues
- `src/game.js`: main loop, input wiring, score state, settings, and overlays
