# Architecture Notes

The game is intentionally split into small browser scripts with one clear responsibility each:

- `src/player.js` contains the `Ball` class and all movement physics for the player.
- `src/obstacles.js` contains the `ObstacleManager`, including patterned spawns, difficulty scaling, animation, and circle-vs-rectangle collision tests.
- `src/effects.js` contains the particle system and lightweight Web Audio sound engine.
- `src/game.js` owns the main `requestAnimationFrame` loop, DOM controls, score tracking, pause/settings state, overlays, and persistence of the best score and user settings.

This keeps the game loop readable while avoiding a build step or module loader. New gameplay features should continue to land in the closest focused script rather than expanding `src/game.js` into a catch-all file.
