// Restore the visitor's selected ABYXO theme on every page.
(() => {
  try {
    const savedTheme = localStorage.getItem("abyxo-theme");
    if (["dark", "light", "ocean"].includes(savedTheme)) {
      if (savedTheme === "dark") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", savedTheme);
    }
  } catch (_) {}
})();

const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    toggle.textContent = isOpen ? "×" : "☰";
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
      toggle.textContent = "☰";
    });
  });
}

// ABYXO's playful abyss transmissions
const signalButton = document.querySelector("#new-signal");
const signalMessage = document.querySelector("#abyxo-message");
if (signalButton && signalMessage) {
  const messages = [
    "“The ocean is big. My plans are bigger.”",
    "“Eight arms. Zero attention span.”",
    "“I came for the treasure. I stayed for the chaos.”",
    "“Too deep? Perfect.”",
    "“Stay curious. The abyss has snacks.”",
    "“Tiny crown. Monumental mischief.”",
    "“If you hear bubbles, that's probably me.”"
  ];
  let previous = 0;
  signalButton.addEventListener("click", () => {
    let next = Math.floor(Math.random() * messages.length);
    if (messages.length > 1) {
      while (next === previous) next = Math.floor(Math.random() * messages.length);
    }
    previous = next;
    signalMessage.textContent = messages[next];
    signalButton.querySelector("span").textContent = "✓";
    window.setTimeout(() => {
      const icon = signalButton.querySelector("span");
      if (icon) icon.textContent = "↻";
    }, 500);
  });
}


// ABYXO mood selector
const personalityArt = document.querySelector("#personality-art");
if (personalityArt) {
  const moods = {
    mischief: ["MOOD 001 / MISCHIEF", "Mischief mode: ACTIVATED.", "Probably plotting something. Definitely not apologizing."],
    sleepy: ["MOOD 002 / SLEEPY", "Do not disturb the deep.", "Currently buffering dreams. Try again after one thousand bubbles."],
    legendary: ["MOOD 003 / LEGENDARY", "The crown stays ON.", "A tiny creature with extremely unreasonable main-character energy."],
    chaos: ["MOOD 004 / CHAOS", "Chaos has entered the chat.", "Eight arms. Eight plans. Absolutely no supervision."]
  };
  const stamp = document.querySelector("#mood-stamp");
  const title = document.querySelector("#mood-title");
  const description = document.querySelector("#mood-description");
  document.querySelectorAll(".mood-option").forEach((button) => {
    button.addEventListener("click", () => {
      const mood = button.dataset.mood;
      if (!moods[mood]) return;
      personalityArt.dataset.mood = mood;
      stamp.textContent = moods[mood][0];
      title.textContent = moods[mood][1];
      description.textContent = moods[mood][2];
      document.querySelectorAll(".mood-option").forEach((option) => {
        const selected = option === button;
        option.classList.toggle("active", selected);
        option.setAttribute("aria-pressed", String(selected));
      });
    });
  });
}

// ABYXO Arcade — collect treasure, dodge the sea mines
(() => {
  const canvas = document.querySelector("#abyxo-game");
  const startButton = document.querySelector("#game-start");
  if (!canvas || !startButton) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const stage = canvas.parentElement;
  const mascotSprite = new Image();
  mascotSprite.src = "./mascot.svg";
  mascotSprite.addEventListener("load", () => { if (!running) drawScene(); });
  const overlay = document.querySelector("#game-overlay");
  const overlayTitle = document.querySelector("#game-overlay-title");
  const overlayCopy = document.querySelector("#game-overlay-copy");
  const levelLabel = document.querySelector("#game-level");
  const scoreLabel = document.querySelector("#game-score");
  const timeLabel = document.querySelector("#game-time");
  const bestLabel = document.querySelector("#game-best");
  const healthLabel = document.querySelector("#game-health");
  const shootButton = document.querySelector("#game-shoot");
  const fullscreenButton = document.querySelector("#game-fullscreen");
  const gameShell = document.querySelector(".minigame-shell");
  function syncFullscreenState() {
    const active = document.fullscreenElement === gameShell || gameShell.classList.contains("game-fullscreen-fallback");
    fullscreenButton.setAttribute("aria-pressed", String(active));
    fullscreenButton.innerHTML = active ? '⛶ <span>EXIT FULLSCREEN</span>' : '⛶ <span>FULLSCREEN</span>';
    fullscreenButton.setAttribute("aria-label", active ? "Exit minigame fullscreen" : "Open minigame fullscreen");
    document.body.classList.toggle("game-is-fullscreen", active);
  }
  async function toggleFullscreen() {
    const active = document.fullscreenElement === gameShell || gameShell.classList.contains("game-fullscreen-fallback");
    if (active) {
      if (document.fullscreenElement && document.exitFullscreen) {
        try { await document.exitFullscreen(); } catch (_) {}
      }
      gameShell.classList.remove("game-fullscreen-fallback");
      syncFullscreenState();
      return;
    }
    if (gameShell.requestFullscreen) {
      try {
        await gameShell.requestFullscreen();
        return;
      } catch (_) {
        // Use the fixed-position fallback when fullscreen is blocked by the browser.
      }
    }
    gameShell.classList.add("game-fullscreen-fallback");
    syncFullscreenState();
  }
  fullscreenButton.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement !== gameShell) gameShell.classList.remove("game-fullscreen-fallback");
    syncFullscreenState();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && gameShell.classList.contains("game-fullscreen-fallback")) {
      gameShell.classList.remove("game-fullscreen-fallback");
      syncFullscreenState();
    }
  });

  // Lightweight arcade sound effects generated with Web Audio (no external audio files).
  const soundButton = document.querySelector("#game-sound");
  let soundEnabled = true;
  let audioContext = null;
  try { soundEnabled = localStorage.getItem("abyxoArcadeSound") !== "off"; } catch (_) {}
  function syncSoundButton() {
    if (!soundButton) return;
    soundButton.textContent = soundEnabled ? "♫ SOUND ON" : "♫ SOUND OFF";
    soundButton.setAttribute("aria-pressed", String(soundEnabled));
    soundButton.setAttribute("aria-label", soundEnabled ? "Turn game sound off" : "Turn game sound on");
  }
  function unlockAudio() {
    if (!soundEnabled) return false;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return false;
    try {
      if (!audioContext) audioContext = new AudioContextClass();
      if (audioContext.state === "suspended") audioContext.resume();
      return true;
    } catch (_) { return false; }
  }
  function tone(frequency, duration, wave = "sine", volume = .12, endFrequency = frequency, delay = 0) {
    if (!soundEnabled || !unlockAudio()) return;
    const now = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(35, endFrequency), now + duration);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + .02);
  }
  function playSound(kind) {
    if (!soundEnabled) return;
    if (kind === "coin") {
      tone(880, .11, "sine", .10, 1320);
      tone(1320, .13, "sine", .07, 1760, .07);
    } else if (kind === "mine") {
      tone(240, .22, "triangle", .13, 90);
      tone(115, .18, "sawtooth", .035, 65, .035);
    } else if (kind === "bomb") {
      tone(105, .42, "sawtooth", .17, 38);
      tone(68, .32, "triangle", .10, 42, .04);
    } else if (kind === "level") {
      tone(523, .15, "triangle", .10, 659);
      tone(659, .16, "triangle", .10, 784, .12);
      tone(784, .24, "triangle", .10, 1047, .24);
    } else if (kind === "start") {
      tone(330, .12, "sine", .08, 494);
      tone(494, .18, "sine", .08, 659, .10);
    } else if (kind === "over") {
      tone(440, .22, "triangle", .11, 330);
      tone(330, .28, "triangle", .10, 165, .20);
    } else if (kind === "win") {
      tone(523, .16, "triangle", .11, 659);
      tone(659, .16, "triangle", .11, 784, .13);
      tone(784, .16, "triangle", .11, 1047, .26);
      tone(1047, .3, "sine", .09, 1318, .39);
    }
  }
  if (soundButton) {
    syncSoundButton();
    soundButton.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      try { localStorage.setItem("abyxoArcadeSound", soundEnabled ? "on" : "off"); } catch (_) {}
      syncSoundButton();
      if (soundEnabled) { unlockAudio(); playSound("coin"); }
    });
  }

  const W = 720, H = 420;
  const keys = { left: false, right: false };
  let player, drops, particles, score, level, health, timeLeft, running, lastFrame, spawnClock, animationId, elapsed = 0, levelClock = 0;
  let boss = null, bossShots = [], tentacleShots = [], shootClock = 0, bossClock = 0;
  let canvasScale = 1;
  let best = 0;
  try { best = Number(localStorage.getItem("abyxoArcadeBest") || 0) || 0; } catch (_) {}
  bestLabel.textContent = String(best);

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = stage.getBoundingClientRect();
    // Match the backing bitmap to device DPI and the larger fullscreen display.
    const displayScale = Math.max(1, rect.width / W, rect.height / H);
    const scale = dpr * displayScale;
    const pixelWidth = Math.round(W * scale);
    const pixelHeight = Math.round(H * scale);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    canvasScale = scale;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    drawScene();
  }

  function resetGame() {
    player = { x: W / 2, y: H - 54, width: 58, speed: 390, hit: 0 };
    drops = [];
    particles = [];
    elapsed = 0;
    levelClock = 0;
    score = 0;
    level = 1;
    boss = null;
    if (shootButton) shootButton.hidden = true;
    bossShots = [];
    tentacleShots = [];
    shootClock = 0;
    bossClock = 0;
    health = 5;
    updateHealth();
    timeLeft = 30;
    levelLabel.textContent = "1/100";
    spawnClock = 0;
    lastFrame = 0;
    scoreLabel.textContent = "0";
    timeLabel.textContent = "30";
  }

  function spawnDrop() {
    const mineChance = Math.min(.42, .28 + (level - 1) * .0014);
    const roll = Math.random();
    const type = roll < mineChance ? "mine" : roll < mineChance + .08 ? "bomb" : "coin";
    const coinRoll = Math.random();
    const coinTier = coinRoll < .5
      ? { radius: 10, points: 1 }
      : coinRoll < .82
        ? { radius: 15, points: 2 }
        : { radius: 21, points: 3 };
    const radius = type === "mine" ? 17 : type === "bomb" ? 19 : coinTier.radius;
    drops.push({
      x: 28 + Math.random() * (W - 56),
      y: -28,
      radius,
      points: type === "coin" ? coinTier.points : 0,
      speed: ((type === "bomb" ? 185 : type === "mine" ? 165 : 125) + Math.min(125, (level - 1) * 1.25) + Math.random() * 85 + (30 - timeLeft) * 1.5),
      type,
      spin: Math.random() * Math.PI * 2
    });
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#104365");
    gradient.addColorStop(.48, "#082943");
    gradient.addColorStop(1, "#020d1b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Soft underwater light shafts.
    for (let i = 0; i < 5; i++) {
      const x = 55 + i * 155 + Math.sin(elapsed * .22 + i) * 24;
      const beam = ctx.createLinearGradient(x, 0, x + 75, H);
      beam.addColorStop(0, "rgba(116,235,255,.10)");
      beam.addColorStop(1, "rgba(22,217,245,0)");
      ctx.fillStyle = beam;
      ctx.beginPath(); ctx.moveTo(x - 18, 0); ctx.lineTo(x + 18, 0);
      ctx.lineTo(x + 125, H); ctx.lineTo(x + 52, H); ctx.closePath(); ctx.fill();
    }

    // Fine depth grid and drifting bubbles.
    ctx.strokeStyle = "rgba(91,210,239,.055)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let i = 0; i < 48; i++) {
      const x = (i * 137 + 29 + Math.sin(elapsed * .18 + i) * 7) % W;
      const y = (i * 83 + 17 - elapsed * (9 + i % 7)) % (H + 24);
      const radius = 1 + (i % 4) * .7;
      ctx.beginPath(); ctx.arc(x, y < 0 ? y + H + 24 : y, radius, 0, Math.PI * 2);
      ctx.fillStyle = i % 4 === 0 ? "rgba(22,217,245,.48)" : "rgba(166,247,255,.2)";
      ctx.fill();
    }
    const vignette = ctx.createRadialGradient(W / 2, H / 2, 90, W / 2, H / 2, 490);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,5,15,.42)");
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
  }

  function drawDrop(drop) {
    ctx.save();
    ctx.translate(drop.x, drop.y);
    ctx.rotate(drop.spin);
    if (drop.type === "coin") {
      const r = drop.radius;
      ctx.shadowColor = "#f8c84e"; ctx.shadowBlur = 22;
      const gold = ctx.createRadialGradient(-r * .35, -r * .4, 1, 0, 0, r * 1.25);
      gold.addColorStop(0, "#fff8c9"); gold.addColorStop(.35, "#ffd95f"); gold.addColorStop(1, "#b87519");
      ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = "#fff2a5"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, r - 3, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "rgba(124,75,9,.65)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, r * .58, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#8d5b0c"; ctx.font = "bold 16px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("A", 0, 1);
      ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.beginPath(); ctx.ellipse(-r * .35, -r * .48, 3, 5, -.5, 0, Math.PI * 2); ctx.fill();
    } else if (drop.type === "mine") {
      const r = drop.radius;
      ctx.shadowColor = "#a879ff"; ctx.shadowBlur = 20;
      const mine = ctx.createRadialGradient(-r * .35, -r * .4, 1, 0, 0, r * 1.4);
      mine.addColorStop(0, "#e5caff"); mine.addColorStop(.3, "#a978ff"); mine.addColorStop(1, "#48218d");
      ctx.fillStyle = mine; ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = i * Math.PI / 8, radius = i % 2 ? r * .78 : r * 1.35;
        const x = Math.cos(a) * radius, y = Math.sin(a) * radius;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = "rgba(232,211,255,.8)"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = "#25134b"; ctx.beginPath(); ctx.arc(0, 0, r * .48, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("×", 0, 0);
    } else {
      const r = drop.radius;
      ctx.shadowColor = "#ff4b55"; ctx.shadowBlur = 24;
      const bomb = ctx.createRadialGradient(-r * .35, -r * .4, 1, 0, 0, r * 1.35);
      bomb.addColorStop(0, "#ffb0a8"); bomb.addColorStop(.28, "#f04444"); bomb.addColorStop(1, "#681321");
      ctx.fillStyle = bomb; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffb5a8"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#351018"; ctx.fillRect(-r * .28, -r * .92, r * .56, r * .28);
      ctx.strokeStyle = "#ffd36b"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, -r * .92); ctx.quadraticCurveTo(r * .5, -r * 1.35, r * .85, -r * 1.05); ctx.stroke();
      ctx.fillStyle = "#fff0a6"; ctx.shadowColor = "#ffb52e"; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(r * .87, -r * 1.04, 3, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff"; ctx.font = "bold 13px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("−5", 0, 1);
    }
    ctx.restore();
  }

  function drawPlayer() {
    if (!player) return;
    ctx.save();
    if (player.hit > 0 && Math.floor(player.hit * 14) % 2 === 0) ctx.globalAlpha = .38;
    const bob = Math.sin(elapsed * 5) * 3;
    ctx.translate(player.x, player.y + bob);
    ctx.shadowColor = "#16d9f5"; ctx.shadowBlur = 25;
    if (mascotSprite.complete && mascotSprite.naturalWidth) {
      ctx.drawImage(mascotSprite, -43, -48, 86, 86);
    } else {
      ctx.fillStyle = "#0b3767"; ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#16d9f5"; ctx.beginPath(); ctx.arc(-9, -3, 5, 0, Math.PI * 2); ctx.arc(9, -3, 5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawBoss() {
    if (!boss) return;
    ctx.save();
    ctx.translate(boss.x, boss.y);
    const pulse = 1 + Math.sin(elapsed * 4) * .035;
    ctx.scale(pulse, pulse);
    ctx.shadowColor = "#a879ff";
    ctx.shadowBlur = 30;
    const body = ctx.createRadialGradient(-18, -20, 5, 0, 0, 76);
    body.addColorStop(0, "#e7caff");
    body.addColorStop(.28, "#9c63e8");
    body.addColorStop(1, "#32145f");
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(0, 0, 72, 58, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#d8b6ff"; ctx.lineWidth = 3; ctx.stroke();
    ctx.shadowBlur = 0;
    for (let i = 0; i < 6; i++) {
      const x = -52 + i * 21;
      ctx.strokeStyle = "#8d54d6"; ctx.lineWidth = 13; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, 34);
      ctx.quadraticCurveTo(x - 18, 66 + Math.sin(elapsed * 3 + i) * 9, x + Math.sin(elapsed * 2 + i) * 22, 91);
      ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(-24, -8, 13, 18, 0, 0, Math.PI * 2); ctx.ellipse(24, -8, 13, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ff405e";
    ctx.beginPath(); ctx.arc(-21, -7, 6, 0, Math.PI * 2); ctx.arc(21, -7, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 12px 'DM Mono', monospace"; ctx.textAlign = "center";
    ctx.fillText("ABYSSAL BOSS", 0, -78);
    ctx.restore();

    const barW = 250, barX = (W - barW) / 2, barY = 18;
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(barX, barY, barW, 13);
    ctx.fillStyle = "#ff456b"; ctx.fillRect(barX, barY, barW * Math.max(0, boss.hp / 50), 13);
    ctx.strokeStyle = "#ffd5e0"; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, 13);
    ctx.fillStyle = "#fff"; ctx.font = "bold 10px 'DM Mono', monospace"; ctx.textAlign = "center";
    ctx.fillText("BOSS HP " + boss.hp + " / 50", W / 2, 48);
  }

  function drawBossShot(shot) {
    ctx.save();
    ctx.shadowColor = "#ff456b"; ctx.shadowBlur = 16;
    ctx.fillStyle = "#ff5a79";
    ctx.beginPath(); ctx.arc(shot.x, shot.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#ffd1dc"; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  function drawTentacleShot(shot) {
    ctx.save();
    ctx.shadowColor = "#16d9f5"; ctx.shadowBlur = 18;
    ctx.strokeStyle = "#a6f7ff"; ctx.lineWidth = 7; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(shot.x, shot.y + 12); ctx.quadraticCurveTo(shot.x - 9, shot.y, shot.x, shot.y - 13); ctx.stroke();
    ctx.strokeStyle = "#16d9f5"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(shot.x, shot.y + 10); ctx.lineTo(shot.x, shot.y - 12); ctx.stroke();
    ctx.restore();
  }

  function startBossFight() {
    boss = { x: W / 2, y: 105, hp: 50, direction: 1, fireClock: 0 };
    if (shootButton) shootButton.hidden = false;
    bossShots = [];
    tentacleShots = [];
    bossClock = 0;
    shootClock = 0;
    drops.length = 0;
    particles.length = 0;
    timeLeft = 0;
    timeLabel.textContent = "BOSS";
    levelLabel.textContent = level + "/100 · BOSS";
    playSound("level");
    burst(W / 2, 110, "#bd8cff", 34);
  }

  function shootTentacle() {
    if (!running || !boss || shootClock > 0) return;
    tentacleShots.push({ x: player.x, y: player.y - 38, speed: 560 });
    shootClock = .22;
    tone(620, .08, "triangle", .07, 980);
  }

  function defeatBoss() {
    burst(boss.x, boss.y, "#a6f7ff", 60);
    boss = null;
    if (shootButton) shootButton.hidden = true;
    bossShots = [];
    tentacleShots = [];
    playSound("win");
    if (level >= 100) {
      finishGame();
      return;
    }
    level += 1;
    levelClock = 0;
    timeLeft = 30;
    spawnClock = 0;
    drops.length = 0;
    particles.length = 0;
    levelLabel.textContent = level + "/100";
    timeLabel.textContent = "30";
    playSound("level");
  }

  function burst(x, y, color, amount = 12) {
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 45 + Math.random() * 150;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: .35 + Math.random() * .45, maxLife: .8, size: 1.5 + Math.random() * 3, color });
    }
  }

  function drawParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 22 * dt; p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, p.life / p.maxLife);
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }

  function drawScene(dt = 0) {
    drawBackground();
    if (drops) drops.forEach(drawDrop);
    if (boss) drawBoss();
    if (bossShots) bossShots.forEach(drawBossShot);
    if (tentacleShots) tentacleShots.forEach(drawTentacleShot);
    if (particles) drawParticles(dt);
    drawPlayer();
  }

  function updateHealth() {
    if (!healthLabel) return;
    healthLabel.textContent = "♥".repeat(health) + "♡".repeat(5 - health);
    healthLabel.setAttribute("aria-label", health + " of 5 lives remaining");
  }

  function publishArcadeScore(completed) {
    if (window.ABYXOLeaderboard && typeof window.ABYXOLeaderboard.submitScore === "function") {
      window.ABYXOLeaderboard.submitScore(score, level, completed).catch((error) => {
        console.warn("ABYXO leaderboard submission failed:", error);
      });
    }
  }

  function gameOver() {
    running = false;
    publishArcadeScore(false);
    cancelAnimationFrame(animationId);
    keys.left = keys.right = false;
    dragPointerId = null;
    if (score > best) {
      best = score;
      bestLabel.textContent = String(best);
      try { localStorage.setItem("abyxoArcadeBest", String(best)); } catch (_) {}
    }
    playSound("over");
    overlayTitle.textContent = "DIVE OVER!";
    overlayCopy.textContent = "All 5 hearts are gone. You reached level " + level + " and collected " + score + " points. Take a breath and dive again!";
    startButton.innerHTML = "TRY AGAIN <span>↻</span>";
    overlay.hidden = false;
  }

  function finishGame() {
    running = false;
    publishArcadeScore(true);
    cancelAnimationFrame(animationId);
    keys.left = keys.right = false;
    dragPointerId = null;
    if (score > best) {
      best = score;
      bestLabel.textContent = String(best);
      try { localStorage.setItem("abyxoArcadeBest", String(best)); } catch (_) {}
    }
    playSound("win");
    overlayTitle.textContent = "100 LEVELS CLEARED!";
    overlayCopy.textContent = "You conquered all 100 dives and collected " + score + " coins. " + (score >= 100 ? "Legendary Abyxonaut!" : "The abyss will remember this run.");
    startButton.innerHTML = "PLAY AGAIN <span>↻</span>";
    overlay.hidden = false;
    drawScene();
  }

  function update(dt) {
    elapsed += dt;
    shootClock = Math.max(0, shootClock - dt);
    if (boss) {
      bossClock += dt;
      boss.x += boss.direction * (105 + Math.sin(bossClock * 2) * 25) * dt;
      if (boss.x > W - 100) boss.direction = -1;
      if (boss.x < 100) boss.direction = 1;
      boss.fireClock += dt;
      if (boss.fireClock >= 1.05) {
        boss.fireClock = 0;
        const dx = player.x - boss.x, dy = player.y - boss.y;
        const length = Math.hypot(dx, dy) || 1;
        bossShots.push({ x: boss.x, y: boss.y + 45, vx: dx / length * 185, vy: dy / length * 185 });
      }
      if (keys.left) player.x -= player.speed * dt;
      if (keys.right) player.x += player.speed * dt;
      player.x = Math.max(34, Math.min(W - 34, player.x));
      player.hit = Math.max(0, player.hit - dt);
      if (shootClock <= 0) shootTentacle();
      for (let i = tentacleShots.length - 1; i >= 0; i--) {
        const shot = tentacleShots[i];
        shot.y -= shot.speed * dt;
        if (Math.abs(shot.x - boss.x) < 68 && Math.abs(shot.y - boss.y) < 58) {
          boss.hp = Math.max(0, boss.hp - 1);
          burst(shot.x, shot.y, "#16d9f5", 4);
          tentacleShots.splice(i, 1);
          if (boss.hp <= 0) { defeatBoss(); return; }
        } else if (shot.y < -20) tentacleShots.splice(i, 1);
      }
      for (let i = bossShots.length - 1; i >= 0; i--) {
        const shot = bossShots[i];
        shot.x += shot.vx * dt; shot.y += shot.vy * dt;
        if (Math.abs(shot.x - player.x) < 25 && Math.abs(shot.y - player.y) < 28 && player.hit <= 0) {
          bossShots.splice(i, 1);
          health = Math.max(0, health - 1);
          player.hit = .9;
          updateHealth();
          burst(player.x, player.y, "#ff5a79", 18);
          playSound("mine");
          if (health <= 0) { gameOver(); return; }
        } else if (shot.y < -30 || shot.y > H + 30 || shot.x < -30 || shot.x > W + 30) {
          bossShots.splice(i, 1);
        }
      }
      return;
    }
    levelClock += dt;
    timeLeft = Math.max(0, 30 - levelClock);
    timeLabel.textContent = String(Math.ceil(timeLeft));
    if (keys.left) player.x -= player.speed * dt;
    if (keys.right) player.x += player.speed * dt;
    player.x = Math.max(34, Math.min(W - 34, player.x));
    player.hit = Math.max(0, player.hit - dt);

    spawnClock += dt;
    const spawnEvery = Math.max(.22, .78 - (level - 1) * .0052 - (30 - timeLeft) * .004);
    while (spawnClock >= spawnEvery) { spawnClock -= spawnEvery; spawnDrop(); }

    for (let i = drops.length - 1; i >= 0; i--) {
      const drop = drops[i];
      drop.y += drop.speed * dt;
      drop.spin += dt * (drop.type === "coin" ? 1.6 : -1.8);
      const dx = drop.x - player.x, dy = drop.y - player.y;
      // Match the visible 86×86 mascot sprite instead of using an undersized circle.
      const hitX = Math.abs(dx) < drop.radius + 40;
      const hitY = Math.abs(dy) < drop.radius + 38;
      if (hitX && hitY) {
        if (drop.type === "coin") {
          score += drop.points;
          scoreLabel.textContent = String(score);
          burst(drop.x, drop.y, "#ffd95f", 10 + drop.points * 4);
          playSound("coin");
        } else {
          const penalty = drop.type === "bomb" ? 5 : 2;
          score = Math.max(0, score - penalty);
          scoreLabel.textContent = String(score);
          player.hit = .7;
          health = Math.max(0, health - 1);
          updateHealth();
          burst(drop.x, drop.y, drop.type === "bomb" ? "#ff525c" : "#b58aff", drop.type === "bomb" ? 26 : 18);
          playSound(drop.type === "bomb" ? "bomb" : "mine");
          if (health <= 0) {
            drops.splice(i, 1);
            gameOver();
            return;
          }
        }
        drops.splice(i, 1);
      } else if (drop.y > H + 30) {
        drops.splice(i, 1);
      }
    }
    if (levelClock >= 30) {
      if (level % 10 === 0) {
        startBossFight();
      } else if (level >= 100) {
        finishGame();
      } else {
        level += 1;
        playSound("level");
        levelClock = 0;
        timeLeft = 30;
        spawnClock = 0;
        drops.length = 0;
        particles.length = 0;
        levelLabel.textContent = level + "/100";
        timeLabel.textContent = "30";
      }
    }
  }

  function frame(timestamp) {
    if (!running) return;
    const dt = Math.min((timestamp - (lastFrame || timestamp)) / 1000, .04);
    lastFrame = timestamp;
    update(dt);
    drawScene(dt);
    if (running) animationId = requestAnimationFrame(frame);
  }

  function startGame() {
    unlockAudio();
    playSound("start");
    cancelAnimationFrame(animationId);
    resetGame();
    running = true;
    overlay.hidden = true;
    animationId = requestAnimationFrame(frame);
  }

  let dragPointerId = null;
  function movePlayerToPointer(event) {
    const rect = stage.getBoundingClientRect();
    if (!rect.width) return;
    const localX = (event.clientX - rect.left) / rect.width * W;
    player.x = Math.max(player.width / 2, Math.min(W - player.width / 2, localX));
  }
  stage.addEventListener("pointerdown", (event) => {
    if (!running || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    dragPointerId = event.pointerId;
    movePlayerToPointer(event);
    if (stage.setPointerCapture) stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener("pointermove", (event) => {
    if (event.pointerId !== dragPointerId || !running) return;
    event.preventDefault();
    movePlayerToPointer(event);
  });
  const endDrag = (event) => {
    if (event.pointerId === dragPointerId) dragPointerId = null;
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener("lostpointercapture", endDrag);
  stage.addEventListener("contextmenu", (event) => event.preventDefault());
  window.addEventListener("blur", () => { dragPointerId = null; });
  startButton.addEventListener("click", startGame);
  window.addEventListener("keydown", (event) => {
    if ((event.code === "Space" || event.code === "ArrowUp") && running && boss) {
      event.preventDefault();
      shootTentacle();
    }
  });
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  if ("ResizeObserver" in window) new ResizeObserver(resizeCanvas).observe(stage);
  resetGame();
  drawScene();
})();
