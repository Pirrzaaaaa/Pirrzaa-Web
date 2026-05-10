/* ============================================
   PORTFOLIO — v2 (Mobile-Optimized Interactions)
   ============================================ */

(() => {
  'use strict';

  // ---------- Device Capability Detection ----------
  const hasHover = window.matchMedia('(hover: hover)').matches;
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Estimate low-end devices
  const isLowEnd = (() => {
    if (prefersReduced) return true;
    const mem = navigator.deviceMemory; // GB (Chrome only)
    const cores = navigator.hardwareConcurrency || 4;
    const isMobile = !hasHover || window.innerWidth < 820;
    if (typeof mem === 'number' && mem <= 3) return true;
    if (isMobile && cores <= 4) return true;
    return false;
  })();

  if (isLowEnd) document.body.classList.add('low-end');

  // ---------- Loader ----------
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    setTimeout(() => loader?.classList.add('done'), 700);
  });

  // ---------- Year ----------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Custom Cursor (DESKTOP ONLY, not low-end) ----------
  if (hasHover && isDesktop && !isLowEnd) {
    document.body.classList.add('has-cursor');
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursorFollower');

    if (cursor && follower) {
      let mx = window.innerWidth / 2;
      let my = window.innerHeight / 2;
      let fx = mx, fy = my;

      document.addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;
        cursor.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      }, { passive: true });

      const loop = () => {
        fx += (mx - fx) * 0.14;
        fy += (my - fy) * 0.14;
        follower.style.transform = `translate3d(${fx}px, ${fy}px, 0) translate(-50%, -50%)`;
        requestAnimationFrame(loop);
      };
      loop();

      document.querySelectorAll('[data-hover]').forEach((el) => {
        el.addEventListener('mouseenter', () => {
          cursor.classList.add('hover');
          follower.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
          cursor.classList.remove('hover');
          follower.classList.remove('hover');
        });
      });
    }
  }

  // ---------- Navigation ----------
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-link');

  let lastScroll = 0;
  let rafScroll = false;
  const onScroll = () => {
    if (rafScroll) return;
    rafScroll = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (nav) nav.classList.toggle('scrolled', y > 20);
      // active section highlight
      const scrollPos = y + 120;
      document.querySelectorAll('section[id]').forEach((sec) => {
        const top = sec.offsetTop;
        const h = sec.offsetHeight;
        const id = sec.id;
        if (scrollPos >= top && scrollPos < top + h) {
          links.forEach((l) => l.classList.remove('active'));
          document.querySelector(`.nav-link[href="#${id}"]`)?.classList.add('active');
        }
      });
      lastScroll = y;
      rafScroll = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  navToggle?.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navLinks?.classList.toggle('open');
  });

  links.forEach((l) => {
    l.addEventListener('click', () => {
      navToggle?.classList.remove('open');
      navLinks?.classList.remove('open');
    });
  });

  // ---------- Reveal on Scroll ----------
  const revealEls = document.querySelectorAll('.reveal, .reveal-text');
  revealEls.forEach((el) => {
    const delay = el.getAttribute('data-delay') || 0;
    el.style.setProperty('--delay', isLowEnd ? Math.min(delay, 200) : delay);
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));

    // Skill bars
    const skillIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const card = entry.target;
            const fill = card.querySelector('.skill-fill');
            const lvl = fill?.getAttribute('data-level') || 80;
            if (fill) fill.style.setProperty('--level', lvl + '%');
            card.classList.add('in-view');
            skillIO.unobserve(card);
          }
        });
      },
      { threshold: 0.25 }
    );
    document.querySelectorAll('.skill-card').forEach((c) => skillIO.observe(c));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  // ---------- Counter Animation ----------
  const counters = document.querySelectorAll('.stat-num');
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const duration = isLowEnd ? 900 : 1600;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * target);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const countIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateCounter(e.target);
            countIO.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => countIO.observe(c));
  }

  // ---------- Typed Effect ----------
  const typedEl = document.getElementById('typed');
  if (typedEl) {
    const phrases = [
      'Building delightful UIs.',
      'Designing smooth interactions.',
      'Crafting fast websites.',
      'Turning ideas into pixels.',
    ];
    let pi = 0, ci = 0, deleting = false;

    const typeLoop = () => {
      const current = phrases[pi];
      if (!deleting) {
        typedEl.textContent = current.slice(0, ++ci);
        if (ci === current.length) {
          deleting = true;
          setTimeout(typeLoop, 1800);
          return;
        }
      } else {
        typedEl.textContent = current.slice(0, --ci);
        if (ci === 0) {
          deleting = false;
          pi = (pi + 1) % phrases.length;
        }
      }
      setTimeout(typeLoop, deleting ? 35 : 60);
    };
    setTimeout(typeLoop, 1000);
  }

  // ---------- Parallax (DESKTOP ONLY, not low-end) ----------
  if (hasHover && isDesktop && !isLowEnd) {
    const orbs = document.querySelectorAll('.bg-orb');
    if (orbs.length) {
      let ticking = false;
      window.addEventListener(
        'mousemove',
        (e) => {
          if (ticking) return;
          ticking = true;
          requestAnimationFrame(() => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            orbs.forEach((orb, i) => {
              const depth = (i + 1) * 12;
              orb.style.transform = `translate3d(${x * depth}px, ${y * depth}px, 0)`;
            });
            ticking = false;
          });
        },
        { passive: true }
      );
    }
  }

  // ---------- Smooth Anchor Scroll ----------
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
