/**
 * High-performance HTML5 Canvas Game Engine for Nigul Bird.
 * Supports delta-time physics, high-DPI scaling, custom character rendering,
 * parallax backdrops, pixel-perfect collision detection, and screen shake.
 */

import { LevelConfig, GameState } from '../types/game';

export interface PipePair {
  x: number;
  width: number;
  topHeight: number;
  gap: number;
  scored: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface ScorePopup {
  x: number;
  y: number;
  text: string;
  alpha: number;
  vy: number;
}

export interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Viewport dimensions
  public logicalWidth = 440;
  public logicalHeight = 680;
  public groundHeight = 90;
  public groundY = 590;

  // State
  public state: GameState = 'MENU';
  public currentLevel: LevelConfig;
  public score = 0;

  // Character physics
  public birdX = 110;
  public birdY = 280;
  public birdVy = 0;
  public birdRadius = 18;
  public birdRotation = 0;
  private flapTime = 0;
  private squashX = 1;
  private squashY = 1;

  // Custom character image
  private customImg: HTMLImageElement | null = null;
  private customImgLoaded = false;

  // Obstacles & Environment
  public pipes: PipePair[] = [];
  private pipeSpawnTimer = 0;
  private groundScroll = 0;
  private cloudScroll = 0;

  // Effects
  private particles: Particle[] = [];
  private popups: ScorePopup[] = [];
  private stars: Star[] = [];
  private screenShake = 0;
  private hitFlash = 0;

  // Loop management
  private animationFrameId: number | null = null;
  private lastTime = 0;

  // Callbacks
  public onScoreChange?: (score: number, target: number) => void;
  public onLevelComplete?: (levelId: number, score: number) => void;
  public onGameOver?: (score: number, levelId: number) => void;
  public onVictory?: (finalScore: number) => void;
  public onJumpTriggered?: () => void;

  constructor(canvas: HTMLCanvasElement, initialLevel: LevelConfig) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
    this.currentLevel = initialLevel;
    this.groundY = this.logicalHeight - this.groundHeight;

    this.initStars();
    this.resizeCanvas();
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    this.resizeCanvas();
  };

  public resizeCanvas(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const rect = this.canvas.getBoundingClientRect();
    const displayWidth = rect.width || this.logicalWidth;
    const displayHeight = rect.height || this.logicalHeight;

    this.canvas.width = Math.round(displayWidth * dpr);
    this.canvas.height = Math.round(displayHeight * dpr);

    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
    this.ctx.scale((displayWidth * dpr) / this.logicalWidth, (displayHeight * dpr) / this.logicalHeight);
    this.ctx.imageSmoothingEnabled = false; // Authentic crisp pixel style
  }

  public setCustomCharacter(dataUrl: string | null): void {
    if (!dataUrl) {
      this.customImg = null;
      this.customImgLoaded = false;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.customImg = img;
      this.customImgLoaded = true;
    };
    img.onerror = () => {
      console.warn('Failed to load custom character image, using default mascot');
      this.customImg = null;
      this.customImgLoaded = false;
    };
    img.src = dataUrl;
  }

  public setLevel(level: LevelConfig): void {
    this.currentLevel = level;
    this.initStars();
  }

  private initStars(): void {
    this.stars = [];
    if (!this.currentLevel.theme.stars) return;
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: Math.random() * this.logicalWidth,
        y: Math.random() * (this.groundY * 0.75),
        radius: Math.random() * 1.5 + 0.8,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 2 + 1,
      });
    }
  }

  // --------------------------------------------------------------------------
  // GAME LIFECYCLE CONTROLS
  // --------------------------------------------------------------------------

  public startLevel(level: LevelConfig): void {
    this.currentLevel = level;
    this.score = 0;
    this.birdY = this.logicalHeight * 0.42;
    this.birdVy = 0;
    this.birdRotation = 0;
    this.pipes = [];
    this.particles = [];
    this.popups = [];
    this.screenShake = 0;
    this.hitFlash = 0;
    this.pipeSpawnTimer = 0.8; // Brief initial runway
    this.state = 'PLAYING';

    this.onScoreChange?.(this.score, this.currentLevel.targetScore);
    this.startLoop();
  }

  public resetToMenu(): void {
    this.state = 'MENU';
    this.pipes = [];
    this.particles = [];
    this.popups = [];
    this.score = 0;
    this.birdY = this.logicalHeight * 0.42;
    this.birdVy = 0;
    this.birdRotation = 0;
    this.startLoop();
  }

  public pause(): void {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    }
  }

  public resume(): void {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
    }
  }

  /**
   * Action trigger for jump / flap.
   * Invoked on mouse click, space key, touch tap.
   */
  public triggerJump(): void {
    if (this.state === 'MENU') {
      this.startLevel(this.currentLevel);
      // Also apply initial jump on start
      this.applyFlap();
      return;
    }

    if (this.state === 'PLAYING') {
      this.applyFlap();
    }
  }

  private applyFlap(): void {
    this.birdVy = -this.currentLevel.jumpForce;
    this.flapTime = performance.now();
    this.squashX = 0.82;
    this.squashY = 1.22;

    // Spawn puff particles
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: this.birdX - 12 + (Math.random() * 6 - 3),
        y: this.birdY + 12 + (Math.random() * 4 - 2),
        vx: -(Math.random() * 40 + 20),
        vy: (Math.random() * 30 - 15),
        size: Math.random() * 3 + 2,
        color: '#ffffff',
        alpha: 0.8,
        life: 0,
        maxLife: 0.3,
      });
    }

    this.onJumpTriggered?.();
  }

  // --------------------------------------------------------------------------
  // GAME LOOP & PHYSICS
  // --------------------------------------------------------------------------

  public startLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stopLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    window.removeEventListener('resize', this.handleResize);
  }

  private loop = (timestamp: number): void => {
    const rawDt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent tunneling on frame drop

    this.update(dt, timestamp);
    this.render(timestamp);

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number, timestamp: number): void {
    // Parallax ground & clouds always move gently
    const baseSpeed = this.state === 'PLAYING' ? this.currentLevel.pipeSpeed : 45;
    this.groundScroll = (this.groundScroll + baseSpeed * dt) % 24;
    this.cloudScroll = (this.cloudScroll + baseSpeed * 0.25 * dt) % this.logicalWidth;

    // Decay squash & stretch smoothly
    this.squashX += (1 - this.squashX) * Math.min(dt * 12, 1);
    this.squashY += (1 - this.squashY) * Math.min(dt * 12, 1);

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 25);
    }
    if (this.hitFlash > 0) {
      this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
    }

    // Update particles & popups
    this.updateParticlesAndPopups(dt);

    if (this.state === 'MENU') {
      // Idle bobbing
      this.birdY = this.logicalHeight * 0.42 + Math.sin(timestamp * 0.005) * 12;
      this.birdRotation = Math.sin(timestamp * 0.004) * 0.08;
      return;
    }

    if (this.state !== 'PLAYING') {
      // Paused or Game Over falling
      if (this.state === 'GAME_OVER' && this.birdY + this.birdRadius < this.groundY) {
        this.birdVy += this.currentLevel.gravity * dt;
        this.birdY += this.birdVy * dt;
        this.birdRotation = Math.min(this.birdRotation + dt * 4, Math.PI / 2);
      }
      return;
    }

    // --- Active Playing Physics ---
    this.birdVy += this.currentLevel.gravity * dt;
    this.birdY += this.birdVy * dt;

    // Calculate rotation: tilts up on flap (-25 deg) and dives smoothly when falling (+75 deg)
    if (this.birdVy < 0) {
      this.birdRotation = Math.max(-0.45, this.birdVy * 0.002);
    } else {
      this.birdRotation = Math.min(1.25, this.birdRotation + dt * 3.8);
    }

    // Ceiling check
    if (this.birdY - this.birdRadius <= 0) {
      this.birdY = this.birdRadius;
      this.birdVy = 0;
    }

    // Ground collision
    if (this.birdY + this.birdRadius >= this.groundY) {
      this.birdY = this.groundY - this.birdRadius;
      this.handleCrash();
      return;
    }

    // --- Pipe Spawning & Movement ---
    this.pipeSpawnTimer += dt;
    const spawnThreshold = this.currentLevel.pipeInterval / this.currentLevel.pipeSpeed;
    if (this.pipeSpawnTimer >= spawnThreshold) {
      this.pipeSpawnTimer = 0;
      this.spawnPipePair();
    }

    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= this.currentLevel.pipeSpeed * dt;

      // Score check: passing pipe center
      if (!p.scored && p.x + p.width * 0.5 <= this.birdX) {
        p.scored = true;
        this.score++;
        this.spawnScoreFeedback(p.x + p.width, p.topHeight + p.gap * 0.5);
        this.onScoreChange?.(this.score, this.currentLevel.targetScore);

        // Check level completion
        if (this.score >= this.currentLevel.targetScore) {
          this.handleLevelComplete();
          return;
        }
      }

      // Check collision
      if (this.checkCollisionWithPipe(p)) {
        this.handleCrash();
        return;
      }

      // Remove offscreen pipes
      if (p.x + p.width < -20) {
        this.pipes.splice(i, 1);
      }
    }
  }

  private spawnPipePair(): void {
    const gap = this.currentLevel.pipeGap;
    const minTop = 60;
    const maxTop = this.groundY - gap - 60;
    const topHeight = Math.floor(minTop + Math.random() * (maxTop - minTop));

    this.pipes.push({
      x: this.logicalWidth + 20,
      width: 66,
      topHeight,
      gap,
      scored: false,
    });
  }

  private checkCollisionWithPipe(p: PipePair): boolean {
    const bx = this.birdX;
    const by = this.birdY;
    const r = this.birdRadius * 0.85; // Slightly forgiving hitbox for fair retro gameplay

    const topPipeBottom = p.topHeight;
    const bottomPipeTop = p.topHeight + p.gap;

    // In horizontal column of pipe?
    if (bx + r > p.x && bx - r < p.x + p.width) {
      // Hits top pipe
      if (by - r < topPipeBottom) {
        return true;
      }
      // Hits bottom pipe
      if (by + r > bottomPipeTop) {
        return true;
      }
    }

    return false;
  }

  private handleCrash(): void {
    if (this.state !== 'PLAYING') return;
    this.state = 'GAME_OVER';
    this.screenShake = 12;
    this.hitFlash = 1.0;

    // Spawn crash debris particles
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 140 + 40;
      this.particles.push({
        x: this.birdX,
        y: this.birdY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        size: Math.random() * 4 + 3,
        color: i % 2 === 0 ? '#ef4444' : '#fbbf24',
        alpha: 1,
        life: 0,
        maxLife: 0.65,
      });
    }

    this.onGameOver?.(this.score, this.currentLevel.id);
  }

  private handleLevelComplete(): void {
    if (this.state !== 'PLAYING') return;

    if (this.currentLevel.id === 10) {
      this.state = 'VICTORY';
      this.onVictory?.(this.score);
    } else {
      this.state = 'LEVEL_COMPLETE';
      this.onLevelComplete?.(this.currentLevel.id, this.score);
    }

    // Celebration fireworks
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 180 + 60;
      this.particles.push({
        x: this.logicalWidth * 0.5 + (Math.random() * 100 - 50),
        y: this.logicalHeight * 0.35 + (Math.random() * 80 - 40),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 3,
        color: ['#fbbf24', '#38bdf8', '#ec4899', '#4ade80', '#a855f7'][Math.floor(Math.random() * 5)],
        alpha: 1,
        life: 0,
        maxLife: 1.0,
      });
    }
  }

  private spawnScoreFeedback(x: number, y: number): void {
    this.popups.push({
      x,
      y,
      text: '+1',
      alpha: 1.0,
      vy: -65,
    });

    // Sparkles
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x,
        y: y + (Math.random() * 20 - 10),
        vx: Math.random() * 60 - 30,
        vy: Math.random() * 60 - 30,
        size: Math.random() * 3 + 2,
        color: '#fef08a',
        alpha: 1,
        life: 0,
        maxLife: 0.45,
      });
    }
  }

  private updateParticlesAndPopups(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt; // subtle gravity
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    }

    for (let i = this.popups.length - 1; i >= 0; i--) {
      const pop = this.popups[i];
      pop.y += pop.vy * dt;
      pop.alpha -= dt * 1.5;
      if (pop.alpha <= 0) {
        this.popups.splice(i, 1);
      }
    }
  }

  // --------------------------------------------------------------------------
  // RENDERING ENGINE
  // --------------------------------------------------------------------------

  private render(timestamp: number): void {
    const ctx = this.ctx;
    ctx.save();

    // Screen shake offset
    if (this.screenShake > 0) {
      const dx = (Math.random() * 2 - 1) * this.screenShake;
      const dy = (Math.random() * 2 - 1) * this.screenShake;
      ctx.translate(dx, dy);
    }

    // 1. Draw Sky & Atmosphere
    this.renderSky();

    // 2. Parallax Backdrop (Sun/Moon, Stars, Grid, Clouds)
    this.renderAtmosphere(timestamp);

    // 3. Pipes
    this.renderPipes();

    // 4. Moving Ground
    this.renderGround();

    // 5. Particles & Popups
    this.renderParticlesAndPopups();

    // 6. Character
    this.renderCharacter(timestamp);

    // 7. Hit flash
    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(this.hitFlash * 0.7, 0.75)})`;
      ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    }

    ctx.restore();
  }

  private renderSky(): void {
    const ctx = this.ctx;
    const [topColor, bottomColor] = this.currentLevel.theme.skyGradient;
    const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    grad.addColorStop(0, topColor);
    grad.addColorStop(1, bottomColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
  }

  private renderAtmosphere(timestamp: number): void {
    const ctx = this.ctx;
    const theme = this.currentLevel.theme;

    // Stars
    if (theme.stars && this.stars.length > 0) {
      for (const s of this.stars) {
        const pulse = Math.sin(timestamp * 0.003 * s.twinkleSpeed);
        const a = Math.max(0.2, s.alpha + pulse * 0.25);
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Sun / Celestial Body
    if (theme.sunColor && theme.sunPosition) {
      const { x, y, r } = theme.sunPosition;
      const cx = this.logicalWidth * x;
      const cy = this.groundY * y;

      // Glow
      const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.8);
      glow.addColorStop(0, theme.sunColor);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = theme.sunColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Retro Grid (Levels 5, 7, 10)
    if (theme.retroGrid) {
      ctx.strokeStyle = theme.groundTrimColor;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.25;

      const horizonY = this.groundY * 0.78;
      // Horizontal lines with perspective spacing
      for (let y = horizonY; y < this.groundY; y += 14) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.logicalWidth, y);
        ctx.stroke();
      }
      // Vanishing lines
      const vanishingX = this.logicalWidth * 0.5;
      for (let x = -this.logicalWidth * 0.5; x <= this.logicalWidth * 1.5; x += 36) {
        ctx.beginPath();
        ctx.moveTo(vanishingX, horizonY);
        ctx.lineTo(x, this.groundY);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
    }

    // Distant drifting pixel clouds
    this.renderClouds();
  }

  private renderClouds(): void {
    const ctx = this.ctx;
    const theme = this.currentLevel.theme;
    ctx.fillStyle = theme.cloudColor;
    ctx.globalAlpha = theme.cloudAlpha;

    const clouds = [
      { x: (100 - this.cloudScroll) % this.logicalWidth, y: 70, scale: 1 },
      { x: (320 - this.cloudScroll) % this.logicalWidth, y: 140, scale: 0.8 },
      { x: (500 - this.cloudScroll) % this.logicalWidth, y: 95, scale: 1.2 },
    ];

    for (const c of clouds) {
      let drawX = c.x;
      if (drawX < -120) drawX += this.logicalWidth + 120;

      // Draw stylized 3-puff cloud
      const r = 24 * c.scale;
      ctx.beginPath();
      ctx.arc(drawX, c.y, r, 0, Math.PI * 2);
      ctx.arc(drawX + r * 0.9, c.y - r * 0.35, r * 1.2, 0, Math.PI * 2);
      ctx.arc(drawX + r * 1.8, c.y, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }

  private renderPipes(): void {
    const ctx = this.ctx;
    const theme = this.currentLevel.theme;

    for (const p of this.pipes) {
      const lipHeight = 24;
      const lipOverhang = 5;

      // --- Top Pipe ---
      // Main shaft
      ctx.fillStyle = theme.pipeColor;
      ctx.fillRect(p.x, 0, p.width, p.topHeight - lipHeight);
      // Highlight stripe
      ctx.fillStyle = theme.pipeHighlight;
      ctx.fillRect(p.x + 6, 0, 8, p.topHeight - lipHeight);
      // Shadow stripe
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(p.x + p.width - 12, 0, 12, p.topHeight - lipHeight);
      // Top pipe lip
      ctx.fillStyle = theme.pipeLipColor;
      ctx.fillRect(p.x - lipOverhang, p.topHeight - lipHeight, p.width + lipOverhang * 2, lipHeight);
      ctx.fillStyle = theme.pipeHighlight;
      ctx.fillRect(p.x - lipOverhang + 6, p.topHeight - lipHeight, 8, lipHeight);
      // Border outline
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(p.x, -2, p.width, p.topHeight - lipHeight + 2);
      ctx.strokeRect(p.x - lipOverhang, p.topHeight - lipHeight, p.width + lipOverhang * 2, lipHeight);

      // --- Bottom Pipe ---
      const bottomY = p.topHeight + p.gap;
      const bottomHeight = this.groundY - bottomY;

      // Bottom lip
      ctx.fillStyle = theme.pipeLipColor;
      ctx.fillRect(p.x - lipOverhang, bottomY, p.width + lipOverhang * 2, lipHeight);
      ctx.fillStyle = theme.pipeHighlight;
      ctx.fillRect(p.x - lipOverhang + 6, bottomY, 8, lipHeight);
      // Main shaft
      ctx.fillStyle = theme.pipeColor;
      ctx.fillRect(p.x, bottomY + lipHeight, p.width, bottomHeight - lipHeight);
      // Highlight stripe
      ctx.fillStyle = theme.pipeHighlight;
      ctx.fillRect(p.x + 6, bottomY + lipHeight, 8, bottomHeight - lipHeight);
      // Shadow stripe
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(p.x + p.width - 12, bottomY + lipHeight, 12, bottomHeight - lipHeight);
      // Border outline
      ctx.strokeStyle = '#050505';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(p.x - lipOverhang, bottomY, p.width + lipOverhang * 2, lipHeight);
      ctx.strokeRect(p.x, bottomY + lipHeight, p.width, bottomHeight - lipHeight + 2);
    }
  }

  private renderGround(): void {
    const ctx = this.ctx;
    const theme = this.currentLevel.theme;

    // Ground base soil
    ctx.fillStyle = theme.groundColor;
    ctx.fillRect(0, this.groundY, this.logicalWidth, this.groundHeight);

    // Turf rim (top bar)
    ctx.fillStyle = theme.groundTrimColor;
    ctx.fillRect(0, this.groundY, this.logicalWidth, 14);

    // Black separation line
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(this.logicalWidth, this.groundY);
    ctx.stroke();

    // Moving retro diagonal stripes
    ctx.fillStyle = theme.groundStripeColor;
    for (let x = -30 - this.groundScroll; x < this.logicalWidth + 30; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, this.groundY + 14);
      ctx.lineTo(x + 10, this.groundY + 14);
      ctx.lineTo(x - 2, this.groundY + 28);
      ctx.lineTo(x - 12, this.groundY + 28);
      ctx.closePath();
      ctx.fill();
    }
  }

  private renderCharacter(timestamp: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.birdX, this.birdY);
    ctx.rotate(this.birdRotation);
    ctx.scale(this.squashX, this.squashY);

    if (this.customImgLoaded && this.customImg) {
      this.renderCustomCharacterImage();
    } else {
      this.renderProceduralBird(timestamp);
    }

    ctx.restore();
  }

  /**
   * Renders user uploaded custom character with clean circular clip and border.
   */
  private renderCustomCharacterImage(): void {
    if (!this.customImg) return;
    const ctx = this.ctx;
    const r = this.birdRadius + 2;

    // Glowing rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();

    // Clip to circle
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();

    // Draw image maintaining aspect ratio
    const img = this.customImg;
    const aspect = img.width / img.height;
    let dw = r * 2;
    let dh = r * 2;
    if (aspect > 1) {
      dw = r * 2 * aspect;
    } else {
      dh = (r * 2) / aspect;
    }
    ctx.drawImage(img, -dw * 0.5, -dh * 0.5, dw, dh);
    ctx.restore();

    // Outline
    ctx.beginPath();
    ctx.arc(0, 0, r + 1, 0, Math.PI * 2);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  /**
   * Procedural retro pixel-inspired mascot bird for Nigul Bird.
   */
  private renderProceduralBird(timestamp: number): void {
    const ctx = this.ctx;
    const isFlapping = performance.now() - this.flapTime < 180;
    const wingAngle = isFlapping ? -0.7 : Math.sin(timestamp * 0.015) * 0.4;

    // Body shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (Warm golden bird)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly (Cream yellow)
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(-2, 3, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cheek blush
    ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.beginPath();
    ctx.arc(6, 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Big expressive eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8, -4, 6, 0, Math.PI * 2);
    ctx.fill();

    // Pupil looking forward/slightly up
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(10, -4, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Eye glint
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(11, -5.5, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Orange Beak
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(13, -2);
    ctx.lineTo(24, 1);
    ctx.lineTo(13, 5);
    ctx.closePath();
    ctx.fill();

    // Beak line
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(13, 1.5);
    ctx.lineTo(21, 1.5);
    ctx.stroke();

    // Wing
    ctx.save();
    ctx.translate(-4, 1);
    ctx.rotate(wingAngle);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Outer retro contour
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  private renderParticlesAndPopups(): void {
    const ctx = this.ctx;

    // Particles
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Popups
    ctx.font = 'bold 16px "Press Start 2P", monospace';
    for (const pop of this.popups) {
      ctx.globalAlpha = Math.max(0, pop.alpha);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(pop.text, pop.x + 2, pop.y + 2); // shadow
      ctx.fillStyle = '#fde047';
      ctx.fillText(pop.text, pop.x, pop.y);
    }
    ctx.globalAlpha = 1.0;
  }
}
