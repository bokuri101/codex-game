/*// ====== 利用 Web Audio API 凭空生成 8-bit 复古游戏音效 ======
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  // 确保音频上下文在用户交互后处于激活状态
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === 'flap') {
    // 振翅音效：频率在 0.1 秒内快速从 150Hz 升到 400Hz，然后消失
    osc.type = 'triangle'; // 三角波，声音比较闷，适合翅膀扑腾
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    
    gain.gain.setValueAtTime(0.3, now); // 音量
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.start(now);
    osc.stop(now + 0.1);
  } 
  else if (type === 'score') {
    // 得分音效：经典的马里奥吃金币“叮咚”双音节
    osc.type = 'sine'; // 正弦波，清脆的水晶音
    // 第一个音节
    osc.frequency.setValueAtTime(523.25, now); // C5 音符
    gain.gain.setValueAtTime(0.2, now);
    // 第二个音节（0.08秒后变高音）
    osc.frequency.setValueAtTime(880, now + 0.08); // A5 音符
    gain.gain.setValueAtTime(0.2, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    osc.start(now);
    osc.stop(now + 0.35);
  } 
  else if (type === 'hit') {
    // 撞击死亡音效：频率在 0.4 秒内从 300Hz 坠落到 40Hz 的悲惨下坠音
    osc.type = 'sawtooth'; // 锯齿波，带有点沙哑和破坏感
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.4);
    
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    osc.start(now);
    osc.stop(now + 0.4);
  }
}*/
// ====== 音效系统 ======
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  if (audioCtx.state === 'suspended') { audioCtx.resume(); }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  if (type === 'flap') {
    osc.type = 'triangle'; osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now); osc.stop(now + 0.1);
  } else if (type === 'score') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, now); gain.gain.setValueAtTime(0.2, now);
    osc.frequency.setValueAtTime(880, now + 0.08); gain.gain.setValueAtTime(0.2, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.start(now); osc.stop(now + 0.35);
  } else if (type === 'hit') {
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now); osc.frequency.linearRampToValueAtTime(40, now + 0.4);
    gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc.start(now); osc.stop(now + 0.4);
  } else if (type === 'tick') {
    osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05); osc.start(now); osc.stop(now + 0.05);
  } else if (type === 'win') {
    osc.type = 'triangle'; osc.frequency.setValueAtTime(392, now); osc.frequency.setValueAtTime(523.25, now + 0.08);
    osc.frequency.setValueAtTime(659.25, now + 0.16); osc.frequency.setValueAtTime(783.99, now + 0.24);
    gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.start(now); osc.stop(now + 0.5);
  }
}

// ====== 答题控制变量 ======
const quizOverlay = document.querySelector("#quizOverlay");
const quizQuestion = document.querySelector("#quizQuestion");
const quizOptions = document.querySelector("#quizOptions");
const quizTimerEl = document.querySelector("#quizTimer");
const quizTitleEl = document.querySelector("#quizTitle");
let quizTimerId = null; 
let timeLeft = 6;       
let hasRevived = false;
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
  hasRevived = false;
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
  if (!hasRevived) {
    showQuiz(); // 没复活过，拦截死亡弹出答题
  } else {
    triggerRealGameOver(); // 复活过了，彻底死亡
  }
}

function triggerRealGameOver() {
  state = "over";
  best = Math.max(best, score);
  localStorage.setItem("skyLarkBest", String(best));
  bestEl.textContent = best;
  messageEl.textContent = `答错或超时啦！最终得分 ${score}，按空格或点击再飞一次`;
  startButton.textContent = "再来一局";
  overlay.classList.remove("hidden");
  burst(bird.x, bird.y);
  playSound('hit'); 
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
  playSound('flap');
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
      playSound('score');
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
/*
particles = particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.05,
      life: p.life - 1,
    }))
    .filter((p) => p.life > 0);
    */
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

/*
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
*/

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
// ====== 历史题库 ======
const quizBank = [
  { q: "中国历史上第一个统一的封建王朝是哪一个？", a: ["夏朝", "商朝", "秦朝", "汉朝"], right: 2 },
  { q: "“贞观之治”是指中国历史上哪位皇帝在位期间的清明政治？", a: ["唐太宗 李世民", "唐高祖 李渊", "汉武帝 刘彻", "宋太祖 赵胤"], right: 0 },
  { q: "世界上现存规模最大、保存最完整的古代木结构宫殿建筑群是什么？", a: ["凡尔赛宫", "北京故宫", "托普卡帕宫", "帕特农神庙"], right: 1 },
  { q: "西方文明的发源地，并诞生了著名希腊神话的是哪个古代国家？", a: ["古埃及", "古巴比伦", "古罗马", "古希腊"], right: 3 },
  { q: "中国古代著名的“丝绸之路”是在哪个朝代被正式开辟的？", a: ["秦朝", "汉朝", "唐朝", "明朝"], right: 1 },
  { q: "被誉为“世界古代七大奇迹”之一、位于埃及的宏伟建筑是什么？", a: ["空中花园", "胡夫金字塔", "泰姬陵", "巨石阵"], right: 1 }
];

// 答对时的彩色烟花效果
function createFireworks() {
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 2;
    particles.push({
      x: W / 2 + (Math.random() * 60 - 30),
      y: H / 3 + (Math.random() * 60 - 30),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: Math.random() * 40 + 30,
      color: `hsl(${Math.random() * 360}, 100%, 70%)`
    });
  }
}

// 弹出答题窗口与6秒倒计时
function showQuiz() {
  state = "paused"; 
  timeLeft = 6; 
  quizTimerEl.textContent = timeLeft;
  quizTimerEl.style.color = "#ff4a4a";
  quizTimerEl.style.borderColor = "#ff4a4a";
  quizTitleEl.textContent = "- 灵魂拷问 -";
  quizTitleEl.style.color = "#ff7878";
  quizTitleEl.className = ""; 

  const randomQuiz = quizBank[Math.floor(Math.random() * quizBank.length)];
  quizQuestion.textContent = randomQuiz.q;
  quizOptions.innerHTML = ""; 

  randomQuiz.a.forEach((optionText, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = optionText;
    btn.style.background = "#ffffff";
    btn.style.color = "#12263f";
    btn.style.boxShadow = "0 4px 0 #b1b1b1";
    
    btn.addEventListener("click", () => {
      clearInterval(quizTimerId); 
      if (index === randomQuiz.right) {
        handleReviveSuccess(); 
      } else {
        handleReviveFail(); 
      }
    });
    quizOptions.appendChild(btn);
  });

  quizOverlay.classList.remove("hidden"); 

  clearInterval(quizTimerId);
  quizTimerId = setInterval(() => {
    timeLeft--;
    quizTimerEl.textContent = timeLeft;
    if (timeLeft > 0) {
      playSound('tick'); 
    } else {
      clearInterval(quizTimerId);
      handleReviveFail();
    }
  }, 1000);
}

// 答对的处理：放烟花，出提示
function handleReviveSuccess() {
  playSound('win'); 
  quizOptions.innerHTML = "";
  quizTitleEl.textContent = "🎉 答对啦！🎉";
  quizTitleEl.style.color = "#a1ff78";
  quizTitleEl.classList.add("pop-effect");
  quizTimerEl.textContent = "✔";
  quizTimerEl.style.color = "#a1ff78";
  quizTimerEl.style.borderColor = "#a1ff78";

  createFireworks();

  setTimeout(() => {
    quizOverlay.classList.add("hidden");
    hasRevived = true; 
    state = "playing";
    bird.y = Math.max(80, bird.y - 60);
    bird.vy = -6; 
    pipes = pipes.filter(p => p.x < bird.x - bird.r || p.x > bird.x + W/2);
  }, 1500);
}

function handleReviveFail() {
  clearInterval(quizTimerId);
  quizOverlay.classList.add("hidden");
  triggerRealGameOver();
}

// 魔改原本的粒子绘制函数以支持彩色烟花渲染
// 在代码里找到原有的 drawParticles() 函数，用下面这段覆盖它
function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 40);
    ctx.fillStyle = p.color || "#fff1a0"; // 支持烟花彩色
    ctx.beginPath();
    if (p.vx !== undefined) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.1; 
    }
    ctx.arc(p.x, p.y, p.vx !== undefined ? 4 : 3.2, 0, Math.PI * 2);
    ctx.fill();
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);
  ctx.globalAlpha = 1;
}
reset();
draw();
requestAnimationFrame(loop);
