# Repository Guidelines

## Project Structure & Module Organization

This repository contains a 2D bouncing ball browser game built using the Canvas API.

```id="z3sk1a"
/root
 ├── .vscode/           # Editor settings
 ├── src/               # Core game logic (recommended location)
 │    ├── game.js       # Game loop, physics, rendering
 │    ├── player.js     # Ball/player logic (future split)
 │    ├── obstacles.js  # Obstacles and collisions
 ├── assets/            # Images, sounds (optional)
 ├── tests/             # Automated tests (future)
 ├── docs/              # Design notes
 ├── index.html         # Entry point
 ├── style.css          # UI styling
 └── README.md          # Project overview
```

* Keep gameplay logic inside `src/`
* Do not mix UI and game loop logic
* Prefer small, focused modules

---

## Build, Test, and Development Commands

Currently no build system is required.

* `open index.html` → Run the game locally
* `code .` → Open project in VS Code
* `Get-ChildItem -Recurse -File` → Review project files

Future (if Node.js is added):

* `npm install` → install dependencies
* `npm run dev` → start dev server
* `npm test` → run tests

---

## Coding Style & Naming Conventions

* Use **2-space indentation**
* `camelCase` → variables & functions (`updateGameState`)
* `PascalCase` → classes (`Ball`, `GameEngine`)
* `kebab-case` → file names (`game-loop.js`)

Guidelines:

* Keep functions small and readable
* Avoid unnecessary re-renders or heavy logic inside loops
* Use `requestAnimationFrame` (NOT `setInterval`)

Optional tools:

* Prettier
* ESLint

---

## Testing Guidelines

No framework is set yet.

When adding tests:

* Place inside `tests/`
* Mirror source structure
* Naming:

  * `game.test.js`
  * `collision.test.js`

Focus testing on:

* Collision detection
* Physics accuracy
* Game state transitions

---

## Commit & Pull Request Guidelines

### Commits

Use clear, consistent messages:

* `feat: add bouncing physics`
* `fix: resolve collision bug`
* `refactor: optimize render loop`

### Pull Requests

Include:

* What changed and why
* Screenshots/GIFs for gameplay updates
* Steps to test manually

Keep PRs small and focused.

---

## Architecture Overview

* Core loop uses `requestAnimationFrame`
* Physics handled manually (gravity, bounce)
* Rendering via Canvas API
* Game state managed centrally

---

## Agent-Specific Instructions

* Do NOT skip logic or leave placeholders
* Always return complete, runnable code
* Maintain smooth performance (~60 FPS)
* Keep code beginner-friendly with comments
* Follow the defined project structure strictly
