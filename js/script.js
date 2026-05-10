/* ============================================
   PORTFOLIO — PREMIUM INTERACTIONS
   ============================================ */

(() => {
  'use strict';

  // ---------- Loader ----------
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    setTimeout(() => loader?.classList.add('done'), 900);
  });

  // ---------- Year ----------
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Custom Cursor ----------
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  if (cursor && follower && window.matchMedia('(hover: hover)').matches) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let followerX = mouseX;
    let followerY = mouseY;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    const animateFollower = () => {
      followerX += (mouseX - followerX) * 0.14;
      followerY += (mouseY - followerY) * 0.14;
      follower.style.transform = `translate(${followerX}px, ${followerY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateFollower);
    };
    animateFollower();

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

    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
      follower.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      cursor.style.opacity = '1';
      follower.style.opacity = '1';
    });
  }

  // ---------- Navigation ----------
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-link');

  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
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

  // ---------- Active Section Highlight ----------
  const sections = document.querySelectorAll('section[id]');
  const setActive = () => {
    const scrollY = window.scrollY + 120;
    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.id;
      if (scrollY >= top && scrollY < top + height) {
        links.forEach((l) => l.classList.remove('active'));
        document.querySelector(`.nav-link[href="#${id}"]`)?.classList.add('active');
      }
    });
  };
  window.addEventListener('scroll', setActive, { passive: true });

  // ---------- Reveal on Scroll (IntersectionObserver) ----------
  const revealEls = document.querySelectorAll('.reveal, .reveal-text');
  revealEls.forEach((el) => {
    const delay = el.getAttribute('data-delay') || 0;
    el.style.setProperty('--delay', delay);
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
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));

    // Skill cards
    const skillCards = document.querySelectorAll('.skill-card');
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
      { threshold: 0.3 }
    );
    skillCards.forEach((c) => skillIO.observe(c));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  // ---------- Counter Animation ----------
  const counters = document.querySelectorAll('.stat-num');
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const duration = 1800;
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
      { threshold: 0.4 }
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
    setTimeout(typeLoop, 1200);
  }

  // ---------- Parallax Orbs ----------
  const orbs = document.querySelectorAll('.bg-orb');
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
          const depth = (i + 1) * 15;
          orb.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
        });
        ticking = false;
      });
    },
    { passive: true }
  );

  // ---------- Smooth Anchor Scroll ----------
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
