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

// Hidden five-tap easter egg
const secretTrigger = document.querySelector("#secret-trigger");
if (secretTrigger) {
  let taps = 0;
  const counter = document.querySelector("#secret-count");
  const reveal = document.querySelector("#secret-reveal");
  secretTrigger.addEventListener("click", () => {
    taps = Math.min(taps + 1, 5);
    counter.textContent = taps + " / 5";
    if (taps === 5) {
      reveal.hidden = false;
      secretTrigger.innerHTML = "<span>✦</span> SECRET UNLOCKED <b>✓</b>";
      secretTrigger.disabled = true;
      secretTrigger.setAttribute("aria-label", "Secret unlocked");
    }
  });
}
