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
  document.addEventListener("pointerover", (event) => {
    if (!enabled || event.pointerType === "touch") return;
    const target = event.target.closest(".nav a, .nav-cta, .explore-bubble");
    if (target && !target.contains(event.relatedTarget)) ping("hover");
  });
})();