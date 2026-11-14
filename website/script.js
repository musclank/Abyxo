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
