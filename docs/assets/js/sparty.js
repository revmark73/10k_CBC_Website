/* Ask Sparty (WO-42). Floating launcher on every page, a chat window,
   and the big feature on the home page. Sparty answers from this website
   only, through the askSparty function in Catalyst Connect. */
(function () {
  "use strict";
  var ENDPOINT = "https://base44.app/api/apps/6a56c72b8c54830021111967/functions/askSparty";
  var me = document.currentScript && document.currentScript.src;
  var IMG = me ? me.replace(/js\/sparty\.js.*$/, "img/") : "assets/img/";
  var SITE_ROOT = me ? me.replace(/assets\/js\/sparty\.js.*$/, "") : "";
  var SUGGESTED = [
    "What does it cost?",
    "Which degrees can I earn?",
    "Is housing available?",
    "Where are the campuses?",
    "How do I apply?"
  ];
  var history = [];
  var busy = false;
  /* ---------- Sparty's welcome film: the house rules ----------
     The film plays once, on a visitor's first click of anything Ask
     Sparty (the corner button, a question button, or the Ask button).
     After that, every click goes straight to the chat with the still,
     gently animated Sparty.
     1. It only starts from a click, so sound is allowed and expected.
     2. Once per page load. Reloading the page, or opening another
        page, brings it back for the next first click. Nothing is
        saved on the visitor's computer.
     3. A Skip button and Escape always end it right away.
     4. Captions show the whole time.
     5. Visitors who ask for reduced motion or who save data skip it.
     6. If the film can't start within a few seconds, the chat opens.
     7. The file is not downloaded until that first click. */
  var FILM = {
    src: IMG.replace(/img\/$/, "video/") + "sparty-intro.mp4",
    captions: [
      [0.3, 4.0, "Behold! From the fires of the forge...\nI am SPARTY!"],
      [4.0, 9.0, "At Catalyst Bible College, everyone\nmajors in changing the world!"],
      [9.0, 12.0, "A real degree. No mountain of debt."],
      [12.0, 14.9, "Got a question? Bring it on!"]
    ],
    poster: IMG + "sparty-intro-poster.jpg",
  };
  var filmSeenThisPage = false;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function figure(size) {
    var f = el("span", "sparty-fig");
    f.setAttribute("aria-hidden", "true");
    f.appendChild(el("span", "shadow"));
    f.appendChild(el("span", "glow"));
    var img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.onerror = function () { img.onerror = null; img.src = IMG + "sparty-" + size + ".png"; };
    img.src = IMG + "sparty-" + size + ".webp";
    f.appendChild(img);
    f.appendChild(el("span", "orbit"));
    return f;
  }

  // Turn a site link from Sparty into an address that works from this page.
  function siteHref(path) {
    if (/^https?:\/\//.test(path)) return path;
    var p = path.replace(/^\//, "");
    if (p === "") return SITE_ROOT || "./";
    if (p.charAt(0) === "#") return (SITE_ROOT || "./") + p;
    return SITE_ROOT + p;
  }
  // Sparty may also link to a page of the Nelson undergraduate catalog.
  var CATALOG_PDF = "https://www.nelson.edu/wp-content/uploads/2026/06/UndergraduateCatalog_26-27.Final_.pdf";
  var LINK_NAMES = {
    "/": "Home", "/#cost": "What it costs", "/#programs": "Degrees", "/#world": "World Experience",
    "/#life": "Student life", "/#faq": "Questions", "/#contact": "Ask us", "/current/": "Current students",
    "/schedule/": "Schedule a meeting", "/forge/": "The Forge", "/s3/": "S3", "/signing-day/": "Signing Day",
    "/textbook-request/": "Textbook request", "/ohio/": "Poland, OH", "/thechapel/": "Midlothian, VA",
    "/ca_disc/": "CA Disclosures", "/privacy.html": "Privacy", "https://connect.nelson.edu/apply/": "Apply"
  };

  /* ---------- build the panel ---------- */
  var panel = el("section", "sparty-panel");
  panel.id = "spartyPanel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-labelledby", "spartyTitle");

  var head = el("div", "sparty-head");
  head.appendChild(figure(240));
  var titles = el("div");
  var h2 = el("h2", null, "Ask Sparty");
  h2.id = "spartyTitle";
  titles.appendChild(h2);
  titles.appendChild(el("p", null, "Your guide to Catalyst"));
  head.appendChild(titles);
  var closeBtn = el("button", "sparty-close", "\u00d7");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close Ask Sparty");
  head.appendChild(closeBtn);
  panel.appendChild(head);

  var log = el("div", "sparty-log");
  log.setAttribute("aria-live", "polite");
  panel.appendChild(log);

  var chips = el("div", "sparty-chips");
  panel.appendChild(chips);

  var form = el("form", "sparty-form");
  var input = el("input");
  input.type = "text";
  input.maxLength = 500;
  input.placeholder = "Ask about Catalyst...";
  input.setAttribute("aria-label", "Your question for Sparty");
  input.autocomplete = "off";
  var send = el("button", null, "Ask");
  send.type = "submit";
  form.appendChild(input);
  form.appendChild(send);
  panel.appendChild(form);

  var note = el("p", "sparty-note");
  note.innerHTML = "Sparty answers from this website and the Nelson University catalog, and he can get things wrong. For anything important, call <a href=\"tel:+15597339070\">559-733-9070</a>. Please don't share personal details here.";
  panel.appendChild(note);

  function makeChips(box, onPick) {
    SUGGESTED.forEach(function (q) {
      var b = el("button", null, q);
      b.type = "button";
      b.addEventListener("click", function () { onPick(q); });
      box.appendChild(b);
    });
  }
  makeChips(chips, function (q) { ask(q); });

  /* ---------- launcher ---------- */
  var launch = el("button", "sparty-launch");
  launch.type = "button";
  launch.setAttribute("aria-controls", "spartyPanel");
  launch.setAttribute("aria-expanded", "false");
  launch.setAttribute("aria-label", "Ask Sparty, our guide, a question about Catalyst");
  var bubble = el("span", "bubble");
  bubble.appendChild(el("small", null, "Questions?"));
  bubble.appendChild(document.createTextNode("Ask Sparty"));
  launch.appendChild(bubble);
  launch.appendChild(figure(240));

  document.body.appendChild(launch);
  document.body.appendChild(panel);

  var greeted = false;
  var GREETING = "Hey, I'm Sparty! Ask me anything about Catalyst Bible College: cost, degrees, housing, campuses, or how to apply.";
  var lastFocus = null;
  function openPanel() {
    if (panel.classList.contains("is-open")) return;
    if (filmIsShowing()) return;
    lastFocus = document.activeElement;
    if (shouldShowFilm()) { showFilm(revealPanel); return; }
    revealPanel();
  }
  function revealPanel() {
    panel.classList.add("is-open");
    launch.setAttribute("aria-expanded", "true");
    if (!greeted) {
      greeted = true;
      addMsg("sparty", GREETING);
    }
    setTimeout(function () { input.focus(); }, 50);
  }
  function closePanel() {
    panel.classList.remove("is-open");
    launch.setAttribute("aria-expanded", "false");
    (lastFocus && lastFocus.focus ? lastFocus : launch).focus();
  }
  launch.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("is-open")) closePanel();
  });

  function addMsg(who, text, links) {
    var m = el("div", "sparty-msg " + (who === "you" ? "from-you" : "from-sparty"), text);
    if (links && links.length) {
      var box = el("div", "links");
      links.forEach(function (l) {
        if (typeof l !== "string") return;
        var page = l.indexOf(CATALOG_PDF + "#page=") === 0 ? l.slice(CATALOG_PDF.length + 6) : "";
        var known = Object.prototype.hasOwnProperty.call(LINK_NAMES, l);
        if (!known && !/^\d{1,3}$/.test(page)) return;
        var a = el("a", null, known ? LINK_NAMES[l] : "Nelson catalog, p. " + page);
        a.href = siteHref(l);
        if (/^https?:/.test(l)) { a.target = "_blank"; a.rel = "noopener"; }
        box.appendChild(a);
      });
      m.appendChild(box);
    }
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }

  function setTalking(on) {
    document.querySelectorAll(".sparty-launch, .sparty-head, .ask-sparty").forEach(function (n) {
      n.classList.toggle("is-talking", on);
    });
  }

  function ask(q) {
    q = String(q || "").trim();
    if (!q || busy) return;
    if (!panel.classList.contains("is-open")) openPanel();
    if (!greeted) { greeted = true; addMsg("sparty", GREETING); }
    chips.hidden = true;
    addMsg("you", q);
    input.value = "";
    busy = true;
    send.disabled = true;
    setTalking(true);
    var typing = el("div", "sparty-typing");
    typing.setAttribute("aria-label", "Sparty is thinking");
    typing.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(typing);
    log.scrollTop = log.scrollHeight;

    var done = function (answer, links) {
      typing.remove();
      addMsg("sparty", answer, links);
      history.push({ q: q, a: answer });
      if (history.length > 6) history.shift();
      busy = false;
      send.disabled = false;
      setTalking(false);
      input.focus();
    };
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, history: history }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, body: j }; });
    }).then(function (res) {
      clearTimeout(timer);
      var b = res.body || {};
      if (res.ok && b.answer) done(b.answer, Array.isArray(b.links) ? b.links : []);
      else done(b.error || "I couldn't answer that just now. Call our office at 559-733-9070 and a real person will help.", ["/#contact"]);
    }).catch(function () {
      clearTimeout(timer);
      done("I'm having trouble connecting right now. Call our office at 559-733-9070, or send us a question with the form on the home page.", ["/#contact"]);
    });
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); });

  /* ---------- the welcome film (first click only) ---------- */
  function seenFilm() { return filmSeenThisPage; }
  function markSeen() { filmSeenThisPage = true; }
  function shouldShowFilm() {
    if (seenFilm()) return false;
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    var c = navigator.connection;
    if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ""))) return false;
    var t = document.createElement("video");
    return !!(t.canPlayType && t.canPlayType("video/mp4"));
  }

  var filmBox = null;
  function filmIsShowing() { return !!(filmBox && filmBox.classList.contains("is-open")); }

  function showFilm(done) {
    markSeen();
    var wrap = el("div", "sparty-film-overlay");
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Meet Sparty, a 15 second welcome");
    var box = el("div", "sparty-film");
    var video = document.createElement("video");
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.preload = "auto";
    video.poster = FILM.poster;
    var cc = null;
    try {
      cc = video.addTextTrack("captions", "English", "en");
      FILM.captions.forEach(function (c) { cc.addCue(new VTTCue(c[0], c[1], c[2])); });
      cc.mode = "showing";
    } catch (e) { cc = null; }
    var skipBtn = el("button", "sparty-film-chip sparty-film-skip", "Skip");
    skipBtn.type = "button";
    skipBtn.setAttribute("aria-label", "Skip Sparty's welcome and open the chat");
    var muteBtn = el("button", "sparty-film-chip sparty-film-sound", "Sound off");
    muteBtn.type = "button";
    box.appendChild(video);
    box.appendChild(muteBtn);
    box.appendChild(skipBtn);
    wrap.appendChild(box);
    document.body.appendChild(wrap);
    filmBox = wrap;

    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      clearTimeout(stall);
      document.removeEventListener("keydown", onKey, true);
      try { video.pause(); } catch (e) {}
      video.removeAttribute("src");
      try { video.load(); } catch (e) {}
      wrap.classList.remove("is-open");
      wrap.remove();
      filmBox = null;
      done();
    }
    function onKey(e) { if (e.key === "Escape") { e.stopPropagation(); finish(); } }
    document.addEventListener("keydown", onKey, true);
    skipBtn.addEventListener("click", finish);
    muteBtn.addEventListener("click", function () {
      video.muted = !video.muted;
      muteBtn.textContent = video.muted ? "Sound on" : "Sound off";
    });
    wrap.addEventListener("click", function (e) { if (e.target === wrap) finish(); });
    video.addEventListener("ended", finish);
    video.addEventListener("error", finish);
    document.addEventListener("visibilitychange", function () { if (document.hidden) finish(); });

    // If it hasn't started within six seconds, go straight to the chat.
    var stall = setTimeout(function () { if (video.paused || video.currentTime < 0.1) finish(); }, 6000);
    video.addEventListener("playing", function () { clearTimeout(stall); });

    wrap.classList.add("is-open");
    video.src = FILM.src;
    video.volume = 0.85;
    var p = video.play();
    if (p && p.catch) p.catch(function () {
      // Some browsers refuse sound; try once more without it.
      video.muted = true;
      muteBtn.textContent = "Sound on";
      var q = video.play();
      if (q && q.catch) q.catch(finish);
    });
    skipBtn.focus();
  }

  /* ---------- home page feature ---------- */
  var feature = document.getElementById("ask-sparty");
  if (feature) {
    var slot = feature.querySelector("[data-sparty-figure]");
    if (slot) slot.appendChild(figure(480));
    var fChips = feature.querySelector(".sparty-chips");
    if (fChips) makeChips(fChips, function (q) { ask(q); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        launch.classList.toggle("is-tucked", es[0].isIntersecting);
      }, { threshold: 0.25 }).observe(feature);
    }
    var start = feature.querySelector("form.start");
    if (start) start.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = start.querySelector("input");
      var v = f.value;
      f.value = "";
      if (v.trim()) ask(v); else openPanel();
    });
  }
})();
