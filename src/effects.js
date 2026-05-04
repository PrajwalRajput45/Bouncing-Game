(function () {
  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  class ParticleSystem {
    constructor() {
      this.particles = [];
      this.labels = [];
    }

    reset() {
      this.particles = [];
      this.labels = [];
    }

    emitBurst(x, y, options) {
      const config = options || {};
      const count = config.count || 12;
      const colors = config.colors || ["#6ce5ff", "#edf7fb"];

      for (let index = 0; index < count; index += 1) {
        const life = randomBetween(config.lifeMin || 0.24, config.lifeMax || 0.7);
        const angle = randomBetween(config.angleMin || 0, config.angleMax || Math.PI * 2);
        const speed = randomBetween(config.speedMin || 60, config.speedMax || 220);

        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: config.gravity || 240,
          drag: config.drag || 0.92,
          size: randomBetween(config.sizeMin || 2, config.sizeMax || 6),
          life,
          maxLife: life,
          alpha: config.alpha || 0.9,
          color: colors[index % colors.length]
        });
      }
    }

    emitTrail(x, y, vx, vy) {
      const life = randomBetween(0.18, 0.36);

      this.particles.push({
        x,
        y,
        vx: -vx * 0.15 + randomBetween(-18, 18),
        vy: -vy * 0.1 + randomBetween(-6, 18),
        gravity: -14,
        drag: 0.88,
        size: randomBetween(3, 7),
        life,
        maxLife: life,
        alpha: 0.58,
        color: Math.random() > 0.5 ? "#6ce5ff" : "#edf7fb"
      });
    }

    addLabel(text, x, y, color) {
      this.labels.push({
        text,
        x,
        y,
        vy: -34,
        life: 0.8,
        maxLife: 0.8,
        color: color || "#edf7fb"
      });
    }

    update(dt) {
      for (let index = this.particles.length - 1; index >= 0; index -= 1) {
        const particle = this.particles[index];
        particle.life -= dt;

        if (particle.life <= 0) {
          this.particles.splice(index, 1);
          continue;
        }

        particle.vx *= Math.pow(particle.drag, dt * 60);
        particle.vy *= Math.pow(particle.drag, dt * 60);
        particle.vy += particle.gravity * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
      }

      for (let index = this.labels.length - 1; index >= 0; index -= 1) {
        const label = this.labels[index];
        label.life -= dt;

        if (label.life <= 0) {
          this.labels.splice(index, 1);
          continue;
        }

        label.y += label.vy * dt;
        label.vy *= Math.pow(0.92, dt * 60);
      }
    }

    draw(ctx) {
      if (this.particles.length === 0 && this.labels.length === 0) {
        return;
      }

      ctx.save();

      this.particles.forEach((particle) => {
        const alpha = particle.alpha * (particle.life / particle.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      ctx.textAlign = "center";
      ctx.font = "700 20px 'Segoe UI Variable', 'Trebuchet MS', sans-serif";

      this.labels.forEach((label) => {
        ctx.globalAlpha = label.life / label.maxLife;
        ctx.fillStyle = label.color;
        ctx.fillText(label.text, label.x, label.y);
      });

      ctx.restore();
    }
  }

  class SoundEngine {
    constructor() {
      this.context = null;
      this.master = null;
      this.enabled = true;
    }

    unlock() {
      if (!this.enabled) {
        return;
      }

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return;
      }

      if (!this.context) {
        this.context = new AudioContextClass();
        this.master = this.context.createGain();
        this.master.gain.value = 0.22;
        this.master.connect(this.context.destination);
      }

      if (this.context.state === "suspended") {
        this.context.resume().catch(function () {});
      }
    }

    setEnabled(enabled) {
      this.enabled = enabled;

      if (this.master && this.context) {
        this.master.gain.setTargetAtTime(enabled ? 0.22 : 0.0001, this.context.currentTime, 0.02);
      }
    }

    playTone(options) {
      if (!this.enabled || !this.context || this.context.state !== "running" || !this.master) {
        return;
      }

      const start = this.context.currentTime + (options.delay || 0);
      const duration = options.duration || 0.12;
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();

      oscillator.type = options.type || "sine";
      oscillator.frequency.setValueAtTime(options.frequency || 440, start);

      if (options.slideTo) {
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(40, options.slideTo),
          start + duration
        );
      }

      gainNode.gain.setValueAtTime(0.0001, start);
      gainNode.gain.exponentialRampToValueAtTime(options.gain || 0.045, start + Math.min(0.03, duration * 0.35));
      gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      oscillator.connect(gainNode);
      gainNode.connect(this.master);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
    }

    boost() {
      this.playTone({
        frequency: 520,
        slideTo: 760,
        duration: 0.1,
        gain: 0.05,
        type: "triangle"
      });
    }

    score(scoreValue) {
      if (scoreValue > 1) {
        this.playTone({
          frequency: 620,
          slideTo: 880,
          duration: 0.11,
          gain: 0.045,
          type: "triangle"
        });
        this.playTone({
          frequency: 880,
          slideTo: 1180,
          duration: 0.12,
          gain: 0.032,
          delay: 0.05,
          type: "triangle"
        });
        return;
      }

      this.playTone({
        frequency: 500,
        slideTo: 660,
        duration: 0.1,
        gain: 0.038,
        type: "triangle"
      });
    }

    impact(strength) {
      const frequency = Math.max(120, Math.min(320, 120 + strength * 0.32));

      this.playTone({
        frequency,
        slideTo: frequency * 0.72,
        duration: 0.08,
        gain: 0.028,
        type: "square"
      });
    }

    crash() {
      this.playTone({
        frequency: 240,
        slideTo: 74,
        duration: 0.48,
        gain: 0.085,
        type: "sawtooth"
      });
      this.playTone({
        frequency: 320,
        slideTo: 90,
        duration: 0.32,
        gain: 0.05,
        delay: 0.05,
        type: "square"
      });
    }

    pause() {
      this.playTone({
        frequency: 420,
        slideTo: 320,
        duration: 0.08,
        gain: 0.03,
        type: "triangle"
      });
    }

    resume() {
      this.playTone({
        frequency: 320,
        slideTo: 440,
        duration: 0.08,
        gain: 0.03,
        type: "triangle"
      });
    }

    toggleState(enabled) {
      this.playTone({
        frequency: enabled ? 660 : 240,
        slideTo: enabled ? 780 : 160,
        duration: 0.08,
        gain: 0.03,
        type: "triangle"
      });
    }
  }

  window.ParticleSystem = ParticleSystem;
  window.SoundEngine = SoundEngine;
})();
