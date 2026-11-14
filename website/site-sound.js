/* ABYXO site-wide sound layer */
(() => {
  if (window.__ABYXOSiteSoundLoaded) return;
  window.__ABYXOSiteSoundLoaded = true;
  const KEY = "abyxoSiteSound";
  let enabled = true;
  let audio = null;
  try { enabled = localStorage.getItem(KEY) !== "off"; } catch (_) {}
  const control = document.createElement("button");
  control.type = "button";
  control.className = "site-sound-toggle";
  control.setAttribute("aria-pressed", String(enabled));
  control.setAttribute("aria-label", enabled ? "Turn website sound off" : "Turn website sound on");
  control.innerHTML = '<span aria-hidden="true">♫</span><span class="site-sound-label"></span>';
  control.querySelector(".site-sound-label").textContent = enabled ? "SITE SOUND ON" : "SITE SOUND OFF";
  document.body.appendChild(control);
  function getAudio() {
    if (!enabled) return null;
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioClass) return null;
    try {
      if (!audio) audio = new AudioClass();
      if (audio.state === "suspended") audio.resume();
      return audio;
    } catch (_) { return null; }
  }
  function ping(type) {
    const ctx = getAudio();
    if (!ctx) return;
    const presets = {
      click: [[620, .075, "sine", .035, 820]],
      hover: [[880, .10, "sine", .018, 1120]],
      bubble: [[420, .16, "sine", .035, 680], [680, .12, "sine", .018, 920]],
      mood: [[390, .12, "triangle", .04, 580], [580, .16, "sine", .035, 860]],
      signal: [[520, .10, "sine", .035, 760], [760, .18, "triangle", .025, 1040]]
    };
    (presets[type] || presets.click).forEach((tone, index) => {
      const [start, duration, wave, volume, end] = tone;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const at = ctx.currentTime + index * .075;
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(start, at);
      oscillator.frequency.exponentialRampToValueAtTime(end, at + duration);
      gain.gain.setValueAtTime(.0001, at);
      gain.gain.exponentialRampToValueAtTime(volume, at + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(at);
      oscillator.stop(at + duration + .02);
    });
  }
  control.addEventListener("click", () => {
    enabled = !enabled;
    try { localStorage.setItem(KEY, enabled ? "on" : "off"); } catch (_) {}
    control.setAttribute("aria-pressed", String(enabled));
    control.setAttribute("aria-label", enabled ? "Turn website sound off" : "Turn website sound on");
    control.querySelector(".site-sound-label").textContent = enabled ? "SITE SOUND ON" : "SITE SOUND OFF";
    if (enabled) ping("bubble");
  });
  document.addEventListener("click", (event) => {
    if (!enabled || event.target.closest(".site-sound-toggle, .game-start, .game-fullscreen, .game-sound, #game-sound")) return;
    const target = event.target.closest("a, button, [role='button'], .mood-option");
    if (!target || target.disabled || target.getAttribute("aria-disabled") === "true") return;
    if (target.id === "new-signal") ping("signal");
    else if (target.classList.contains("mood-option")) ping("mood");
    else if (target.matches(".nav-cta, .button, .explore-bubble")) ping("bubble");
    else ping("click");
  });

  // Optional site-wide background music. The MP3 is uploaded separately to /audio/.
  const music = new Audio("./audio/deep-ocean.mp3");
  music.loop = true;
  music.preload = "none";
  music.volume = 0.28;
  const musicControl = document.createElement("div");
  musicControl.className = "abyxo-music-control";
  musicControl.innerHTML = '<button type="button" class="abyxo-music-toggle" aria-pressed="false"><span aria-hidden="true">▶</span><span class="abyxo-music-label">PLAY OCEAN MUSIC</span></button><label class="abyxo-volume-label" for="abyxo-music-volume">VOL</label><input id="abyxo-music-volume" class="abyxo-music-volume" type="range" min="0" max="100" value="28" aria-label="Background music volume">';
  document.body.appendChild(musicControl);
  const musicButton = musicControl.querySelector(".abyxo-music-toggle");
  const musicLabel = musicControl.querySelector(".abyxo-music-label");
  const musicIcon = musicButton.querySelector("span");
  const volumeControl = musicControl.querySelector(".abyxo-music-volume");
  musicButton.addEventListener("click", async () => {
    if (music.paused) {
      try {
        await music.play();
        musicButton.setAttribute("aria-pressed", "true");
        musicIcon.textContent = "Ⅱ";
        musicLabel.textContent = "OCEAN MUSIC ON";
      } catch (_) {
        musicLabel.textContent = "MP3 NOT UPLOADED";
        musicButton.setAttribute("aria-label", "Upload audio/deep-ocean.mp3 to enable music");
      }
    } else {
      music.pause();
      musicButton.setAttribute("aria-pressed", "false");
      musicIcon.textContent = "▶";
      musicLabel.textContent = "PLAY OCEAN MUSIC";
    }
  });
  volumeControl.addEventListener("input", () => { music.volume = Number(volumeControl.value) / 100; });
  music.addEventListener("ended", () => {
    musicButton.setAttribute("aria-pressed", "false");
    musicIcon.textContent = "▶";
    musicLabel.textContent = "PLAY OCEAN MUSIC";
  });
  music.addEventListener("error", () => {
    if (music.paused) musicLabel.textContent = "MP3 NOT UPLOADED";
  });

  document.addEventListener("pointerover", (event) => {
    if (!enabled || event.pointerType === "touch") return;
    const target = event.target.closest(".nav a, .nav-cta, .explore-bubble");
    if (target && !target.contains(event.relatedTarget)) ping("hover");
  });
})();