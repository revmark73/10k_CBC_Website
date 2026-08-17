/* Page life: header state, reveals, cost chart, counters, ember particles.
   Everything eases; nothing snaps. Reduced motion turns the extras off. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* header */
  var header = document.querySelector(".site-header");
  var lastHead = false;
  window.addEventListener("scroll", function () {
    var on = window.scrollY > 40;
    if (on !== lastHead) {
      lastHead = on;
      header.classList.toggle("is-scrolled", on);
    }
  }, { passive: true });

  /* reveals + section triggers */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18 });
  document.querySelectorAll(".reveal, .cred, .world").forEach(function (el) { io.observe(el); });

  /* cost chart: bars rise and numbers count when seen */
  var chart = document.querySelector(".chart");
  if (chart) {
    var cio = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      cio.disconnect();
      chart.querySelectorAll(".chart-row").forEach(function (row, i) {
        var bar = row.querySelector(".chart-bar");
        var num = row.querySelector(".chart-num");
        var val = parseInt(row.getAttribute("data-value"), 10);
        var max = 163200;
        setTimeout(function () {
          bar.style.width = (val / max * 100).toFixed(1) + "%";
          if (reduced) { num.textContent = "$" + val.toLocaleString("en-US"); return; }
          var t0 = performance.now();
          (function count(t) {
            var k = Math.min((t - t0) / 1400, 1);
            var eased = 1 - Math.pow(1 - k, 3);
            num.textContent = "$" + Math.round(val * eased).toLocaleString("en-US");
            if (k < 1) requestAnimationFrame(count);
          })(t0);
        }, i * 140);
      });
    }, { threshold: 0.4 });
    cio.observe(chart);
  }

  /* one accordion open at a time */
  var faq = document.querySelector(".faq");
  if (faq) {
    faq.addEventListener("toggle", function (e) {
      if (e.target.open) {
        faq.querySelectorAll("details[open]").forEach(function (d) {
          if (d !== e.target) d.open = false;
        });
      }
    }, true);
  }

  /* ember particles, whisper level */
  if (!reduced) {
    document.querySelectorAll(".embers-canvas").forEach(function (canvas) {
      var ctx = canvas.getContext("2d");
      var w, h, parts = [], running = false;

      function size() {
        w = canvas.width = canvas.offsetWidth;
        h = canvas.height = canvas.offsetHeight;
      }
      size();
      window.addEventListener("resize", size);

      for (var i = 0; i < 22; i++) {
        parts.push({
          x: Math.random(), y: Math.random(),
          r: 0.6 + Math.random() * 1.7,
          vy: 0.10 + Math.random() * 0.3,
          vx: (Math.random() - 0.5) * 0.08,
          tw: Math.random() * Math.PI * 2
        });
      }
      function frame() {
        if (!running) return;
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.y -= p.vy / 600;
          p.x += p.vx / 600 + Math.sin(p.tw += 0.006) * 0.00012;
          if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
          var a = 0.25 + Math.sin(p.tw * 2) * 0.18;
          ctx.beginPath();
          ctx.arc(p.x * w, p.y * h, p.r, 0, 6.2832);
          ctx.fillStyle = "rgba(255,196,107," + a.toFixed(3) + ")";
          ctx.fill();
        }
        requestAnimationFrame(frame);
      }
      new IntersectionObserver(function (entries) {
        var vis = entries[0].isIntersecting;
        if (vis && !running) { running = true; frame(); }
        if (!vis) running = false;
      }, { threshold: 0.05 }).observe(canvas);
    });
  }

  /* graceful portraits: swap broken photos for monograms */
  document.querySelectorAll(".team-photo img").forEach(function (img) {
    img.addEventListener("error", function () {
      var name = img.getAttribute("alt") || "";
      var initials = name.split(/\s+/).filter(function (x) { return /^[A-Z]/.test(x); })
        .slice(0, 2).map(function (x) { return x[0]; }).join("");
      var span = document.createElement("span");
      span.className = "mono";
      span.textContent = initials || "CBC";
      img.replaceWith(span);
    });
  });
})();
