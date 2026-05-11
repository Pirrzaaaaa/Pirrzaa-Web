/* ============================================
   PORTFOLIO v3 — ULTRA SMOOTH MOBILE-FIRST
   Optimized for 2GB RAM devices
   ============================================ */

(() => {
  'use strict';

  // ========== DEVICE DETECTION ==========
  const isMobile = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLowEnd = (() => {
    if (prefersReduced) return true;
    const mem = navigator.deviceMemory;
    const cores = navigator.hardwareConcurrency || 4;
    if (typeof mem === 'number' && mem <= 3) return true;
    if (isMobile && cores <= 4) return true;
    return false;
  })();

  if (isLowEnd) document.body.classList.add('low-end');

  // ========== LOADER ==========
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.getElementById('loader')?.classList.add('done');
    }, 600);
  });

  // ========== YEAR ==========
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ========== CUSTOM CURSOR (Desktop high-end only) ==========
  if (!isMobile && !isLowEnd) {
    document.body.classList.add('desktop-cursor');
    const dot = document.getElementById('cursor');
    const ring = document.getElementById('cursorFollower');

    if (dot && ring) {
      let mx = 0, my = 0, rx = 0, ry = 0;

      document.addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      }, { passive: true });

      const tick = () => {
        rx += (mx - rx) * 0.12;
        ry += (my - ry) * 0.12;
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
        requestAnimationFrame(tick);
      };
      tick();

      document.querySelectorAll('a, button, [data-hover]').forEach((el) => {
        el.addEventListener('mouseenter', () => ring.classList.add('active'));
        el.addEventListener('mouseleave', () => ring.classList.remove('active'));
      });
    }
  }

  // ========== NAVIGATION ==========
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const menu = document.querySelector('.nav-links');
  const navLinks = document.querySelectorAll('.nav-link');

  // Scroll-aware nav (throttled)
  let scrollRaf = false;
  const onScroll = () => {
    if (scrollRaf) return;
    scrollRaf = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      nav?.classList.toggle('scrolled', y > 30);

      // Active section
      const offset = 100;
      document.querySelectorAll('section[id]').forEach((sec) => {
        const top = sec.offsetTop - offset;
        const bottom = top + sec.offsetHeight;
        if (y >= top && y < bottom) {
          navLinks.forEach((l) => l.classList.remove('active'));
          document.querySelector(`.nav-link[href="#${sec.id}"]`)?.classList.add('active');
        }
      });
      scrollRaf = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile toggle
  toggle?.addEventListener('click', () => {
    toggle.classList.toggle('open');
    menu?.classList.toggle('open');
  });
  navLinks.forEach((l) => l.addEventListener('click', () => {
    toggle?.classList.remove('open');
    menu?.classList.remove('open');
  }));

  // ========== REVEAL ON SCROLL (IntersectionObserver) ==========
  const reveals = document.querySelectorAll('.reveal, .reveal-up');

  // Set CSS custom property for stagger delay
  reveals.forEach((el) => {
    const d = el.dataset.d || 0;
    el.style.setProperty('--d', d);
  });

  if ('IntersectionObserver' in window && !prefersReduced) {
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('show');
          revealIO.unobserve(e.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -30px 0px'
    });

    reveals.forEach((el) => revealIO.observe(el));

    // Skill bar fill
    const skillCards = document.querySelectorAll('.skill-card');
    const skillIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const fill = e.target.querySelector('.skill-fill');
          const lvl = fill?.dataset.level || 80;
          fill?.style.setProperty('--level', lvl + '%');
          e.target.classList.add('in-view');
          skillIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    skillCards.forEach((c) => skillIO.observe(c));
  } else {
    // Fallback: show all immediately
    reveals.forEach((el) => el.classList.add('show'));
    document.querySelectorAll('.skill-card').forEach((c) => {
      const fill = c.querySelector('.skill-fill');
      const lvl = fill?.dataset.level || 80;
      fill?.style.setProperty('--level', lvl + '%');
      c.classList.add('in-view');
    });
  }

  // ========== COUNTER ANIMATION ==========
  const counters = document.querySelectorAll('[data-count]');
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const duration = isLowEnd ? 600 : 1400;
    const start = performance.now();
    const run = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // Ease out cubic
      const val = Math.floor((1 - Math.pow(1 - t, 3)) * target);
      el.textContent = val + '+';
      if (t < 1) requestAnimationFrame(run);
      else el.textContent = target + '+';
    };
    requestAnimationFrame(run);
  };

  if ('IntersectionObserver' in window) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCount(e.target);
          countIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((c) => countIO.observe(c));
  } else {
    counters.forEach((c) => { c.textContent = (c.dataset.count || 0) + '+'; });
  }

  // ========== TYPED EFFECT ==========
  const typedEl = document.getElementById('typed');
  if (typedEl) {
    const phrases = [
      'Building smooth mobile UIs.',
      'Designing pixel-perfect layouts.',
      'Creating delightful experiences.',
      'Optimizing for performance.',
    ];
    let phraseIdx = 0, charIdx = 0, deleting = false;

    const type = () => {
      const current = phrases[phraseIdx];
      if (!deleting) {
        typedEl.textContent = current.slice(0, ++charIdx);
        if (charIdx === current.length) {
          deleting = true;
          setTimeout(type, 2000);
          return;
        }
        setTimeout(type, 55);
      } else {
        typedEl.textContent = current.slice(0, --charIdx);
        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
        }
        setTimeout(type, 30);
      }
    };
    setTimeout(type, 800);
  }

  // ========== SMOOTH SCROLL ==========
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

})();
