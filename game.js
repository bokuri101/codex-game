const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const overlay = document.querySelector("#overlay");
const messageEl = document.querySelector("#message");
const startButton = document.querySelector("#startButton");
const pauseButton = document.querySelector("#pauseButton");
const restartButton = document.querySelector("#restartButton");

const W = canvas.width;
const H = canvas.height;
const groundHeight = 92;
const bird = {
  x: 116,
  y: H * 0.44,
  r: 18,
  vy: 0,
  wing: 0,
};

let pipes = [];
let clouds = [];
let stars = [];
let particles = [];
let score = 0;
let best = Number(localStorage.getItem("skyLarkBest") || 0);
let frame = 0;
let lastTime = 0;
let state = "ready";
let speed = 2.35;

bestEl.textContent = best;

function reset() {
  bird.y = H * 0.44;
  bird.vy = 0;
  bird.wing = 0;
  pipes = [];
  particles = [];
  score = 0;
  frame = 0;
  speed = 2.35;
  scoreEl.textContent = "0";
  makeClouds();
  makeStars();
  addPipe();
}

function makeClouds() {
  clouds = Array.from({ length: 7 }, (_, i) => ({
    x: (i * 86 + Math.random() * 70) % W,
    y: 42 + Math.random() * 220,
    s: 0.7 + Math.random() * 1.25,
  }));
}

function makeStars() {
  stars = Array.from({ length: 38 }, () => ({
    x: Math.random() * W,
    y: Math.random() * (H - groundHeight),
    a: 0.18 + Math.random() * 0.28,
  }));
}

function addPipe() {
  const gap = Math.max(136, 180 - score * 1.7);
  const topMin = 54;
  const topMax = H - groundHeight - gap - 80;
  const top = topMin + Math.random() * Math.max(1, topMax - topMin);
  pipes.push({
    x: W + 24,
    w: 72,
    top,
    gap,
    scored: false,
  });
}

function start() {
  reset();
  state = "playing";
  bird.vy = -7.2;
  bird.wing = 1;
  overlay.classList.add("hidden");
  pauseButton.textContent = "暂停";
}

function gameOver() {
  state = "over";
  best = Math.max(best, score);
  localStorage.setItem("skyLarkBest", String(best));
  bestEl.textContent = best;
  messageEl.textContent = `得分 ${score}，按空格或点击再飞一次`;
  startButton.textContent = "再来一局";
  overlay.classList.remove("hidden");
  burst(bird.x, bird.y);
}

function flap() {
  if (state === "ready" || state === "over") {
    start();
    return;
  }
  if (state === "paused") {
    state = "playing";
    overlay.classList.add("hidden");
    pauseButton.textContent = "暂停";
    return;
  }
  bird.vy = -7.6;
  bird.wing = 1;
  particles.push({
    x: bird.x - 15,
    y: bird.y + 8,
    life: 16,
    vx: -1.8,
    vy: 1.4,
  });
}

function togglePause() {
  if (state === "playing") {
    state = "paused";
    messageEl.textContent = "已暂停，按空格或点击继续";
    startButton.textContent = "继续";
    overlay.classList.remove("hidden");
    pauseButton.textContent = "继续";
  } else if (state === "paused") {
    state = "playing";
    overlay.classList.add("hidden");
    pauseButton.textContent = "暂停";
  }
}

function burst(x, y) {
  for (let i = 0; i < 18; i += 1) {
    const angle = (Math.PI * 2 * i) / 18;
    particles.push({
      x,
      y,
      life: 34,
      vx: Math.cos(angle) * (1.4 + Math.random() * 2),
      vy: Math.sin(angle) * (1.4 + Math.random() * 2),
    });
  }
}

function update() {
  if (state !== "playing") {
    updateParticles();
    return;
  }

  frame += 1;
  speed = Math.min(4.2, 2.35 + score * 0.035);
  bird.vy += 0.42;
  bird.vy = Math.min(bird.vy, 9.2);
  bird.y += bird.vy;
  bird.wing *= 0.82;

  for (const cloud of clouds) {
    cloud.x -= 0.18 * cloud.s;
    if (cloud.x < -90) cloud.x = W + 90;
  }

  if (frame % Math.max(78, 114 - Math.floor(score * 0.8)) === 0) {
    addPipe();
  }

  for (const pipe of pipes) {
    pipe.x -= speed;
    if (!pipe.scored && pipe.x + pipe.w < bird.x - bird.r) {
      pipe.scored = true;
      score += 1;
      scoreEl.textContent = score;
      burst(bird.x, bird.y - 12);
    }
  }

  pipes = pipes.filter((pipe) => pipe.x + pipe.w > -20);
  updateParticles();

  if (bird.y - bird.r < 0 || bird.y + bird.r > H - groundHeight) {
    gameOver();
    return;
  }

  for (const pipe of pipes) {
    const nearX = bird.x + bird.r > pipe.x && bird.x - bird.r < pipe.x + pipe.w;
    const inGap = bird.y - bird.r > pipe.top && bird.y + bird.r < pipe.top + pipe.gap;
    if (nearX && !inGap) {
      gameOver();
      return;
    }
  }
}

function updateParticles() {
  particles = particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.05,
      life: p.life - 1,
    }))
    .filter((p) => p.life > 0);
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#72d2f2");
  sky.addColorStop(0.58, "#9fe2d5");
  sky.addColorStop(1, "#f5cc73");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.42)";
  for (const star of stars) {
    ctx.globalAlpha = star.a + Math.sin((frame + star.x) * 0.02) * 0.08;
    ctx.fillRect(star.x, star.y, 2, 2);
  }
  ctx.globalAlpha = 1;

  for (const cloud of clouds) {
    drawCloud(cloud.x, cloud.y, cloud.s);
  }

  ctx.fillStyle = "#68b85f";
  ctx.fillRect(0, H - groundHeight, W, groundHeight);
  ctx.fillStyle = "#7bd067";
  for (let x = -((frame * speed) % 34); x < W; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, H - groundHeight);
    ctx.lineTo(x + 20, H - groundHeight);
    ctx.lineTo(x + 8, H - groundHeight + 20);
    ctx.fill();
  }
  ctx.fillStyle = "#be8d55";
  ctx.fillRect(0, H - groundHeight + 24, W, groundHeight - 24);
}

function drawCloud(x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.beginPath();
  ctx.arc(0, 16, 18, 0, Math.PI * 2);
  ctx.arc(22, 8, 24, 0, Math.PI * 2);
  ctx.arc(50, 17, 18, 0, Math.PI * 2);
  ctx.rect(0, 16, 52, 20);
  ctx.fill();
  ctx.restore();
}

function drawPipes() {
  for (const pipe of pipes) {
    drawPipe(pipe.x, 0, pipe.w, pipe.top, true);
    drawPipe(pipe.x, pipe.top + pipe.gap, pipe.w, H - groundHeight - pipe.top - pipe.gap, false);
  }
}

function drawPipe(x, y, w, h, flip) {
  const capH = 28;
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, "#177f58");
  grad.addColorStop(0.5, "#40ca75");
  grad.addColorStop(1, "#106243");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x + 12, y + 8, 9, Math.max(0, h - 16));
  ctx.fillStyle = "#116947";
  if (flip) {
    ctx.fillRect(x - 8, y + h - capH, w + 16, capH);
  } else {
    ctx.fillRect(x - 8, y, w + 16, capH);
  }
}

function drawBird() {
  const tilt = Math.max(-0.48, Math.min(0.72, bird.vy * 0.08));
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(tilt);
  ctx.imageSmoothingEnabled = false;
  drawAvatarSprite(-31, -36, 2);

  ctx.restore();
}

function drawAvatarSprite(x, y, p) {
  const px = (color, gx, gy, gw = 1, gh = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + gx * p, y + gy * p, gw * p, gh * p);
  };
  const outline = "#ffffff";
  const ink = "#050607";
  const hair = "#3a2618";
  const hairHi = "#6b4a2e";
  const skin = "#f1aa70";
  const skinDark = "#c8784d";
  const blush = "#d86972";
  const jacket = "#5b594f";
  const shirt = "#15171b";
  const pants = "#2a3942";
  const wing = bird.wing > 0.18 ? 1 : 0;

  px(outline, 5, 1, 17, 2);
  px(outline, 2, 3, 23, 2);
  px(outline, 0, 5, 28, 10);
  px(outline, 1, 15, 27, 9);
  px(outline, 3, 24, 21, 8);
  px(outline, 7, 32, 10, 3);
  px(outline, -5, 17 + wing, 9, 8);

  px(ink, 6, 2, 14, 2);
  px(ink, 3, 4, 22, 3);
  px(ink, 2, 7, 25, 8);
  px(ink, 4, 15, 22, 8);
  px(ink, 6, 23, 16, 8);
  px(ink, 8, 31, 8, 2);
  px(ink, -4, 18 + wing, 9, 6);

  px(hair, 5, 4, 5, 3);
  px(hair, 10, 3, 8, 4);
  px(hair, 18, 5, 5, 5);
  px(hairHi, 7, 5, 3, 2);
  px(hairHi, 13, 5, 2, 3);
  px(hairHi, 18, 7, 2, 2);
  px(hair, 3, 8, 4, 8);
  px(hair, 7, 7, 4, 6);
  px(hair, 12, 7, 3, 5);
  px(hair, 22, 9, 4, 6);

  px(skin, 8, 11, 13, 12);
  px(skin, 6, 15, 4, 6);
  px(skin, 19, 12, 5, 9);
  px(skinDark, 6, 17, 2, 4);
  px(skinDark, 19, 18, 5, 2);
  px("#ffd0a1", 11, 20, 2, 2);
  px(blush, 21, 18, 3, 3);

  px(ink, 10, 12, 6, 2);
  px(ink, 19, 12, 5, 2);
  px("#ffffff", 12, 15, 3, 2);
  px("#ffffff", 20, 15, 2, 2);
  px(ink, 13, 14, 3, 3);
  px(ink, 20, 14, 3, 3);
  px("#7d5138", 17, 15, 2, 5);
  px("#9f5d43", 20, 20, 3, 1);

  px(jacket, 5, 24, 5, 6);
  px(jacket, 18, 23, 5, 7);
  px(shirt, 10, 23, 8, 8);
  px(skin, 9, 23, 4, 2);
  px(pants, 7, 30, 6, 3);
  px(pants, 15, 30, 5, 3);
  px("#2b211c", 6, 33, 6, 2);
  px("#2b211c", 17, 33, 4, 2);

  px("#d8eff2", -3, 19 + wing, 6, 2);
  px("#b9ced2", -4, 21 + wing, 7, 2);
  px("#e9fbff", -2, 23 + wing, 5, 2);
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 34);
    ctx.fillStyle = "#fff1a0";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawReadyHint() {
  if (state !== "ready") return;
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = "#17334b";
  ctx.font = "700 18px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("避开绿管，飞得越远越好", W / 2, H - groundHeight - 34);
  ctx.restore();
}

function draw() {
  drawBackground();
  drawPipes();
  drawParticles();
  drawBird();
  drawReadyHint();
}

function loop(time) {
  if (time - lastTime > 1000 / 60) {
    update();
    draw();
    lastTime = time;
  }
  requestAnimationFrame(loop);
}

startButton.addEventListener("click", flap);
restartButton.addEventListener("click", start);
pauseButton.addEventListener("click", togglePause);
canvas.addEventListener("pointerdown", flap);
window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    flap();
  }
  if (event.code === "KeyP") togglePause();
});

reset();
draw();
requestAnimationFrame(loop);
