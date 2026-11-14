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
  const W = 720, H = 420;
  const keys = { left: false, right: false };
  let player, drops, particles, score, level, timeLeft, running, lastFrame, spawnClock, animationId, elapsed = 0, levelClock = 0;
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
    if (particles) drawParticles(dt);
    drawPlayer();
  }

  function finishGame() {
    running = false;
    cancelAnimationFrame(animationId);
    keys.left = keys.right = false;
    dragPointerId = null;
    if (score > best) {
      best = score;
      bestLabel.textContent = String(best);
      try { localStorage.setItem("abyxoArcadeBest", String(best)); } catch (_) {}
    }
    overlayTitle.textContent = "100 LEVELS CLEARED!";
    overlayCopy.textContent = "You conquered all 100 dives and collected " + score + " coins. " + (score >= 100 ? "Legendary Abyxonaut!" : "The abyss will remember this run.");
    startButton.innerHTML = "PLAY AGAIN <span>↻</span>";
    overlay.hidden = false;
    drawScene();
  }

  function update(dt) {
    elapsed += dt;
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
      if (Math.hypot(dx, dy) < drop.radius + 25) {
        if (drop.type === "coin") {
          score += drop.points;
          scoreLabel.textContent = String(score);
          burst(drop.x, drop.y, "#ffd95f", 10 + drop.points * 4);
        } else {
          const penalty = drop.type === "bomb" ? 5 : 2;
          score = Math.max(0, score - penalty);
          scoreLabel.textContent = String(score);
          player.hit = .7;
          burst(drop.x, drop.y, drop.type === "bomb" ? "#ff525c" : "#b58aff", drop.type === "bomb" ? 26 : 18);
        }
        drops.splice(i, 1);
      } else if (drop.y > H + 30) {
        drops.splice(i, 1);
      }
    }
    if (levelClock >= 30) {
      if (level >= 100) {
        finishGame();
      } else {
        level += 1;
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
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  if ("ResizeObserver" in window) new ResizeObserver(resizeCanvas).observe(stage);
  resetGame();
  drawScene();
})();
