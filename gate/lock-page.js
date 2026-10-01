// Generated from gate/lock.html — the Workers runtime has no filesystem,
// so the lock screen ships as a module export.
// Edit gate/lock.html, then run: node gate/build-lock-page.mjs

export const LOCK_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex, nofollow" />
<title>Only for you 💗</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Emilys+Candy&family=Pacifico&display=swap" rel="stylesheet">
<style>
  :root{
    --accent:#ff4fa3;
    --accent2:#7c5cff;
    --text:rgba(255,255,255,0.92);
    --muted:rgba(255,255,255,0.68);
    --danger:#ff3b5c;
  }
  *{box-sizing:border-box}
  html,body{height:100%;margin:0}
  body{
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
    color:var(--text);
    background:
      radial-gradient(1200px 600px at 20% 10%, rgba(255,79,163,0.22), transparent 60%),
      radial-gradient(900px 500px at 85% 85%, rgba(124,92,255,0.22), transparent 60%),
      linear-gradient(160deg, #120718 0%, #070711 55%, #150a1e 100%);
    display:grid;
    place-items:center;
    overflow:hidden;
  }

  /* Drifting hearts — pure CSS so the lock page loads no site assets */
  .hearts{position:fixed;inset:0;pointer-events:none;overflow:hidden}
  .hearts i{
    position:absolute;
    bottom:-10vh;
    font-style:normal;
    font-size:var(--s,18px);
    opacity:0;
    animation: rise var(--d,14s) linear var(--delay,0s) infinite;
    filter: drop-shadow(0 0 10px rgba(255,79,163,0.45));
  }
  @keyframes rise{
    0%{transform:translateY(0) scale(.7) rotate(0deg);opacity:0}
    12%{opacity:.9}
    100%{transform:translateY(-118vh) scale(1.1) rotate(32deg);opacity:0}
  }

  .card{
    position:relative;
    z-index:2;
    width:min(92vw, 430px);
    padding:38px 30px 30px;
    text-align:center;
    border-radius:26px;
    background:rgba(28,14,28,0.55);
    border:1px solid rgba(255,255,255,0.14);
    box-shadow:0 24px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08);
    backdrop-filter:blur(18px);
    -webkit-backdrop-filter:blur(18px);
  }
  .card.shake{animation:shake .45s cubic-bezier(.36,.07,.19,.97)}
  @keyframes shake{
    10%,90%{transform:translateX(-2px)}
    20%,80%{transform:translateX(4px)}
    30%,50%,70%{transform:translateX(-7px)}
    40%,60%{transform:translateX(7px)}
  }

  .lock{
    width:76px;height:76px;margin:0 auto 14px;
    display:grid;place-items:center;
    font-size:34px;
    border-radius:50%;
    background:linear-gradient(145deg, var(--accent), var(--accent2));
    box-shadow:0 10px 34px rgba(255,79,163,0.45);
  }
  h1{
    font-family:"Emilys Candy", serif;
    font-weight:400;
    font-size:clamp(25px, 6vw, 33px);
    margin:0 0 6px;
  }
  .sub{color:var(--muted);font-size:14.5px;margin:0 0 24px;line-height:1.55}

  .field{position:relative;margin-bottom:14px}
  input[type="password"],input[type="text"]{
    width:100%;
    padding:15px 50px 15px 18px;
    font-size:16px;
    color:var(--text);
    border-radius:15px;
    border:1px solid rgba(255,255,255,0.18);
    background:rgba(255,255,255,0.07);
    outline:none;
    transition:border-color .2s, box-shadow .2s;
  }
  input::placeholder{color:rgba(255,255,255,0.45)}
  input:focus{border-color:var(--accent);box-shadow:0 0 0 4px rgba(255,79,163,0.18)}
  .peek{
    position:absolute;top:50%;right:8px;transform:translateY(-50%);
    background:none;border:0;cursor:pointer;
    font-size:18px;padding:8px;border-radius:10px;color:var(--muted);
  }
  .peek:hover{color:var(--text)}

  button.go{
    width:100%;
    padding:15px 18px;
    font-size:16px;font-weight:700;
    color:#fff;cursor:pointer;
    border:0;border-radius:15px;
    background:linear-gradient(135deg, var(--accent), var(--accent2));
    box-shadow:0 12px 30px rgba(255,79,163,0.35);
    transition:transform .12s, filter .2s, opacity .2s;
  }
  button.go:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.07)}
  button.go:disabled{opacity:.55;cursor:not-allowed}

  .msg{min-height:22px;margin-top:14px;font-size:14px;color:var(--danger)}
  .msg.ok{color:#7ef5b0}
  .hint{
    margin-top:20px;font-family:"Pacifico",cursive;
    font-size:13.5px;color:rgba(255,255,255,0.5);
  }
  @media (prefers-reduced-motion: reduce){
    .hearts i{animation:none;display:none}
    .card.shake{animation:none}
  }
</style>
</head>
<body>

<div class="hearts" aria-hidden="true" id="hearts"></div>

<main class="card" id="card">
  <div class="lock" aria-hidden="true">🔒</div>
  <h1>Only for you 💗</h1>
  <p class="sub">This little world is locked.<br/>Type the password I gave you, my love.</p>

  <form id="form" autocomplete="off">
    <div class="field">
      <input id="pw" type="password" placeholder="Our secret password"
             autocomplete="current-password" aria-label="Password" required />
      <button type="button" class="peek" id="peek" aria-label="Show password">👁️</button>
    </div>
    <button type="submit" class="go" id="go">Unlock 💝</button>
  </form>

  <div class="msg" id="msg" role="status" aria-live="polite"></div>
  <div class="hint">made with love</div>
</main>

<script>
(function(){
  var EMOJI = ["💗","❤️","💖","🤍","💕","🌸"];
  var wrap = document.getElementById("hearts");
  for (var i = 0; i < 18; i++) {
    var h = document.createElement("i");
    h.textContent = EMOJI[i % EMOJI.length];
    h.style.left = Math.random() * 100 + "vw";
    h.style.setProperty("--s", (14 + Math.random() * 22).toFixed(0) + "px");
    h.style.setProperty("--d", (11 + Math.random() * 11).toFixed(1) + "s");
    h.style.setProperty("--delay", (Math.random() * 12).toFixed(1) + "s");
    wrap.appendChild(h);
  }

  var form = document.getElementById("form");
  var pw   = document.getElementById("pw");
  var go   = document.getElementById("go");
  var msg  = document.getElementById("msg");
  var card = document.getElementById("card");
  var peek = document.getElementById("peek");
  var timer = null;

  peek.addEventListener("click", function(){
    var showing = pw.type === "text";
    pw.type = showing ? "password" : "text";
    peek.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    pw.focus();
  });

  function fail(text, retryAfter){
    msg.className = "msg";
    card.classList.remove("shake");
    void card.offsetWidth;
    card.classList.add("shake");

    if (timer) { clearInterval(timer); timer = null; }

    if (retryAfter > 0) {
      go.disabled = true;
      pw.disabled = true;
      var left = retryAfter;
      var tick = function(){
        msg.textContent = "Too many tries. Wait " + left + "s 💔";
        if (left-- <= 0) {
          clearInterval(timer); timer = null;
          go.disabled = false; pw.disabled = false;
          msg.textContent = "";
          pw.focus();
        }
      };
      tick();
      timer = setInterval(tick, 1000);
    } else {
      msg.textContent = text;
      go.disabled = false;
      pw.select();
    }
  }

  form.addEventListener("submit", function(e){
    e.preventDefault();
    if (!pw.value) return;
    go.disabled = true;
    msg.className = "msg";
    msg.textContent = "";

    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw.value }),
      credentials: "same-origin"
    })
    .then(function(r){ return r.json().then(function(b){ return { status: r.status, body: b }; }); })
    .then(function(res){
      if (res.status === 200 && res.body.ok) {
        msg.className = "msg ok";
        msg.textContent = "Unlocked. Happy birthday, my love 🎉";
        pw.value = "";
        setTimeout(function(){ window.location.replace("/"); }, 650);
        return;
      }
      fail(res.body.error || "That's not it. Try again 💗", res.body.retryAfterSeconds || 0);
    })
    .catch(function(){
      fail("Something went wrong. Try again 💗", 0);
    });
  });

  pw.focus();
})();
</script>
</body>
</html>
`;
