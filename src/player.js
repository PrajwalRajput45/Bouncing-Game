(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  class Ball {
    constructor(bounds) {
      this.radius = 18;
      this.gravity = 1080;
      this.maxFallSpeed = 860;
      this.horizontalAcceleration = 920;
      this.horizontalDamping = 0.92;
      this.maxHorizontalSpeed = 330;
      this.wallBounce = 0.84;
      this.floorBounce = 0.8;
      this.ceilingBounce = 0.88;
      this.basePosition = {
        x: bounds.width * 0.22,
        y: bounds.height * 0.35
      };
      this.position = { x: this.basePosition.x, y: this.basePosition.y };
      this.velocity = { x: 0, y: 0 };
    }

    reset() {
      this.position.x = this.basePosition.x;
      this.position.y = this.basePosition.y;
      this.velocity.x = 145;
      this.velocity.y = 0;
    }

    idle(time) {
      this.position.x = this.basePosition.x + Math.cos(time * 1.4) * 22;
      this.position.y = this.basePosition.y + Math.sin(time * 2.1) * 16;
      this.velocity.x = 0;
      this.velocity.y = 0;
    }

    boost() {
      this.velocity.y = Math.min(this.velocity.y, 140);
      this.velocity.y -= 440;
    }

    update(dt, bounds, input) {
      const impacts = [];

      if (input.left) {
        this.velocity.x -= this.horizontalAcceleration * dt;
      }

      if (input.right) {
        this.velocity.x += this.horizontalAcceleration * dt;
      }

      if (!input.left && !input.right) {
        this.velocity.x *= Math.pow(this.horizontalDamping, dt * 60);
      }

      this.velocity.x = clamp(
        this.velocity.x,
        -this.maxHorizontalSpeed,
        this.maxHorizontalSpeed
      );
      this.velocity.y = Math.min(this.velocity.y + this.gravity * dt, this.maxFallSpeed);
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;

      if (this.position.x - this.radius < 0) {
        const impactSpeed = Math.abs(this.velocity.x);
        this.position.x = this.radius;
        this.velocity.x = Math.abs(this.velocity.x) * this.wallBounce;
        impacts.push({
          type: "wall",
          x: this.position.x,
          y: this.position.y,
          strength: impactSpeed
        });
      }

      if (this.position.x + this.radius > bounds.width) {
        const impactSpeed = Math.abs(this.velocity.x);
        this.position.x = bounds.width - this.radius;
        this.velocity.x = -Math.abs(this.velocity.x) * this.wallBounce;
        impacts.push({
          type: "wall",
          x: this.position.x,
          y: this.position.y,
          strength: impactSpeed
        });
      }

      if (this.position.y - this.radius < 0) {
        const impactSpeed = Math.abs(this.velocity.y);
        this.position.y = this.radius;
        this.velocity.y = Math.abs(this.velocity.y) * this.ceilingBounce;
        impacts.push({
          type: "ceiling",
          x: this.position.x,
          y: this.position.y,
          strength: impactSpeed
        });
      }

      if (this.position.y + this.radius > bounds.height) {
        const impactSpeed = Math.abs(this.velocity.y);
        this.position.y = bounds.height - this.radius;
        this.velocity.y = -Math.abs(this.velocity.y) * this.floorBounce;
        this.velocity.x *= 0.98;
        impacts.push({
          type: "floor",
          x: this.position.x,
          y: this.position.y,
          strength: impactSpeed
        });
      }

      return { impacts };
    }

    draw(ctx) {
      const glow = ctx.createRadialGradient(
        this.position.x - 5,
        this.position.y - 6,
        4,
        this.position.x,
        this.position.y,
        this.radius * 1.8
      );
      glow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      glow.addColorStop(0.35, "rgba(118, 236, 255, 0.95)");
      glow.addColorStop(1, "rgba(23, 124, 151, 0)");

      ctx.save();
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius * 1.85, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = "#4ad9ff";
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = "transparent";
      ctx.fillStyle = "#eaffff";
      ctx.beginPath();
      ctx.arc(
        this.position.x - this.radius * 0.3,
        this.position.y - this.radius * 0.38,
        this.radius * 0.36,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.42)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius - 1, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  window.Ball = Ball;
})();
