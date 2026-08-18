/* Auto-playing hero. The film starts by itself (muted, half speed so the
   captions read comfortably), captions fade in and out on the film's clock,
   and the settle state arrives as the stone cools. Falls back to the
   designed still when the video can't load, decode, or autoplay, under
   reduced motion, or on file:// where fetch is blocked. The page stays
   complete without the video. */
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  var video = document.getElementById("heroVideo");
  var poster = document.querySelector(".hero-poster");
  var loader = document.querySelector(".hero-loader");
  var settle = document.querySelector(".hero-settle");
  var hint = document.querySelector(".hero-scroll-hint");
  var bands = Array.prototype.slice.call(document.querySelectorAll(".hero-band"));
  if (!hero || !settle) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fileUrl = location.protocol === "file:";

  var RATE = 0.5;        /* half speed: ~12s of film for 6s of footage */
  var SETTLE_AT = 5.15;  /* media seconds; the stone has cooled by here */

  var bandRanges = bands.map(function (b) {
    return {
      el: b,
      from: parseFloat(b.getAttribute("data-from")),
      to: parseFloat(b.getAttribute("data-to")),
      state: -1
    };
  });

  var settled = false;
  function showSettle() {
    if (settled) return;
    settled = true;
    settle.classList.add("is-on");
    if (hint) hint.style.opacity = "";
    bandRanges.forEach(function (r) { r.el.style.opacity = "0"; });
  }

  function staticHero() {
    if (video) video.remove();
    if (poster) poster.style.opacity = "";
    if (loader) loader.classList.add("is-done");
    showSettle();
  }

  if (hint) hint.style.opacity = "0"; /* appears with the settle */

  if (!video || reduced || fileUrl || !("fetch" in window)) {
    staticHero();
    return;
  }

  var rafId = null;
  function paint() {
    rafId = null;
    var t = video.currentTime;
    for (var i = 0; i < bandRanges.length; i++) {
      var r = bandRanges[i];
      var mid = (r.from + r.to) / 2;
      var half = (r.to - r.from) / 2 + 0.35; /* soft shoulders */
      var d = Math.abs(t - mid);
      var o = d >= half ? 0 : 1 - Math.pow(d / half, 2.4);
      var key = Math.round(o * 40);
      if (key !== r.state) {
        r.state = key;
        r.el.style.opacity = o.toFixed(3);
        r.el.style.transform = "translateY(" + ((t - mid) * -14).toFixed(1) + "px)";
      }
    }
    if (t >= SETTLE_AT) { showSettle(); return; }
    rafId = requestAnimationFrame(paint);
  }

  video.addEventListener("error", staticHero);
  video.addEventListener("ended", showSettle);

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
      video.playbackRate = RATE;
      return video.play();
    })
    .then(function () {
      if (poster) poster.style.opacity = "0";
      if (loader) loader.classList.add("is-done");
      rafId = requestAnimationFrame(paint);
    })
    .catch(staticHero);
})();
