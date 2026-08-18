/* Scroll-scrub hero. Blob-fetched video, rAF lerp that rests, gated seeks,
   DOM writes on change only. Falls back to the designed still at the five
   gates: file://, fetch failure, reduced motion, small/touch screens, video
   error. The page stays complete without the video. */
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  var stage = document.querySelector(".hero-stage");
  var video = document.getElementById("heroVideo");
  var poster = document.querySelector(".hero-poster");
  var loader = document.querySelector(".hero-loader");
  var settle = document.querySelector(".hero-settle");
  var hint = document.querySelector(".hero-scroll-hint");
  var bands = Array.prototype.slice.call(document.querySelectorAll(".hero-band"));
  if (!hero || !stage) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var small = window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
  var fileUrl = location.protocol === "file:";

  var scrubOn = false;
  var duration = 0;
  var targetT = 0;
  var shownT = -1;
  var seeking = false;
  var rafId = null;

  function staticHero() {
    if (video) video.remove();
    if (poster) poster.style.opacity = "";
    if (loader) loader.classList.add("is-done");
    hero.style.height = "260vh"; /* shorter journey, captions still pace */
  }

  function progress() {
    var rect = hero.getBoundingClientRect();
    var total = hero.offsetHeight - stage.offsetHeight;
    if (total <= 0) return 0;
    var p = -rect.top / total;
    return p < 0 ? 0 : p > 1 ? 1 : p;
  }

  /* caption bands + settle, driven by scroll progress (works with or
     without the video) */
  var bandRanges = bands.map(function (b) {
    return {
      el: b,
      from: parseFloat(b.getAttribute("data-from")),
      to: parseFloat(b.getAttribute("data-to")),
      state: -1
    };
  });
  var settleOn = false;
  var lastHint = -1;

  function paint(p) {
    for (var i = 0; i < bandRanges.length; i++) {
      var r = bandRanges[i];
      var mid = (r.from + r.to) / 2;
      var half = (r.to - r.from) / 2;
      var d = Math.abs(p - mid);
      var o = d >= half ? 0 : 1 - Math.pow(d / half, 2.2);
      var key = Math.round(o * 40);
      if (key !== r.state) {
        r.state = key;
        r.el.style.opacity = o.toFixed(3);
        /* X centering lives in the stylesheet; only drift vertically here */
        r.el.style.transform = "translateY(" + ((p - mid) * -60).toFixed(1) + "px)";
      }
    }
    var on = p >= 0.86;
    if (on !== settleOn) {
      settleOn = on;
      settle.classList.toggle("is-on", on);
    }
    var h = p < 0.04 ? 1 : 0;
    if (h !== lastHint && hint) {
      lastHint = h;
      hint.style.opacity = h ? "" : "0";
    }
  }

  /* video scrub loop */
  function tick() {
    rafId = null;
    var gap = targetT - shownT;
    if (Math.abs(gap) < 0.004) return; /* rest */
    var next = shownT + gap * 0.14;
    if (!seeking && video.readyState >= 2) {
      seeking = true;
      shownT = next;
      video.currentTime = next;
    }
    rafId = requestAnimationFrame(tick);
  }
  function wake() {
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  function onScroll() {
    var p = progress();
    paint(p);
    if (scrubOn && duration) {
      targetT = Math.min(p / 0.92, 1) * duration; /* film ends at 92% of track */
      wake();
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  if (!video || reduced || small || fileUrl || !("fetch" in window)) {
    staticHero();
    onScroll();
    return;
  }

  video.addEventListener("seeked", function () {
    seeking = false;
    wake();
  });
  video.addEventListener("error", function () {
    scrubOn = false;
    staticHero();
  });

  fetch(video.getAttribute("data-src"))
    .then(function (r) {
      if (!r.ok) throw new Error("fetch " + r.status);
      return r.blob();
    })
    .then(function (blob) {
      video.src = URL.createObjectURL(blob);
      return new Promise(function (res, rej) {
        video.addEventListener("loadedmetadata", res, { once: true });
        video.addEventListener("error", rej, { once: true });
      });
    })
    .then(function () {
      duration = video.duration - 0.06;
      video.currentTime = 0;
      shownT = 0;
      scrubOn = true;
      if (poster) poster.style.opacity = "0";
      if (loader) loader.classList.add("is-done");
      onScroll();
    })
    .catch(function () {
      staticHero();
      onScroll();
    });

  onScroll();
})();
