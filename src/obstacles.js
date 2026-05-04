(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function pickWeighted(options) {
    const total = options.reduce((sum, option) => sum + option.weight, 0);
    let roll = Math.random() * total;

    for (let index = 0; index < options.length; index += 1) {
      roll -= options[index].weight;
      if (roll <= 0) {
        return options[index].name;
      }
    }

    return options[options.length - 1].name;
  }

  function circleIntersectsRect(circle, rect) {
    const nearestX = Math.max(rect.x, Math.min(circle.position.x, rect.x + rect.width));
    const nearestY = Math.max(rect.y, Math.min(circle.position.y, rect.y + rect.height));
    const dx = circle.position.x - nearestX;
    const dy = circle.position.y - nearestY;
    return dx * dx + dy * dy < circle.radius * circle.radius;
  }

  class ObstacleManager {
    constructor(bounds) {
      this.bounds = bounds;
      this.obstacles = [];
      this.spawnTimer = 0;
      this.elapsed = 0;
      this.lastGapCenter = bounds.height * 0.5;
      this.consecutiveHardPatterns = 0;
      this.styles = {
        standard: {
          bodyStart: "#112e3d",
          bodyEnd: "#1c5565",
          glow: "rgba(108, 229, 255, 0.38)",
          cap: "#ff9e44",
          stripe: "rgba(255, 255, 255, 0.08)"
        },
        recovery: {
          bodyStart: "#14353b",
          bodyEnd: "#23716b",
          glow: "rgba(125, 255, 210, 0.36)",
          cap: "#8ef0c5",
          stripe: "rgba(255, 255, 255, 0.07)"
        },
        squeeze: {
          bodyStart: "#3d2713",
          bodyEnd: "#825129",
          glow: "rgba(255, 201, 112, 0.46)",
          cap: "#ffd27b",
          stripe: "rgba(255, 243, 220, 0.12)"
        },
        pair: {
          bodyStart: "#1a2445",
          bodyEnd: "#325d8a",
          glow: "rgba(117, 167, 255, 0.4)",
          cap: "#8ec6ff",
          stripe: "rgba(255, 255, 255, 0.09)"
        },
        surge: {
          bodyStart: "#31163e",
          bodyEnd: "#6e2e69",
          glow: "rgba(255, 132, 220, 0.42)",
          cap: "#ff98df",
          stripe: "rgba(255, 255, 255, 0.09)"
        }
      };
    }

    reset() {
      this.obstacles = [];
      this.spawnTimer = 1.1;
      this.elapsed = 0;
      this.lastGapCenter = this.bounds.height * 0.5;
      this.consecutiveHardPatterns = 0;
    }

    getDifficulty(score) {
      const intensity = clamp(score / 28, 0, 1);

      return {
        speed: 225 + intensity * 170 + Math.min(this.elapsed * 5, 42),
        spacing: 1.38 - intensity * 0.42,
        gapHeight: 208 - intensity * 54,
        amplitude: 12 + intensity * 26,
        waveSpeed: 0.7 + intensity * 0.7,
        shiftRange: 56 + intensity * 122
      };
    }

    update(dt, player, score) {
      this.elapsed += dt;
      this.spawnTimer -= dt;
      const difficulty = this.getDifficulty(score);

      if (this.spawnTimer <= 0) {
        this.spawnTimer = this.spawnPattern(score, difficulty);
      }

      const passed = [];
      let hit = false;

      for (let index = this.obstacles.length - 1; index >= 0; index -= 1) {
        const obstacle = this.obstacles[index];
        obstacle.age += dt;
        obstacle.x -= difficulty.speed * obstacle.speedMultiplier * dt;
        const animatedGapY = this.getGapY(obstacle);

        if (!obstacle.scored && obstacle.x + obstacle.width < player.position.x) {
          obstacle.scored = true;
          passed.push({
            scoreValue: obstacle.scoreValue,
            x: obstacle.x + obstacle.width * 0.5,
            y: animatedGapY + obstacle.gapHeight * 0.5,
            kind: obstacle.kind
          });
        }

        if (this.collides(player, obstacle, animatedGapY)) {
          hit = true;
        }

        if (obstacle.x + obstacle.width < -40) {
          this.obstacles.splice(index, 1);
        }
      }

      return { passed, hit };
    }

    choosePattern(score) {
      if (score < 3) {
        return "standard";
      }

      if (this.consecutiveHardPatterns >= 2) {
        return "recovery";
      }

      const options = [
        { name: "standard", weight: 5.3 },
        { name: "recovery", weight: score >= 5 ? 1.3 : 0.5 }
      ];

      if (score >= 4) {
        options.push({ name: "squeeze", weight: 1.9 });
      }

      if (score >= 8) {
        options.push({ name: "pair", weight: 1.6 });
      }

      if (score >= 14) {
        options.push({ name: "surge", weight: 1.2 });
      }

      return pickWeighted(options);
    }

    spawnPattern(score, difficulty) {
      const pattern = this.choosePattern(score);

      if (pattern === "recovery") {
        this.consecutiveHardPatterns = 0;
        this.spawnGate({
          kind: "recovery",
          width: randomBetween(80, 104),
          gapHeight: Math.min(this.bounds.height - 150, difficulty.gapHeight + 34),
          amplitude: difficulty.amplitude * 0.58,
          waveSpeed: difficulty.waveSpeed * 0.72,
          shiftRange: difficulty.shiftRange * 0.55,
          speedMultiplier: 0.94,
          scoreValue: 1
        });
        return difficulty.spacing * 0.84;
      }

      if (pattern === "squeeze") {
        this.consecutiveHardPatterns += 1;
        this.spawnGate({
          kind: "squeeze",
          width: randomBetween(84, 100),
          gapHeight: Math.max(128, difficulty.gapHeight - 26),
          amplitude: difficulty.amplitude * 1.2,
          waveSpeed: difficulty.waveSpeed * 1.12,
          shiftRange: difficulty.shiftRange * 1.08,
          speedMultiplier: 1.04,
          scoreValue: 2
        });
        return difficulty.spacing * 1.04;
      }

      if (pattern === "pair") {
        this.consecutiveHardPatterns += 1;
        const first = this.spawnGate({
          kind: "pair",
          width: randomBetween(72, 88),
          gapHeight: Math.max(136, difficulty.gapHeight - 12),
          amplitude: difficulty.amplitude * 0.96,
          waveSpeed: difficulty.waveSpeed * 1.02,
          shiftRange: difficulty.shiftRange * 0.92,
          speedMultiplier: 1.02,
          scoreValue: 1
        });
        const firstCenter = first.gapY + first.gapHeight * 0.5;
        const secondCenter = clamp(
          this.bounds.height - firstCenter + randomBetween(-28, 28),
          90,
          this.bounds.height - 90
        );

        this.spawnGate({
          kind: "pair",
          width: randomBetween(72, 88),
          gapHeight: Math.max(132, difficulty.gapHeight - 16),
          amplitude: difficulty.amplitude,
          waveSpeed: difficulty.waveSpeed * 1.12,
          forcedCenter: secondCenter,
          offsetX: 182,
          shiftRange: difficulty.shiftRange * 0.8,
          speedMultiplier: 1.04,
          scoreValue: 1
        });
        return difficulty.spacing * 1.28;
      }

      if (pattern === "surge") {
        this.consecutiveHardPatterns += 1;
        this.spawnGate({
          kind: "surge",
          width: randomBetween(76, 94),
          gapHeight: Math.max(132, difficulty.gapHeight - 12),
          amplitude: difficulty.amplitude * 1.42,
          waveSpeed: difficulty.waveSpeed * 1.46,
          shiftRange: difficulty.shiftRange,
          speedMultiplier: 1.16,
          scoreValue: 2
        });
        return difficulty.spacing * 1.1;
      }

      this.consecutiveHardPatterns = Math.max(0, this.consecutiveHardPatterns - 1);
      this.spawnGate({
        kind: "standard",
        width: randomBetween(76, 104),
        gapHeight: difficulty.gapHeight,
        amplitude: difficulty.amplitude,
        waveSpeed: difficulty.waveSpeed,
        shiftRange: difficulty.shiftRange,
        speedMultiplier: 1,
        scoreValue: 1
      });
      return difficulty.spacing;
    }

    spawnGate(config) {
      const margin = 64;
      const safeMargin = margin + config.gapHeight * 0.5;
      const minCenter = safeMargin;
      const maxCenter = this.bounds.height - safeMargin;
      const targetCenter =
        typeof config.forcedCenter === "number"
          ? clamp(config.forcedCenter, minCenter, maxCenter)
          : clamp(
              this.lastGapCenter + randomBetween(-config.shiftRange, config.shiftRange),
              minCenter,
              maxCenter
            );
      const gapY = clamp(
        targetCenter - config.gapHeight * 0.5,
        margin,
        this.bounds.height - config.gapHeight - margin
      );
      const obstacle = {
        kind: config.kind,
        x: this.bounds.width + 72 + (config.offsetX || 0),
        width: config.width,
        gapY,
        gapHeight: config.gapHeight,
        age: 0,
        amplitude: config.amplitude,
        waveSpeed: config.waveSpeed,
        phase: Math.random() * Math.PI * 2,
        scored: false,
        scoreValue: config.scoreValue,
        speedMultiplier: config.speedMultiplier
      };

      this.lastGapCenter = gapY + config.gapHeight * 0.5;
      this.obstacles.push(obstacle);
      return obstacle;
    }

    getGapY(obstacle) {
      return clamp(
        obstacle.gapY + Math.sin(obstacle.age * obstacle.waveSpeed + obstacle.phase) * obstacle.amplitude,
        48,
        this.bounds.height - obstacle.gapHeight - 48
      );
    }

    collides(player, obstacle, animatedGapY) {
      const topRect = {
        x: obstacle.x,
        y: 0,
        width: obstacle.width,
        height: animatedGapY
      };
      const bottomRect = {
        x: obstacle.x,
        y: animatedGapY + obstacle.gapHeight,
        width: obstacle.width,
        height: this.bounds.height - animatedGapY - obstacle.gapHeight
      };

      return circleIntersectsRect(player, topRect) || circleIntersectsRect(player, bottomRect);
    }

    draw(ctx) {
      this.obstacles.forEach((obstacle) => {
        const animatedGapY = this.getGapY(obstacle);
        const topHeight = animatedGapY;
        const bottomY = animatedGapY + obstacle.gapHeight;
        const bottomHeight = this.bounds.height - bottomY;
        const style = this.styles[obstacle.kind] || this.styles.standard;

        this.drawColumn(ctx, obstacle.x, 0, obstacle.width, topHeight, style, obstacle.kind);
        this.drawColumn(ctx, obstacle.x, bottomY, obstacle.width, bottomHeight, style, obstacle.kind);
      });
    }

    drawColumn(ctx, x, y, width, height, style, kind) {
      const fill = ctx.createLinearGradient(x, y, x + width, y);
      fill.addColorStop(0, style.bodyStart);
      fill.addColorStop(1, style.bodyEnd);

      ctx.save();
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, width, height);

      ctx.fillStyle = style.stripe;
      ctx.fillRect(x + 8, y, 8, height);

      if (kind === "squeeze") {
        ctx.fillStyle = "rgba(255, 240, 210, 0.08)";
        for (let stripeY = y + 10; stripeY < y + height; stripeY += 22) {
          ctx.fillRect(x + width - 18, stripeY, 12, 8);
        }
      }

      ctx.strokeStyle = style.glow;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = style.cap;
      ctx.fillRect(x - 6, y + height - 12, width + 12, 12);
      ctx.restore();
    }
  }

  window.ObstacleManager = ObstacleManager;
})();
