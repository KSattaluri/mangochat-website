document.addEventListener('DOMContentLoaded', () => {
  function isWindowsClient() {
    const uaDataPlatform =
      navigator.userAgentData && navigator.userAgentData.platform
        ? navigator.userAgentData.platform
        : '';
    const platform = navigator.platform || '';
    const ua = navigator.userAgent || '';
    return /win/i.test(uaDataPlatform) || /win/i.test(platform) || /windows/i.test(ua);
  }

  const isWindows = isWindowsClient();
  document.querySelectorAll('[data-win-download]').forEach((link) => {
    if (isWindows) return;
    link.classList.add('btn--disabled');
    link.title = 'Windows 10/11 only';
    link.setAttribute('aria-disabled', 'true');
    link.addEventListener('click', (e) => e.preventDefault());
  });

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
    const SPARKLE_LIFE = 60;

    function drawStar(sx, sy, size, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = `rgb(${accentR}, ${accentG}, ${accentB})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(sx, sy - size); ctx.lineTo(sx, sy + size);
      ctx.moveTo(sx - size, sy); ctx.lineTo(sx + size, sy);
      ctx.moveTo(sx - size * 0.35, sy - size * 0.35); ctx.lineTo(sx + size * 0.35, sy + size * 0.35);
      ctx.moveTo(sx + size * 0.35, sy - size * 0.35); ctx.lineTo(sx - size * 0.35, sy + size * 0.35);
      ctx.stroke();
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 1.5);
      grad.addColorStop(0, `rgba(${accentR}, ${accentG}, ${accentB}, ${alpha * 0.4})`);
      grad.addColorStop(1, `rgba(${accentR}, ${accentG}, ${accentB}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(sx, sy, size * 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawWaveform() {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      const speechEnergy = 0.55 + 0.45 * Math.sin(t * 1.8) * Math.sin(t * 0.7);

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

      // Center glow
      const glowSize = 2 + speechEnergy * 3;
      const grd = ctx.createRadialGradient(w / 2, cy, 0, w / 2, cy, glowSize * 4);
      grd.addColorStop(0, `rgba(${accentR}, ${accentG}, ${accentB}, ${0.3 * speechEnergy})`);
      grd.addColorStop(1, `rgba(${accentR}, ${accentG}, ${accentB}, 0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(w / 2, cy, glowSize * 4, 0, Math.PI * 2);
      ctx.fill();

      // Sparkles
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.age++;
        if (s.age > SPARKLE_LIFE) {
          sparkles.splice(i, 1);
          continue;
        }
        const progress = s.age / SPARKLE_LIFE;
        const a = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
        drawStar(s.x, s.y, s.size * (0.8 + 0.4 * Math.sin(progress * Math.PI)), a);
      }

      t += 0.018;
      requestAnimationFrame(drawWaveform);
    }

    drawWaveform();
  }

  // ── Transcript Typing Animation (Use-Case Categories) ──
  const transcriptEl = document.getElementById('appTranscript');
  const categoryEl = document.getElementById('appCategory');
  if (transcriptEl && categoryEl) {
    const icons = {
      research: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M10 2.75a7.25 7.25 0 0 1 5.63 11.82l4.9 4.9a.75.75 0 0 1-1.06 1.06l-4.9-4.9A7.25 7.25 0 1 1 10 2.75m0 1.5a5.75 5.75 0 1 0 0 11.5a5.75 5.75 0 0 0 0-11.5"/></svg>',
      productivity: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7.43 2.24a.75.75 0 0 1 .7-.49h5.62a.75.75 0 0 1 .67 1.08L11.66 8.25h4.09a.75.75 0 0 1 .57 1.23l-8.75 10.25a.75.75 0 0 1-1.31-.71L8.38 12.5H5.75a.75.75 0 0 1-.68-1.06z"/></svg>',
      coding: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8.07 18.94a.75.75 0 0 1-1.06-.06l-5.25-5.62a.75.75 0 0 1 0-1.02l5.25-5.63a.75.75 0 1 1 1.1 1.03L3.2 12.5l4.9 4.86a.75.75 0 0 1 .06 1.06zm7.86 0a.75.75 0 0 0 1.06-.06l5.25-5.62a.75.75 0 0 0 0-1.02l-5.25-5.63a.75.75 0 1 0-1.1 1.03l4.9 4.86l-4.9 4.86a.75.75 0 0 0-.06 1.06z"/></svg>'
    };

    const categories = [
      {
        label: 'Research',
        icon: icons.research,
        items: [
          { text: 'Speak Thoughts' },
          { text: '...Brain dump' },
          { text: 'Collaborate with AI' },
          { text: 'ACCELERATE!' }
        ]
      },
      {
        label: 'Productivity',
        icon: icons.productivity,
        items: [
          { prefix: 'Open ', suffixes: ['Github', 'Youtube'] },
          { prefix: 'Launch ', suffixes: ['Claude', 'Codex'] }
        ]
      },
      {
        label: 'Coding',
        icon: icons.coding,
        items: [
          { prefix: 'Interact with ', suffixes: ['Codex', 'Claude', 'Cursor', 'VS Code'] }
        ]
      }
    ];

    const CHAR_DELAY = 15;
    const PAUSE_BEFORE_CATEGORY = 1000;

    let cursor = null;
    let textNode = null;

    function ensureCursor() {
      if (!cursor || !cursor.parentElement) {
        cursor = document.createElement('span');
        cursor.className = 'visualizer__cursor';
      }
      transcriptEl.appendChild(cursor);
    }

    function blinkTwice(onDone) {
      if (cursor && cursor.parentElement) {
        cursor.style.animation = 'none';
        cursor.offsetHeight;
        cursor.style.animation = 'cursorBlink 0.8s step-end 2';
      }
      setTimeout(onDone, 1600);
    }

    function typeString(str, onDone) {
      let i = 0;
      function next() {
        if (i < str.length) {
          if (cursor && cursor.parentElement) cursor.remove();
          if (!textNode || !textNode.parentElement) {
            textNode = document.createTextNode('');
            transcriptEl.appendChild(textNode);
          }
          textNode.textContent += str[i];
          ensureCursor();
          i++;
          setTimeout(next, CHAR_DELAY + Math.random() * 8);
        } else {
          onDone();
        }
      }
      next();
    }

    function eraseChars(count, onDone) {
      let remaining = count;
      function next() {
        if (remaining > 0 && textNode && textNode.textContent.length > 0) {
          textNode.textContent = textNode.textContent.slice(0, -1);
          remaining--;
          setTimeout(next, CHAR_DELAY * 0.6);
        } else {
          onDone();
        }
      }
      next();
    }

    function clearTranscript() {
      transcriptEl.innerHTML = '';
      textNode = null;
    }

    function setCategory(label, icon, onDone) {
      categoryEl.classList.add('fade-out');
      setTimeout(() => {
        categoryEl.innerHTML = icon + ' ' + label;
        categoryEl.classList.remove('fade-out');
        onDone();
      }, 200);
    }

    function runCategory(catIdx, onDone) {
      const cat = categories[catIdx];
      setCategory(cat.label, cat.icon, () => {
        runItems(cat.items, 0, onDone);
      });
    }

    function runItems(items, idx, onDone) {
      if (idx >= items.length) { onDone(); return; }
      const item = items[idx];
      const isLast = idx === items.length - 1;

      if (item.text) {
        clearTranscript();
        ensureCursor();
        typeString(item.text, () => {
          blinkTwice(() => {
            if (isLast) {
              onDone();
            } else {
              runItems(items, idx + 1, onDone);
            }
          });
        });
      } else if (item.prefix && item.suffixes) {
        clearTranscript();
        ensureCursor();
        typeString(item.prefix, () => {
          runSuffixes(item.suffixes, 0, () => {
            if (isLast) {
              onDone();
            } else {
              blinkTwice(() => {
                runItems(items, idx + 1, onDone);
              });
            }
          });
        });
      }
    }

    function runSuffixes(suffixes, idx, onDone) {
      if (idx >= suffixes.length) { onDone(); return; }
      typeString(suffixes[idx], () => {
        blinkTwice(() => {
          if (idx < suffixes.length - 1) {
            eraseChars(suffixes[idx].length, () => {
              runSuffixes(suffixes, idx + 1, onDone);
            });
          } else {
            onDone();
          }
        });
      });
    }

    const TAGLINE = 'Upgrade workflow for AI';
    const TAGLINE_PAUSE = 1500;
    const IS_MOBILE = window.matchMedia('(max-width: 768px)').matches;

    function showTagline(onDone) {
      clearTranscript();
      categoryEl.classList.add('fade-out');
      setTimeout(() => {
        categoryEl.textContent = '';
        categoryEl.classList.remove('fade-out');
        transcriptEl.classList.add('visualizer__transcript--tagline');
        if (IS_MOBILE) {
          transcriptEl.textContent = TAGLINE;
          setTimeout(() => {
            transcriptEl.classList.remove('visualizer__transcript--tagline');
            clearTranscript();
            onDone();
          }, TAGLINE_PAUSE);
          return;
        }
        ensureCursor();
        typeString(TAGLINE, () => {
          setTimeout(() => {
            transcriptEl.classList.remove('visualizer__transcript--tagline');
            clearTranscript();
            onDone();
          }, TAGLINE_PAUSE);
        });
      }, 200);
    }

    function loop(catIdx) {
      runCategory(catIdx, () => {
        setTimeout(() => {
          clearTranscript();
          if (catIdx === categories.length - 1) {
            showTagline(() => loop(0));
          } else {
            loop(catIdx + 1);
          }
        }, PAUSE_BEFORE_CATEGORY);
      });
    }

    ensureCursor();
    setTimeout(() => loop(0), 300);
  }

  // ── Step Carousel ──
  const carousel = document.getElementById('stepCarousel');
  if (carousel) {
    const steps = carousel.querySelectorAll('.carousel__step');
    const dots = carousel.querySelectorAll('.carousel__dot');
    let current = 0;

    setInterval(() => {
      const prev = current;
      current = (current + 1) % steps.length;

      steps[prev].classList.remove('active');
      steps[prev].classList.add('exit');
      dots[prev].classList.remove('active');

      steps[current].classList.add('active');
      dots[current].classList.add('active');

      setTimeout(() => {
        steps[prev].classList.remove('exit');
      }, 400);
    }, 1500);
  }

  // ── Scroll Reveal ──
  const revealTargets = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    revealTargets.forEach(el => observer.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('visible'));
  }
});

