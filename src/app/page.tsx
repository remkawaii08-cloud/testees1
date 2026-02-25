"use client";

import sdk from "@farcaster/miniapp-sdk";
import { useEffect, useRef, useState, useCallback } from "react";

// ── Game constants ─────────────────────────────────────────────────────────────
const W = 390;
const H = 680;
const GRAVITY = 0.45;
const FLAP_FORCE = -9;
const PIPE_WIDTH = 68;
const PIPE_GAP = 155;
const PIPE_SPEED_INIT = 2.4;
const PIPE_INTERVAL = 1700; // ms
const BIRD_X = 90;
const BIRD_R = 18;
const GROUND_H = 80;
const SKY_H = H - GROUND_H;

type GameState = "idle" | "playing" | "dead";

interface Pipe {
  x: number;
  topH: number;
  scored: boolean;
}

// ── Rendering helpers ──────────────────────────────────────────────────────────
function drawSky(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, SKY_H);
  grad.addColorStop(0, "#78c5f5");
  grad.addColorStop(1, "#c8e8ff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, SKY_H);
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.arc(x, y, 20 * s, 0, Math.PI * 2);
  ctx.arc(x + 22 * s, y - 6 * s, 16 * s, 0, Math.PI * 2);
  ctx.arc(x + 40 * s, y, 18 * s, 0, Math.PI * 2);
  ctx.arc(x + 18 * s, y + 6 * s, 14 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround(ctx: CanvasRenderingContext2D, offset: number) {
  // dirt
  ctx.fillStyle = "#d4a44c";
  ctx.fillRect(0, SKY_H, W, GROUND_H);

  // grass strip
  ctx.fillStyle = "#5db640";
  ctx.fillRect(0, SKY_H, W, 18);

  // grass blades tiling
  ctx.fillStyle = "#4aaa2e";
  for (let gx = (-offset % 20); gx < W + 20; gx += 20) {
    ctx.fillRect(gx, SKY_H, 10, 18);
  }

  // dirt stripes
  ctx.fillStyle = "#b8893a";
  for (let gx = (-offset % 50); gx < W + 50; gx += 50) {
    ctx.fillRect(gx, SKY_H + 28, 30, 6);
  }
}

function drawPipe(ctx: CanvasRenderingContext2D, pipe: Pipe) {
  const cx = pipe.x + PIPE_WIDTH / 2;

  // Body gradient
  const grad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
  grad.addColorStop(0, "#2a8a2a");
  grad.addColorStop(0.35, "#5ed15e");
  grad.addColorStop(0.65, "#38b038");
  grad.addColorStop(1, "#1a6a1a");

  // Top pipe (hanging from top)
  const topY = 0;
  ctx.fillStyle = grad;
  ctx.fillRect(pipe.x, topY, PIPE_WIDTH, pipe.topH);

  // Top cap
  ctx.fillStyle = "#1a6a1a";
  ctx.fillRect(pipe.x - 5, pipe.topH - 22, PIPE_WIDTH + 10, 22);

  // Bottom pipe
  const botY = pipe.topH + PIPE_GAP;
  const botH = SKY_H - botY;
  ctx.fillStyle = grad;
  ctx.fillRect(pipe.x, botY, PIPE_WIDTH, botH);

  // Bottom cap
  ctx.fillStyle = "#1a6a1a";
  ctx.fillRect(pipe.x - 5, botY, PIPE_WIDTH + 10, 22);

  // Shine highlight
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(pipe.x + 8, topY, 10, pipe.topH);
  ctx.fillRect(pipe.x + 8, botY + 22, 10, botH - 22);

  // Darker center line for depth
  ctx.strokeStyle = "#1a6a1a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(cx, pipe.topH - 22);
  ctx.moveTo(cx, botY + 22);
  ctx.lineTo(cx, botY + botH);
  ctx.stroke();
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  y: number,
  vy: number,
  wingPhase: number
) {
  const angle = Math.min(Math.max(vy * 0.065, -0.45), 1.1);
  ctx.save();
  ctx.translate(BIRD_X, y);
  ctx.rotate(angle);

  // Shadow
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.scale(1, 0.4);
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(0, BIRD_R + 10, BIRD_R + 2, BIRD_R, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Body
  const bg = ctx.createRadialGradient(-4, -4, 2, 0, 0, BIRD_R);
  bg.addColorStop(0, "#ffe96a");
  bg.addColorStop(0.55, "#ffd12b");
  bg.addColorStop(1, "#c98e00");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
  ctx.fill();

  // Wing (animated)
  const wingAngle = Math.sin(wingPhase) * 0.5;
  ctx.save();
  ctx.translate(-5, 2);
  ctx.rotate(wingAngle);
  ctx.fillStyle = "#f5b800";
  ctx.beginPath();
  ctx.ellipse(-6, 0, 12, 7, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Eye white
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(8, -6, 7, 0, Math.PI * 2);
  ctx.fill();

  // Eye pupil
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(10, -6, 4, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(11.5, -7.5, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = "#ff8c00";
  ctx.beginPath();
  ctx.moveTo(14, -2);
  ctx.lineTo(23, 1);
  ctx.lineTo(14, 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    gameState: "idle" as GameState,
    birdY: H / 2 - GROUND_H / 2,
    birdVY: 0,
    pipes: [] as Pipe[],
    score: 0,
    best: 0,
    groundOffset: 0,
    wingPhase: 0,
    cloudX: [60, 200, 320] as number[],
    cloudY: [80, 50, 130] as number[],
    cloudS: [1, 0.7, 0.85] as number[],
    pipeSpeed: PIPE_SPEED_INIT,
    lastPipeTime: 0,
    animId: 0,
    lastTime: 0,
    deathFrame: 0,
  });
  const [displayScore, setDisplayScore] = useState(0);
  const [displayBest, setDisplayBest] = useState(0);
  const [gameState, setGameState] = useState<GameState>("idle");

  // SDK init
  useEffect(() => {
    sdk.actions.ready();
    const storedBest = parseInt(localStorage.getItem("flappy_best") ?? "0", 10);
    stateRef.current.best = storedBest;
    setDisplayBest(storedBest);
  }, []);

  const resetGame = useCallback(() => {
    const s = stateRef.current;
    s.birdY = SKY_H / 2;
    s.birdVY = 0;
    s.pipes = [];
    s.score = 0;
    s.groundOffset = 0;
    s.wingPhase = 0;
    s.pipeSpeed = PIPE_SPEED_INIT;
    s.lastPipeTime = 0;
    s.deathFrame = 0;
    setDisplayScore(0);
  }, []);

  const flap = useCallback(() => {
    const s = stateRef.current;
    if (s.gameState === "idle") {
      s.gameState = "playing";
      setGameState("playing");
      s.birdVY = FLAP_FORCE;
      s.lastPipeTime = performance.now();
    } else if (s.gameState === "playing") {
      s.birdVY = FLAP_FORCE;
    } else if (s.gameState === "dead") {
      resetGame();
      s.gameState = "idle";
      setGameState("idle");
    }
  }, [resetGame]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flap]);

  // Main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function spawnPipe(now: number) {
      const s = stateRef.current;
      if (s.gameState !== "playing") return;
      if (now - s.lastPipeTime < PIPE_INTERVAL) return;
      s.lastPipeTime = now;
      const minH = 60;
      const maxH = SKY_H - PIPE_GAP - 60;
      const topH = minH + Math.random() * (maxH - minH);
      s.pipes.push({ x: W + 10, topH, scored: false });
    }

    function checkCollision() {
      const s = stateRef.current;
      const bx = BIRD_X;
      const by = s.birdY;
      const r = BIRD_R - 3; // slightly smaller hitbox

      if (by + r >= SKY_H || by - r <= 0) return true;

      for (const pipe of s.pipes) {
        const px = pipe.x;
        const pw = PIPE_WIDTH;
        const nearX = Math.max(px, Math.min(bx, px + pw));
        const nearTopY = Math.min(by, pipe.topH);
        const nearBotY = Math.max(by, pipe.topH + PIPE_GAP);

        const dxTop = bx - nearX;
        const dyTop = by - nearTopY;
        const dxBot = bx - nearX;
        const dyBot = by - nearBotY;

        if (
          bx + r > px && bx - r < px + pw &&
          (by - r < pipe.topH || by + r > pipe.topH + PIPE_GAP)
        ) return true;

        void dxTop; void dyTop; void dxBot; void dyBot; // suppress unused vars
      }
      return false;
    }

    function loop(now: number) {
      const s = stateRef.current;
      const dt = Math.min((now - (s.lastTime || now)) / 16.67, 3); // normalized to ~60fps
      s.lastTime = now;

      ctx.clearRect(0, 0, W, H);
      drawSky(ctx);

      // Clouds
      for (let i = 0; i < s.cloudX.length; i++) {
        drawCloud(ctx, s.cloudX[i], s.cloudY[i], s.cloudS[i]);
        if (s.gameState === "playing") {
          s.cloudX[i] -= 0.4 * dt;
          if (s.cloudX[i] < -80) {
            s.cloudX[i] = W + 80;
            s.cloudY[i] = 40 + Math.random() * 120;
          }
        }
      }

      // Pipes
      if (s.gameState === "playing") {
        spawnPipe(now);
        for (const pipe of s.pipes) {
          pipe.x -= s.pipeSpeed * dt;
          if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD_X) {
            pipe.scored = true;
            s.score++;
            s.pipeSpeed = PIPE_SPEED_INIT + s.score * 0.06;
            setDisplayScore(s.score);
            if (s.score > s.best) {
              s.best = s.score;
              setDisplayBest(s.best);
              localStorage.setItem("flappy_best", String(s.best));
            }
          }
        }
        s.pipes = s.pipes.filter((p) => p.x + PIPE_WIDTH > -10);
      }
      s.pipes.forEach((p) => drawPipe(ctx, p));

      // Bird physics
      if (s.gameState === "playing") {
        s.birdVY += GRAVITY * dt;
        s.birdY += s.birdVY * dt;
        s.wingPhase += 0.25 * dt;
        s.groundOffset += s.pipeSpeed * dt;

        if (checkCollision()) {
          s.gameState = "dead";
          setGameState("dead");
          s.deathFrame = 0;
        }
      } else if (s.gameState === "idle") {
        s.birdY = SKY_H / 2 + Math.sin(now / 400) * 8;
        s.wingPhase += 0.12 * dt;
      } else if (s.gameState === "dead") {
        s.birdVY += GRAVITY * 1.5 * dt;
        s.birdY += s.birdVY * dt;
        s.deathFrame++;
        if (s.birdY > SKY_H) s.birdY = SKY_H;
      }

      drawBird(ctx, s.birdY, s.birdVY, s.wingPhase);
      drawGround(ctx, s.groundOffset);

      s.animId = requestAnimationFrame(loop);
    }

    const s = stateRef.current;
    s.animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(s.animId);
  }, []);

  return (
    <main className="game-root">
      <div className="game-wrapper">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="game-canvas"
          onClick={flap}
          onTouchStart={(e) => { e.preventDefault(); flap(); }}
        />

        {/* HUD */}
        <div className="hud-score">
          <span className="score-num">{displayScore}</span>
        </div>

        {/* Idle screen */}
        {gameState === "idle" && (
          <div className="overlay idle-overlay">
            <div className="game-title">
              <span className="title-flappy">Flappy</span>
              <span className="title-bird">Bird</span>
            </div>
            <div className="tap-hint">
              <span>Tap or Press Space to Start</span>
            </div>
            {displayBest > 0 && (
              <div className="best-badge">Best: {displayBest}</div>
            )}
          </div>
        )}

        {/* Death screen */}
        {gameState === "dead" && (
          <div className="overlay dead-overlay">
            <div className="gameover-panel">
              <h2 className="gameover-title">Game Over</h2>
              <div className="score-rows">
                <div className="score-row">
                  <span>Score</span>
                  <span className="score-val">{displayScore}</span>
                </div>
                <div className="score-row">
                  <span>Best</span>
                  <span className="score-val gold">{displayBest}</span>
                </div>
              </div>
              <button className="play-btn" onClick={flap}>
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
