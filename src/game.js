(function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const actionButton = document.getElementById("actionButton");
  const pauseButton = document.getElementById("pauseButton");
  const soundButton = document.getElementById("soundButton");
  const motionButton = document.getElementById("motionButton");
  const statusPill = document.getElementById("statusPill");
  const leftButton = document.getElementById("leftButton");
  const boostButton = document.getElementById("boostButton");
  const rightButton = document.getElementById("rightButton");
  const bounds = { width: canvas.width, height: canvas.height };
  const storageKeys = {
    bestScore: "bounce-loop-best-score",
    soundEnabled: "bounce-loop-sound-enabled",
    reducedMotion: "bounce-loop-reduced-motion"
  };

  function readNumber(key, fallback) {
    try {
      const value = Number.parseInt(window.localStorage.getItem(key), 10);
      return Number.isFinite(value) ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function readBoolean(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);

      if (value === null) {
        return fallback;
      }

      return value === "true";
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch (error) {
      return;
    }
  }

  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const settings = {
    soundEnabled: readBoolean(storageKeys.soundEnabled, true),
    reducedMotion: readBoolean(storageKeys.reducedMotion, prefersReducedMotion)
  };

  const input = {
    left: false,
    right: false
  };

  const state = {
    mode: "ready",
    score: 0,
    bestScore: readNumber(storageKeys.bestScore, 0),
    flash: 0,
    time: 0,
    shake: 0,
    trailTimer: 0,
    lastBounceSoundAt: -10,
    newBest: false
  };

  const player = new Ball(bounds);
  const obstacles = new ObstacleManager(bounds);
  const particles = new ParticleSystem();
  const sound = new SoundEngine();
  let lastFrame = performance.now();

  sound.setEnabled(settings.soundEnabled);

  function setDirection(direction, isActive) {
    input[direction] = isActive;
    leftButton.classList.toggle("is-active", input.left);
    rightButton.classList.toggle("is-active", input.right);
  }

  function clearInput() {
    setDirection("left", false);
    setDirection("right", false);
  }

  function resetSession() {
    state.score = 0;
    state.flash = 0;
    state.time = 0;
    state.shake = 0;
    state.trailTimer = 0;
    state.lastBounceSoundAt = -10;
    state.newBest = false;
    clearInput();
    player.reset();
    obstacles.reset();
    particles.reset();
  }

  function startGame() {
    sound.unlock();
    resetSession();
    state.mode = "running";
    performBoost(true);
    updateButton();
  }

  function endGame() {
    state.mode = "gameover";
    state.flash = 1;
    state.shake = Math.max(state.shake, 1);

    if (!settings.reducedMotion) {
      particles.emitBurst(player.position.x, player.position.y, {
        count: 28,
        speedMin: 120,
        speedMax: 320,
        sizeMin: 3,
        sizeMax: 7,
        colors: ["#ff8f75", "#ffcc6d", "#edf7fb"]
      });
    }

    sound.crash();
    if (state.score > state.bestScore) {
      state.bestScore = state.score;
      state.newBest = true;
      writeStorage(storageKeys.bestScore, state.bestScore);
    }
    updateButton();
  }

  function performBoost(isStartingRun) {
    player.boost();

    if (!settings.reducedMotion) {
      particles.emitBurst(player.position.x, player.position.y + player.radius * 0.75, {
        count: isStartingRun ? 14 : 9,
        speedMin: 70,
        speedMax: 220,
        sizeMin: 2,
        sizeMax: 5,
        gravity: 110,
        colors: ["#6ce5ff", "#edf7fb", "#ffcc6d"]
      });
      state.shake = Math.max(state.shake, isStartingRun ? 0.18 : 0.08);
    }

    sound.boost();
  }

  function pauseGame() {
    if (state.mode !== "running") {
      return;
    }

    clearInput();
    state.mode = "paused";
    sound.pause();
    updateButton();
  }

  function resumeGame() {
    if (state.mode !== "paused") {
      return;
    }

    state.mode = "running";
    sound.resume();
    updateButton();
  }

  function togglePause() {
    sound.unlock();

    if (state.mode === "running") {
      pauseGame();
      return;
    }

    if (state.mode === "paused") {
      resumeGame();
    }
  }

  function handleAction(event) {
    if (event) {
      event.preventDefault();
    }

    sound.unlock();

    if (state.mode === "ready") {
      startGame();
      return;
    }

    if (state.mode === "paused") {
      resumeGame();
      return;
    }

    if (state.mode === "running") {
      performBoost(false);
      return;
    }

    startGame();
  }

  function updateButton() {
    if (state.mode === "ready") {
      actionButton.textContent = "Start Game";
      statusPill.textContent = "Ready for launch";
      statusPill.dataset.mode = "ready";
      pauseButton.textContent = "Pause";
      pauseButton.disabled = true;
    } else if (state.mode === "running") {
      actionButton.textContent = "Boost";
      statusPill.textContent = "Run live";
      statusPill.dataset.mode = "running";
      pauseButton.textContent = "Pause";
      pauseButton.disabled = false;
    } else if (state.mode === "paused") {
      actionButton.textContent = "Resume";
      statusPill.textContent = "Paused";
      statusPill.dataset.mode = "paused";
      pauseButton.textContent = "Resume";
      pauseButton.disabled = false;
    } else {
      actionButton.textContent = "Restart";
      statusPill.textContent = "Run ended";
      statusPill.dataset.mode = "gameover";
      pauseButton.textContent = "Pause";
      pauseButton.disabled = true;
    }

    soundButton.textContent = settings.soundEnabled ? "Sound: On" : "Sound: Off";
    soundButton.setAttribute("aria-pressed", settings.soundEnabled ? "true" : "false");
    motionButton.textContent = settings.reducedMotion ? "Motion: Reduced" : "Motion: Full";
    motionButton.setAttribute("aria-pressed", settings.reducedMotion ? "true" : "false");
  }

  function toggleSound() {
    if (settings.soundEnabled) {
      sound.unlock();
      sound.toggleState(false);
    }

    settings.soundEnabled = !settings.soundEnabled;
    sound.setEnabled(settings.soundEnabled);
    writeStorage(storageKeys.soundEnabled, settings.soundEnabled);

    if (settings.soundEnabled) {
      sound.unlock();
      sound.toggleState(true);
    }

    updateButton();
  }

  function toggleReducedMotion() {
    settings.reducedMotion = !settings.reducedMotion;
    writeStorage(storageKeys.reducedMotion, settings.reducedMotion);

    if (settings.reducedMotion) {
      state.shake = 0;
      state.trailTimer = 0;
      particles.reset();
    }

    updateButton();
  }

  function handleKeyDown(event) {
    const key = event.key.toLowerCase();

    if (key === "arrowleft" || key === "a") {
      event.preventDefault();
      setDirection("left", true);
      return;
    }

    if (key === "arrowright" || key === "d") {
      event.preventDefault();
      setDirection("right", true);
      return;
    }

    if (key === " " || key === "arrowup" || key === "w") {
      event.preventDefault();
      if (!event.repeat) {
        handleAction(event);
      }
      return;
    }

    if (key === "p" && !event.repeat) {
      event.preventDefault();
      togglePause();
      return;
    }

    if (key === "m" && !event.repeat) {
      event.preventDefault();
      toggleSound();
      return;
    }

    if (key === "r" && !event.repeat) {
      event.preventDefault();
      startGame();
    }
  }

  function handleKeyUp(event) {
    const key = event.key.toLowerCase();

    if (key === "arrowleft" || key === "a") {
      event.preventDefault();
      setDirection("left", false);
      return;
    }

    if (key === "arrowright" || key === "d") {
      event.preventDefault();
      setDirection("right", false);
    }
  }

  function handleImpactEffects(impacts) {
    impacts.forEach((impact) => {
      if (!settings.reducedMotion && impact.strength > 110) {
        particles.emitBurst(impact.x, impact.y, {
          count: impact.type === "floor" ? 8 : 6,
          speedMin: 24,
          speedMax: 120,
          sizeMin: 2,
          sizeMax: 4,
          gravity: 180,
          colors: impact.type === "floor" ? ["#ffcc6d", "#edf7fb"] : ["#6ce5ff", "#edf7fb"],
          alpha: 0.7
        });
      }

      if (impact.strength > 170 && state.time - state.lastBounceSoundAt > 0.08) {
        sound.impact(impact.strength);
        state.lastBounceSoundAt = state.time;
      }
    });
  }

  function handlePassedObstacles(passed) {
    passed.forEach((entry) => {
      state.score += entry.scoreValue;
      sound.score(entry.scoreValue);

      if (!settings.reducedMotion) {
        particles.emitBurst(entry.x, entry.y, {
          count: entry.scoreValue > 1 ? 18 : 10,
          speedMin: 40,
          speedMax: 180,
          sizeMin: 2,
          sizeMax: 5,
          gravity: 120,
          colors:
            entry.scoreValue > 1
              ? ["#ffcc6d", "#ffd27b", "#edf7fb"]
              : ["#6ce5ff", "#edf7fb"],
          alpha: 0.82
        });
        state.shake = Math.max(state.shake, entry.scoreValue > 1 ? 0.1 : 0.04);
      }

      particles.addLabel(
        entry.scoreValue > 1 ? "+" + entry.scoreValue + " risk" : "+1",
        entry.x,
        entry.y - 8,
        entry.scoreValue > 1 ? "#ffcc6d" : "#6ce5ff"
      );
    });
  }

  function update(dt) {
    state.time += dt;
    state.flash = Math.max(0, state.flash - dt * 2.3);
    state.shake = Math.max(0, state.shake - dt * 3.2);

    if (state.mode !== "paused") {
      particles.update(dt);
    }

    if (state.mode === "ready") {
      player.idle(state.time);
      return;
    }

    if (state.mode !== "running") {
      return;
    }

    const playerEvents = player.update(dt, bounds, input);
    handleImpactEffects(playerEvents.impacts);

    if (!settings.reducedMotion) {
      state.trailTimer -= dt;

      while (state.trailTimer <= 0) {
        particles.emitTrail(
          player.position.x - player.velocity.x * 0.02,
          player.position.y - player.velocity.y * 0.02,
          player.velocity.x,
          player.velocity.y
        );
        state.trailTimer += 0.03;
      }
    } else {
      state.trailTimer = 0;
    }

    const step = obstacles.update(dt, player, state.score);

    handlePassedObstacles(step.passed);

    if (step.hit) {
      endGame();
    }
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, bounds.height);
    sky.addColorStop(0, "#19435c");
    sky.addColorStop(1, "#0d1d28");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, bounds.width, bounds.height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    for (let index = 0; index <= bounds.width; index += 40) {
      ctx.fillRect(index, 0, 1, bounds.height);
    }
    for (let index = 0; index <= bounds.height; index += 40) {
      ctx.fillRect(0, index, bounds.width, 1);
    }

    const waveOffset = Math.sin(state.time * 0.9) * 10;
    ctx.fillStyle = "rgba(255, 158, 68, 0.12)";
    ctx.beginPath();
    ctx.moveTo(0, bounds.height - 86 + waveOffset);
    ctx.quadraticCurveTo(bounds.width * 0.3, bounds.height - 118, bounds.width * 0.54, bounds.height - 68);
    ctx.quadraticCurveTo(bounds.width * 0.76, bounds.height - 30, bounds.width, bounds.height - 94);
    ctx.lineTo(bounds.width, bounds.height);
    ctx.lineTo(0, bounds.height);
    ctx.closePath();
    ctx.fill();
  }

  function drawHud() {
    ctx.save();
    ctx.fillStyle = "rgba(5, 12, 18, 0.68)";
    ctx.fillRect(18, 18, 234, 78);

    ctx.strokeStyle = "rgba(108, 229, 255, 0.24)";
    ctx.strokeRect(18, 18, 234, 78);

    ctx.fillStyle = "#a6c4d2";
    ctx.font = "14px 'Segoe UI Variable', 'Trebuchet MS', sans-serif";
    ctx.fillText("Score", 34, 42);
    ctx.fillText("Best", 34, 68);
    ctx.fillText("Stage", 156, 42);
    ctx.fillText(String(1 + Math.floor(state.score / 8)), 164, 68);

    ctx.fillStyle = "#edf7fb";
    ctx.font = "bold 30px 'Segoe UI Variable', 'Trebuchet MS', sans-serif";
    ctx.fillText(String(state.score), 102, 46);
    ctx.fillText(String(state.bestScore), 102, 72);
    ctx.restore();
  }

  function drawOverlay() {
    if (state.mode === "running") {
      return;
    }

    ctx.save();
    ctx.fillStyle = state.mode === "gameover" ? "rgba(7, 12, 18, 0.58)" : "rgba(7, 12, 18, 0.44)";
    ctx.fillRect(0, 0, bounds.width, bounds.height);

    ctx.fillStyle = "#ffcc6d";
    ctx.font = "700 16px 'Segoe UI Variable', 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      state.mode === "ready"
        ? "Bounce into the moving gaps"
        : state.mode === "paused"
          ? "Run suspended"
          : state.newBest
            ? "New best run"
            : "Crash detected",
      bounds.width / 2,
      bounds.height / 2 - 56
    );

    ctx.fillStyle = "#edf7fb";
    ctx.font = "700 48px 'Segoe UI Variable', 'Trebuchet MS', sans-serif";
    ctx.fillText(
      state.mode === "ready" ? "Bounce Loop" : state.mode === "paused" ? "Paused" : "Run Over",
      bounds.width / 2,
      bounds.height / 2
    );

    ctx.fillStyle = "#a6c4d2";
    ctx.font = "20px 'Segoe UI Variable', 'Trebuchet MS', sans-serif";
    ctx.fillText(
      state.mode === "ready"
        ? "Press space or click to start, then keep the ball alive."
        : state.mode === "paused"
          ? "Press P or tap Resume when you want back in."
          : "Press R, click, or use the button to restart.",
      bounds.width / 2,
      bounds.height / 2 + 38
    );

    if (state.mode === "gameover") {
      ctx.fillText(
        "Final score: " + state.score,
        bounds.width / 2,
        bounds.height / 2 + 72
      );
    }

    ctx.restore();
  }

  function drawFlash() {
    if (state.flash <= 0) {
      return;
    }

    ctx.save();
    ctx.fillStyle = "rgba(255, 98, 79, " + (state.flash * 0.35).toFixed(3) + ")";
    ctx.fillRect(0, 0, bounds.width, bounds.height);
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, bounds.width, bounds.height);
    ctx.save();

    if (!settings.reducedMotion && state.shake > 0) {
      const magnitude = state.shake * 14;
      ctx.translate(
        (Math.random() - 0.5) * magnitude,
        (Math.random() - 0.5) * magnitude
      );
    }

    drawBackground();
    obstacles.draw(ctx);
    particles.draw(ctx);
    player.draw(ctx);
    ctx.restore();

    drawHud();
    drawOverlay();
    drawFlash();
  }

  function frame(now) {
    const dt = Math.min((now - lastFrame) / 1000, 1 / 30);
    lastFrame = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  function bindDirectionalButton(button, direction) {
    function activate(event) {
      event.preventDefault();
      setDirection(direction, true);
    }

    function deactivate(event) {
      event.preventDefault();
      setDirection(direction, false);
    }

    button.addEventListener("pointerdown", activate);
    button.addEventListener("pointerup", deactivate);
    button.addEventListener("pointercancel", deactivate);
    button.addEventListener("pointerleave", deactivate);
  }

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseGame();
    }
  });
  canvas.addEventListener("pointerdown", handleAction);
  actionButton.addEventListener("click", handleAction);
  pauseButton.addEventListener("click", togglePause);
  soundButton.addEventListener("click", toggleSound);
  motionButton.addEventListener("click", toggleReducedMotion);
  boostButton.addEventListener("click", handleAction);
  bindDirectionalButton(leftButton, "left");
  bindDirectionalButton(rightButton, "right");

  updateButton();
  player.idle(0);
  obstacles.reset();
  render();
  requestAnimationFrame(frame);
})();
