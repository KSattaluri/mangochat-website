document.addEventListener('DOMContentLoaded', () => {

  // ── Active Nav Highlighting ──
  const sections = document.querySelectorAll('.g-section');
  const navLinks = document.querySelectorAll('.guide__link[data-section]');

  function updateActiveNav() {
    let currentId = '';
    const threshold = 140;

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= threshold) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      const isActive = link.getAttribute('data-section') === currentId;
      link.classList.toggle('active', isActive);
    });

    // Auto-scroll the active nav link into view on mobile
    const activeLink = document.querySelector('.guide__link.active');
    if (activeLink && window.innerWidth <= 768) {
      activeLink.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
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

  // ── Screenshot Carousel ──
  const carousel = document.querySelector('.g-carousel');
  if (carousel) {
    const track = carousel.querySelector('.g-carousel__track');
    const slides = track.querySelectorAll('.g-carousel__slide');
    const prevBtn = carousel.querySelector('.g-carousel__arrow--prev');
    const nextBtn = carousel.querySelector('.g-carousel__arrow--next');
    const dotsContainer = carousel.querySelector('.g-carousel__dots');
    let current = 0;
    const total = slides.length;

    // Build dots
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.className = 'g-carousel__dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to screenshot ' + (i + 1));
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }
    const dots = dotsContainer.querySelectorAll('.g-carousel__dot');

    function goTo(index) {
      current = Math.max(0, Math.min(index, total - 1));
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
      prevBtn.disabled = current === 0;
      nextBtn.disabled = current === total - 1;
    }

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));
    goTo(0);

    // Keyboard navigation
    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { goTo(current - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { goTo(current + 1); e.preventDefault(); }
    });

    // Touch / swipe support
    let touchStartX = 0;
    let touchDelta = 0;
    let isSwiping = false;

    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchDelta = 0;
      isSwiping = true;
      track.style.transition = 'none';
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
      if (!isSwiping) return;
      touchDelta = e.touches[0].clientX - touchStartX;
      const offset = -(current * 100) + (touchDelta / carousel.offsetWidth) * 100;
      track.style.transform = 'translateX(' + offset + '%)';
    }, { passive: true });

    carousel.addEventListener('touchend', () => {
      if (!isSwiping) return;
      isSwiping = false;
      track.style.transition = '';
      const threshold = carousel.offsetWidth * 0.2;
      if (touchDelta > threshold) goTo(current - 1);
      else if (touchDelta < -threshold) goTo(current + 1);
      else goTo(current);
    });
  }

  // ── Lightbox ──
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');

  if (lightbox) {
    // Open on any carousel image click
    document.querySelectorAll('.g-carousel__slide img, .g-carousel__duo-item img').forEach(img => {
      img.addEventListener('click', () => {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('open');
      });
    });

    function closeLightbox() {
      lightbox.classList.remove('open');
    }

    lightbox.addEventListener('click', (e) => {
      if (e.target !== lightboxImg) closeLightbox();
    });

    lightbox.querySelector('.g-lightbox__close').addEventListener('click', closeLightbox);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
    });
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
