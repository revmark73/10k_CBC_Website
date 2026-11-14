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
  /* phone menu */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("mainNav");
  if (toggle && nav) {
    var setMenu = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  }

  var chart = document.querySelector(".chart");
  if (chart) {
    /* the page ships with real bars and figures; zero them only so they can rise */
    chart.querySelectorAll(".chart-row").forEach(function (row) {
      row.querySelector(".chart-bar").style.width = "0%";
      row.querySelector(".chart-num").firstChild.nodeValue = "$0";
    });
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
          if (reduced) { num.firstChild.nodeValue = "$" + val.toLocaleString("en-US"); return; }
          var t0 = performance.now();
          (function count(t) {
            var k = Math.min((t - t0) / 1400, 1);
            var eased = 1 - Math.pow(1 - k, 3);
            num.firstChild.nodeValue = "$" + Math.round(val * eased).toLocaleString("en-US");
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

  /* website forms, WO-36 and WO-41. Each posts to Catalyst Connect. No
     cookies, nothing kept in the browser after it is sent. A form says which
     kind it is (data-kind), which fields must be filled (data-required) and
     what to say when it lands (data-done). */
  var ENDPOINT = "https://base44.app/api/apps/6a56c72b8c54830021111967/functions/webInquiry";
  var OFFICE = "We couldn't send that just now. Please try again, or call 559-733-9070.";
  document.querySelectorAll("form.inquiry").forEach(function (form) {
    var opened = Date.now();
    var status = form.querySelector(".form-status");
    var button = form.querySelector("button[type=submit]");
    var required = (form.getAttribute("data-required") || "first_name last_name email campus").split(/\s+/);
    var say = function (text, kind) {
      status.textContent = text;
      status.className = "form-status" + (kind ? " is-" + kind : "");
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.querySelectorAll("[aria-invalid]").forEach(function (el) { el.removeAttribute("aria-invalid"); });
      var f = form.elements;
      var age = (form.querySelector("input[name=age_statement]:checked") || {}).value || "";
      if (age === "under_13") {
        say("Thanks for your interest! Because you're under 13, please ask a parent or guardian to call us at 559-733-9070.", "error");
        return;
      }
      var missing = required.filter(function (n) { return f[n] && !String(f[n].value || "").trim(); });
      if (missing.length) {
        missing.forEach(function (n) { f[n].setAttribute("aria-invalid", "true"); });
        f[missing[0]].focus();
        say("Please fill in all the required fields.", "error");
        return;
      }
      if (!age) { say("Please tell us your age group.", "error"); return; }
      var unticked = Array.prototype.filter.call(form.querySelectorAll("input[type=checkbox][required]"), function (c) { return !c.checked; });
      if (unticked.length) { unticked[0].focus(); say("Please tick the boxes at the bottom of the form.", "error"); return; }
      var payload = { kind: form.getAttribute("data-kind") || "question", open_ms: Date.now() - opened };
      Array.prototype.forEach.call(f, function (el) {
        if (!el.name || el.type === "submit") return;
        if (el.type === "checkbox") payload[el.name] = el.checked;
        else if (el.type === "radio") { if (el.checked) payload[el.name] = el.value; }
        else payload[el.name] = el.value;
      });
      payload.age_statement = age;
      button.disabled = true;
      say("Sending...");
      fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (res) {
          if (res && res.ok) {
            form.reset();
            say(form.getAttribute("data-done") || "Thank you. Your question is on its way, and someone from our team will be in touch soon.", "done");
          } else {
            say((res && res.error) || OFFICE, "error");
          }
        })
        .catch(function () { say(OFFICE, "error"); })
        .then(function () { button.disabled = false; });
    });
  });

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
