// Shared motion + media utilities for the portal

// Safety net for .reveal content. Cards start at opacity:0 and only get
// their "in" class from initReveal()/staggerIn(), which every page calls at
// the tail end of its Firestore data-loading chain. Two things can leave
// that class never applied, so the page stays blank:
//  1) an earlier, unguarded await in that chain throws (e.g. a slow/failed
//     network request right after login) and the code never reaches the
//     reveal call at all.
//  2) on some mobile browsers, IntersectionObserver's first intersection
//     check is deferred until the next scroll/touch-driven layout pass, so
//     already-on-screen cards don't get marked "in" until the user taps.
// Either way, force everything visible after a short delay so the page
// never depends on a touch/scroll to stop looking blank.
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    setTimeout(() => {
      document.querySelectorAll(".reveal:not(.in)").forEach((el) => el.classList.add("in"));
    }, 2500);
  });
}

/** Reveal elements with a staggered fade/slide-up as they enter view (or immediately on load for above-the-fold). */
export function initReveal(root = document) {
  const items = Array.from(root.querySelectorAll(".reveal"));
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = Number(el.dataset.delay || 0);
          el.style.animationDelay = `${delay}ms`;
          el.classList.add("in");
          io.unobserve(el);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((el) => io.observe(el));
}

/** Apply a staggered reveal delay to a NodeList/array of freshly-inserted elements, then trigger reveal. */
export function staggerIn(elements, stepMs = 60) {
  Array.from(elements).forEach((el, i) => {
    el.classList.add("reveal");
    el.dataset.delay = i * stepMs;
  });
  initReveal(document.body);
}

/** Confetti burst — bold & playful celebration for clock-ins / badge unlocks. */
let confettiCanvas, confettiCtx, confettiParticles = [], confettiRAF = null;
function ensureCanvas() {
  if (confettiCanvas) return;
  confettiCanvas = document.createElement("canvas");
  confettiCanvas.id = "confettiCanvas";
  document.body.appendChild(confettiCanvas);
  confettiCtx = confettiCanvas.getContext("2d");
  const resize = () => {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);
}

export function confettiBurst({ x, y, count = 60, colors = ["#C9A84C", "#E2C472", "#FF8A3D", "#4FC3F7", "#82E0AA"] } = {}) {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  ensureCanvas();
  const originX = x ?? window.innerWidth / 2;
  const originY = y ?? window.innerHeight / 2;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    confettiParticles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      size: 5 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 20,
      life: 0,
      maxLife: 70 + Math.random() * 40,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    });
  }
  if (!confettiRAF) tickConfetti();
}

function tickConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles.forEach((p) => {
    p.vy += 0.18; // gravity
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life++;
    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    confettiCtx.save();
    confettiCtx.globalAlpha = alpha;
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rot * Math.PI) / 180);
    confettiCtx.fillStyle = p.color;
    if (p.shape === "rect") {
      confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else {
      confettiCtx.beginPath();
      confettiCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      confettiCtx.fill();
    }
    confettiCtx.restore();
  });
  confettiParticles = confettiParticles.filter((p) => p.life < p.maxLife);
  if (confettiParticles.length) {
    confettiRAF = requestAnimationFrame(tickConfetti);
  } else {
    confettiRAF = null;
  }
}

/** Toast helper — expects a <div id="toast"> in the page. */
export function showToast(msg, type = "success", iconSvg = "") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.innerHTML = `${iconSvg}<span>${msg}</span>`;
  t.className = `toast show ${type}`;
  clearTimeout(t._hideTimer);
  t._hideTimer = setTimeout(() => (t.className = "toast"), 3500);
}

/** Compress + center-crop an image file to a square Blob for profile photos. */
export function imageToSquareBlob(file, size = 480, quality = 0.86) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load image."));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not process image."))), "image/jpeg", quality);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/** Simple modal open/close helper. */
export function openModal(id) {
  document.getElementById(id)?.classList.add("show");
  document.body.style.overflow = "hidden";
}
export function closeModal(id) {
  document.getElementById(id)?.classList.remove("show");
  document.body.style.overflow = "";
}
