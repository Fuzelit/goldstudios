/* ==========================================================
   GOLD — interaction layer
   Vanilla JavaScript only. No external animation library needed.
   ========================================================== */

(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ---------- Lenis Smooth Scrolling ---------- */
  if (typeof Lenis !== 'undefined' && !prefersReducedMotion) {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth, premium easing
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  /* ---------- Preloader + load reveal ---------- */
  const preloader = $('#preloader');
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader?.classList.add('loaded');
      $$('.reveal-on-load').forEach((el) => el.classList.add('visible'));
    }, prefersReducedMotion ? 0 : 450);
  });

  /* ---------- Custom cursor + spotlight ---------- */
  const cursor = $('#cursor');
  const follower = $('#cursorFollower');
  const spotlight = $('#spotlight');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let followerX = mouseX;
  let followerY = mouseY;

  if (!isTouch && !prefersReducedMotion) {
    window.addEventListener('mousemove', (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (cursor) cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      if (spotlight) spotlight.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    }, { passive: true });

    const animateCursor = () => {
      followerX += (mouseX - followerX) * 0.14;
      followerY += (mouseY - followerY) * 0.14;
      if (follower) follower.style.transform = `translate(${followerX}px, ${followerY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateCursor);
    };
    animateCursor();

    $$('a, button, input, textarea, select, summary').forEach((el) => {
      el.addEventListener('mouseenter', () => follower?.classList.add('is-active'));
      el.addEventListener('mouseleave', () => follower?.classList.remove('is-active'));
    });
  }

  /* ---------- Hero Interactive Canvas (Gold Dust) ---------- */
  const canvas = $('#heroCanvas');
  if (canvas && !isTouch && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = document.querySelector('.hero').offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 1.5 + 0.5;
        this.baseAlpha = Math.random() * 0.5 + 0.1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse interaction
        // Adjust mouse tracking accounting for scroll since canvas is absolute to section
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const localMouseY = mouseY + scrollY;

        const dx = mouseX - this.x;
        const dy = localMouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Repel effect
        if (distance < 120) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (120 - distance) / 120;
          this.x -= forceDirectionX * force * 2;
          this.y -= forceDirectionY * force * 2;
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 151, 58, ${this.baseAlpha})`;
        ctx.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < 80; i++) particles.push(new Particle());

    const animateParticles = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Connect particles with lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(200, 151, 58, ${0.15 - dist/100 * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animateParticles);
    };
    animateParticles();
  }

  /* ---------- Navbar, scroll progress, active links ---------- */
  const navbar = $('#navbar');
  const scrollProgress = $('#scrollProgress');
  const navLinks = $$('.nav-links a');
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const updateScrollUI = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? (y / max) * 100 : 0;

    navbar?.classList.toggle('scrolled', y > 24);
    if (scrollProgress) scrollProgress.style.width = `${progress}%`;

    let activeId = '';
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 140 && rect.bottom >= 140) activeId = section.id;
    });

    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
    });
  };

  updateScrollUI();
  window.addEventListener('scroll', updateScrollUI, { passive: true });

  /* ---------- Mobile menu ---------- */
  const navToggle = $('#navToggle');
  const mobileMenu = $('#mobileMenu');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    navToggle?.classList.toggle('active', open);
    navToggle?.setAttribute('aria-expanded', String(open));
    mobileMenu?.classList.toggle('open', open);
    mobileMenu?.setAttribute('aria-hidden', String(!open));
  };

  navToggle?.addEventListener('click', () => setMenu(!mobileMenu?.classList.contains('open')));
  $$('#mobileMenu a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });

  /* ---------- Scroll reveal ---------- */
  const revealElements = $$('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -70px 0px' });

    revealElements.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index % 4, 3) * 0.08}s`;
      observer.observe(el);
    });
  } else {
    revealElements.forEach((el) => el.classList.add('visible'));
  }

  /* ---------- Animated counters ---------- */
  const counters = $$('.count');
  const animateCount = (counter) => {
    const target = Number(counter.dataset.target || 0);
    const duration = prefersReducedMotion ? 0 : 1200;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.round(target * eased).toString();
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((counter) => countObserver.observe(counter));
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- 3D tilt cards ---------- */
  if (!isTouch && !prefersReducedMotion) {
    $$('.tilt-card').forEach((card) => {
      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  if (!isTouch && !prefersReducedMotion) {
    $$('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (event) => {
        const rect = el.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---------- Capability rows ---------- */
  const capabilityRows = $$('.capability-row');
  capabilityRows.forEach((row) => {
    row.addEventListener('click', () => {
      capabilityRows.forEach((item) => item.classList.remove('active'));
      row.classList.add('active');
    });
  });

  /* ---------- Contact form demo ---------- */
  const contactForm = $('#contactForm');
  const formNote = $('#formNote');

  contactForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const type = String(formData.get('type') || '').trim();
    const message = String(formData.get('message') || '').trim();

    if (!name || !email || !type || !message) {
      if (formNote) {
        formNote.textContent = 'Complete all fields before sending.';
        formNote.className = 'form-note error';
      }
      return;
    }

    const subject = encodeURIComponent(`New Gold project brief — ${type}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nProject type: ${type}\n\nProject brief:\n${message}`
    );

    if (formNote) {
      formNote.textContent = 'Email draft prepared. Replace hello@goldstudio.com with your real inbox before launch.';
      formNote.className = 'form-note success';
    }

    window.location.href = `mailto:hello@goldstudio.com?subject=${subject}&body=${body}`;
  });
})();