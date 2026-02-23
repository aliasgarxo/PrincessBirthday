// ======================
// EDIT THESE (personalize)
// ======================
const CONFIG = {
  herName: "Fatema",         // e.g. "Aanya"
  toName: "My Love",
  fromName: "Aliasgar",       // your name
  finalMessage: "You’re my favorite person. Happy Birthday, always. ❤️",
  // Memory game pairs (emojis). You can swap to short words if you want.
  gamePairs: ["assets/game/ali1.jpg","assets/game/ali1.jpg","assets/game/fattu1.jpg","assets/game/fattu1.jpg","assets/game/fattu2.jpg","assets/game/fattu2.jpg","assets/game/fattu3.jpg","assets/game/fattu3.jpg","assets/game/ali2.jpg","assets/game/ali2.jpg","assets/game/ali3.jpg","assets/game/ali3.jpg"],
};

// ======= Helpers =======
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

// ======================
// mega confetti bursts (SAFE, optional)
// ======================
function megaConfettiBursts(times = 10, gapMs = 140) {
  if (typeof confetti !== "function") return;

  const BRIGHT_COLORS = [
    "#ff006e",  // hot pink
    "#ffbe0b",  // neon yellow
    "#fb5607",  // orange
    "#ff2e63",  // red pink
    "#8338ec",  // purple
    "#3a86ff",  // electric blue
    "#00f5d4",  // aqua
    "#ffffff"   // bright white sparkle
  ];

  let count = 0;

  const timer = setInterval(() => {
    count++;

    const x = Math.random();
    const y = Math.random() * 0.6 + 0.1;

    confetti({
      particleCount: 120,
      spread: 110,
      startVelocity: 45,
      scalar: 1.4,                 // bigger pieces
      gravity: 0.8,
      ticks: 300,
      zIndex: 9999,
      colors: BRIGHT_COLORS,
      origin: { x, y }
    });

    if (count >= times) clearInterval(timer);
  }, gapMs);
}



// ======================
// Initialize names (SAFE)
// ======================
const herNameEl  = document.getElementById("herName");
const toNameEl   = document.getElementById("toName");
const fromNameEl = document.getElementById("fromName");
const finalNameEl= document.getElementById("finalName");

if (herNameEl)  herNameEl.textContent  = CONFIG.herName;
if (toNameEl)   toNameEl.textContent   = CONFIG.toName;
if (fromNameEl) fromNameEl.textContent = CONFIG.fromName;
if (finalNameEl)finalNameEl.textContent= CONFIG.herName;

// ======================
// Smooth scroll on Start
// ======================
$("#startBtn").addEventListener("click", () => {
  $("#cake").scrollIntoView({ behavior: "smooth", block: "start" });
});

// ======================
// Music toggle (SAFE)
// ======================
const musicBtn = document.getElementById("musicBtn");
const bgMusic  = document.getElementById("bgMusic");

if (musicBtn && bgMusic) {
  musicBtn.addEventListener("click", async () => {
    try {
      if (bgMusic.paused) {
        await bgMusic.play();
        musicBtn.textContent = "Pause Music";
        musicBtn.setAttribute("aria-pressed", "true");
      } else {
        bgMusic.pause();
        musicBtn.textContent = "Play Music";
        musicBtn.setAttribute("aria-pressed", "false");
      }
    } catch (e) {
      alert("Add a music file (assets/music.mp3). Browsers block autoplay until a user gesture.");
    }
  });
}


// ======================
// Immersive tilt effect
// ======================
function applyTilt(el){
  if (!el) return;
  const strength = 10;
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (py - 0.5) * -strength;
    const ry = (px - 0.5) * strength;
    el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
  });
  el.addEventListener("mouseleave", () => {
    el.style.transform = "";
  });
}

$$(".tilt").forEach(applyTilt);

// ======================
// Scroll progress bar (SAFE)
// ======================
window.addEventListener("scroll", () => {
  const bar = document.getElementById("scrollProgress");
  if (!bar) return;

  const doc = document.documentElement;
  const scrollTop = doc.scrollTop;
  const height = doc.scrollHeight - doc.clientHeight;
  const pct = height > 0 ? (scrollTop / height) * 100 : 0;
  bar.style.width = `${pct}%`;
});

// ======================
// Particles (balloons/hearts)
// ======================
(async function initParticles(){
    if (!window.tsParticles) return;
  // tsParticles: we’ll simulate “balloons/hearts” with soft particles + upward drift
  await tsParticles.load("particles", {
    background: { color: { value: "transparent" } },
    fpsLimit: 60,
    detectRetina: true,
    particles: {
      number: { value: 42, density: { enable: true, area: 900 } },
      color: { value: ["#ff4fa3","#7c5cff","#ffffff"] },
      opacity: { value: { min: 0.15, max: 0.45 } },
      size: { value: { min: 8, max: 22 } },
      shape: { type: ["circle"] },
      move: {
        enable: true,
        direction: "top",
        speed: { min: 0.35, max: 1.1 },
        outModes: { default: "out" }
      },
      wobble: { enable: true, distance: 10, speed: 2 },
      shadow: { enable: false }
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: "repulse" },
        onClick: { enable: true, mode: "push" }
      },
      modes: {
        repulse: { distance: 110, duration: 0.4 },
        push: { quantity: 2 }
      }
    }
  });
})();



// ======================
// Fancy cake candles (generated)
// ======================
const candleRow = document.getElementById("candleRow");
const lightBtn = document.getElementById("lightBtn");
const wishBtn = document.getElementById("wishBtn");
const blowBtn = document.getElementById("blowBtn");
const wishBox = document.getElementById("wishBox");

const CANDLE_COUNT = 12; // change to 10, 12, 15, etc.
let candles = [];
let candlesLit = false;
let wishMade = false;

function buildCandles(){
  candleRow.innerHTML = "";
  candles = [];

  for (let i = 0; i < CANDLE_COUNT; i++){
    const c = document.createElement("div");
    c.className = "candle";
    c.style.animationDelay = `${(i % 5) * 0.08}s`;

    // flame + smoke elements
    const flame = document.createElement("span");
    flame.className = "flame";
    const smoke = document.createElement("span");
    smoke.className = "smoke";

    c.appendChild(flame);
    c.appendChild(smoke);

    candleRow.appendChild(c);
    candles.push(c);
  }
}

function setCandlesLit(on){
  candlesLit = on;
  candles.forEach(c => {
    c.classList.toggle("lit", on);
    c.classList.remove("smoking");
  });

  wishBtn.disabled = !on;
  blowBtn.disabled = !on;
}

lightBtn.addEventListener("click", () => {
  setCandlesLit(true);
  wishBox.textContent = "Candles are lit ✨ Now… make a wish.";
  megaConfettiBursts(6, 160);
});

wishBtn.addEventListener("click", () => {
  wishMade = true;
  wishBox.innerHTML = `<span class="accent">Wish locked in 💝</span> Now blow the candles out!`;
  megaConfettiBursts(10, 140);
});

blowBtn.addEventListener("click", () => {
  // extinguish with small smoke puffs
  candles.forEach((c, idx) => {
    setTimeout(() => {
      c.classList.remove("lit");
      c.classList.add("smoking");
    }, idx * 45);
  });

  candlesLit = false;
  wishBtn.disabled = true;
  blowBtn.disabled = true;

  setTimeout(() => {
    candles.forEach(c => c.classList.remove("smoking"));
  }, 1100);

  wishBox.textContent = wishMade
    ? "Candles out ✅ Keep scrolling… fireworks are ready 🎆"
    : "Candles out 🌬️ Make a wish next time 😉";

  // tiny confetti burst when blown
  megaConfettiBursts(14, 120);

});

buildCandles();
setCandlesLit(false);


// ======================
// lightGallery init
// ======================
lightGallery(document.getElementById("lightgallery"), {
  plugins: [lgZoom, lgThumbnail],
  speed: 250,
  thumbnail: true,
});

// ======================
// Memory Match game
// ======================
const gameGrid = $("#gameGrid");
const pairsFoundEl = $("#pairsFound");
const pairsTotalEl = $("#pairsTotal");
const finalCard = $("#finalCard");
const finalMessage = $("#finalMessage");

pairsTotalEl.textContent = String(CONFIG.gamePairs.length / 2);
finalMessage.textContent = CONFIG.finalMessage;

let tiles = [];
let flipped = [];
let matched = 0;
let lock = false;

function shuffle(arr){
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderGame(){
  gameGrid.innerHTML = "";
  finalCard.hidden = true;
  matched = 0;
  flipped = [];
  lock = false;
  pairsFoundEl.textContent = "0";

  const deck = shuffle(CONFIG.gamePairs);
  tiles = deck.map((value, idx) => {
    const btn = document.createElement("button");
    btn.className = "tile";
    btn.type = "button";
    btn.setAttribute("aria-label", "Memory tile");
    btn.dataset.value = value;
    btn.dataset.index = String(idx);

    btn.innerHTML = `
      <div class="face front">💗</div>
      <div class="face back">
        <img src="${value}" alt="Memory" />
    `;

    btn.addEventListener("click", () => onFlip(btn));
    return btn;
  });

  tiles.forEach(t => gameGrid.appendChild(t));
}

function onFlip(tile){
  if (lock) return;
  if (tile.classList.contains("flipped")) return;
  if (tile.classList.contains("matched")) return;

  tile.classList.add("flipped");
  flipped.push(tile);

  if (flipped.length === 2){
    lock = true;
    const [a, b] = flipped;
    const isMatch = a.dataset.value === b.dataset.value;

    setTimeout(() => {
      if (isMatch){
        a.classList.add("matched");
        b.classList.add("matched");
        matched += 1;
        pairsFoundEl.textContent = String(matched);
        confetti({ particleCount: 40, spread: 40, origin: { y: 0.78 } });
      } else {
        a.classList.remove("flipped");
        b.classList.remove("flipped");
      }
      flipped = [];
      lock = false;

      const totalPairs = CONFIG.gamePairs.length / 2;
      if (matched >= totalPairs){
        finalCard.hidden = false;
        confetti({ particleCount: 180, spread: 90, origin: { y: 0.75 } });
      }
    }, isMatch ? 420 : 650);
  }
}

$("#resetGameBtn").addEventListener("click", renderGame);
$("#finalConfettiBtn").addEventListener("click", () => {
  confetti({ particleCount: 260, spread: 110, origin: { y: 0.7 } });
});

renderGame();


// ======================
// Count-up since Oct 19, 2025 1:00 AM EST
// ======================
(function initCountUp(){
  const bar = document.getElementById("countupBar");
  if (!bar) return;

  const elDays = document.getElementById("cuDays");
  const elHours = document.getElementById("cuHours");
  const elMins = document.getElementById("cuMins");
  const elSecs = document.getElementById("cuSecs");
  const closeBtn = document.getElementById("countupClose");

  // Oct 19 2025 01:00:00 EST = UTC-05:00 (fixed offset)
  // Using a fixed offset keeps it consistent regardless of viewer's timezone.
  const START = new Date("2025-10-19T01:00:00-05:00").getTime();

  function pad2(n){ return String(n).padStart(2, "0"); }

  function tick(){
    const now = Date.now();
    let diff = now - START; // milliseconds since START

    // If date is in the future, show 0 elapsed (optional behavior)
    if (diff < 0) diff = 0;

    const totalSeconds = Math.floor(diff / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    elDays.textContent = String(days);
    elHours.textContent = pad2(hours);
    elMins.textContent = pad2(mins);
    elSecs.textContent = pad2(secs);
  }

  tick();
  const t = setInterval(tick, 1000);

  closeBtn?.addEventListener("click", () => {
    bar.style.display = "none";
    clearInterval(t);
  });
})();
