document.addEventListener('DOMContentLoaded', () => {

  // ── Active Nav Highlighting ──
  const sections = document.querySelectorAll('.g-section');
  const navLinks = document.querySelectorAll('.guide__link[data-section]');

  function updateActiveNav() {
    const scrollY = window.scrollY + 100;
    let currentId = '';

    sections.forEach(section => {
      if (section.offsetTop + section.offsetParent.offsetTop <= scrollY) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-section') === currentId);
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  // ── Waveform Visualizer ──
  const canvas = document.getElementById('waveformCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    function sizeCanvas() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }
    sizeCanvas();
    window.addEventListener('resize', () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      sizeCanvas();
    });

    let t = 0;
    const accentR = 196, accentG = 138, accentB = 63;
    const sparkles = [];
    const SPARKLE_LIFE = 60; // frames (~1 second)

    function getWaveY(x, w, h, cy, speechEnergy) {
      const nx = x / w;
      const envelope = Math.sin(nx * Math.PI);
      const amp = envelope * speechEnergy * (h * 0.38);
      return cy
        + Math.sin(x * 0.035 - t * 3.2) * amp * 0.55
        + Math.sin(x * 0.065 - t * 4.8) * amp * 0.3
        + Math.sin(x * 0.12 - t * 2.1) * amp * 0.15;
    }

    function drawStar(cx, cy, size, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `rgb(${accentR}, ${accentG}, ${accentB})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(cx, cy - size); ctx.lineTo(cx, cy + size);
      ctx.moveTo(cx - size, cy); ctx.lineTo(cx + size, cy);
      ctx.moveTo(cx - size * 0.35, cy - size * 0.35); ctx.lineTo(cx + size * 0.35, cy + size * 0.35);
      ctx.moveTo(cx + size * 0.35, cy - size * 0.35); ctx.lineTo(cx - size * 0.35, cy + size * 0.35);
      ctx.stroke();
      // center glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 1.5);
      grad.addColorStop(0, `rgba(${accentR}, ${accentG}, ${accentB}, ${alpha * 0.4})`);
      grad.addColorStop(1, `rgba(${accentR}, ${accentG}, ${accentB}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawWaveform() {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      const speechEnergy = 0.55 + 0.45 * Math.sin(t * 1.8) * Math.sin(t * 0.7);

      // Draw waves and detect peaks on the front layer
      for (let layer = 0; layer < 3; layer++) {
        const alpha = (0.5 - layer * 0.13) * speechEnergy;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${accentR}, ${accentG}, ${accentB}, ${alpha})`;
        ctx.lineWidth = 2 - layer * 0.5;

        let prevY = null, prevPrevY = null, prevX = 0;
        for (let x = 0; x <= w; x += 1.5) {
          const nx = x / w;
          const envelope = Math.sin(nx * Math.PI);
          const amp = envelope * speechEnergy * (h * 0.38);
          const y = cy
            + Math.sin(x * 0.035 - t * 3.2 + layer * 1.8) * amp * 0.55
            + Math.sin(x * 0.065 - t * 4.8 + layer * 0.9) * amp * 0.3
            + Math.sin(x * 0.12 - t * 2.1 + layer * 3.2) * amp * 0.15;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);

          // Detect peaks on layer 0 only
          if (layer === 0 && prevY !== null && prevPrevY !== null) {
            const dist = Math.abs(prevY - cy);
            const isPeak = (prevY < prevPrevY && prevY < y) || (prevY > prevPrevY && prevY > y);
            if (isPeak && dist > h * 0.12 && Math.random() < 0.08) {
              sparkles.push({ x: prevX, y: prevY, age: 0, size: 2 + Math.random() * 2 });
            }
          }
          prevPrevY = prevY;
          prevY = y;
          prevX = x;
        }
        ctx.stroke();
      }

      // Draw and age sparkles
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.age++;
        if (s.age > SPARKLE_LIFE) {
          sparkles.splice(i, 1);
          continue;
        }
        const progress = s.age / SPARKLE_LIFE;
        const alpha = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
        drawStar(s.x, s.y, s.size * (0.8 + 0.4 * Math.sin(progress * Math.PI)), alpha);
      }

      t += 0.018;
      requestAnimationFrame(drawWaveform);
    }

    drawWaveform();
  }

  // ── FAQ Accordion ──
  document.querySelectorAll('.g-faq__q').forEach(button => {
    button.addEventListener('click', () => {
      const faq = button.parentElement;
      const wasOpen = faq.classList.contains('open');

      // Close all
      document.querySelectorAll('.g-faq.open').forEach(item => {
        item.classList.remove('open');
      });

      if (!wasOpen) faq.classList.add('open');
    });
  });
});
