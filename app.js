/* MotoDrive — interactions */
(function () {
  'use strict';

  const nav        = document.getElementById('nav');
  const burger     = document.getElementById('navBurger');
  const mobileNav  = document.getElementById('mobileNav');
  const dialSvg    = document.querySelector('.dial__progress');
  const dialNum    = document.querySelector('.dial__number');

  /* ---------- nav: appear on scroll ---------- */
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile nav toggle ---------- */
  const closeMobileNav = () => {
    if (!mobileNav || !burger) return;
    mobileNav.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Открыть меню');
    document.body.style.overflow = '';
  };
  const openMobileNav = () => {
    if (!mobileNav || !burger) return;
    mobileNav.hidden = false;
    // reflow to allow transition
    void mobileNav.offsetHeight;
    mobileNav.classList.add('is-open');
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Закрыть меню');
    document.body.style.overflow = 'hidden';
  };
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      if (mobileNav.classList.contains('is-open')) closeMobileNav();
      else openMobileNav();
    });
    mobileNav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMobileNav));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) closeMobileNav();
    });
    // close on resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 880) closeMobileNav();
    });
  }

  /* ---------- smooth anchor offset ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length <= 1) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ---------- reveal on scroll (IntersectionObserver) ---------- */
  const revealTargets = document.querySelectorAll(
    '.section__head, .model__item, .specs__row, .step, .review, .faq__item, .order__head, .order__form, .footer__inner'
  );
  revealTargets.forEach((el) => el.classList.add('reveal'));

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );
  revealTargets.forEach((el) => io.observe(el));

  /* ---------- dial: animate when hero in view ---------- */
  if (dialSvg && dialNum) {
    const targetVal = parseInt(dialNum.textContent, 10) || 25;
    const totalLen = 691; // 2 * pi * 110
    dialSvg.style.strokeDashoffset = totalLen;

    const dialObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const pct = targetVal / 30; // 25 / 30 ≈ 83%
          const offset = totalLen * (1 - pct);
          dialSvg.style.strokeDashoffset = offset;

          // count up
          let current = 0;
          const step = Math.max(1, Math.round(targetVal / 60));
          const tick = () => {
            current += step;
            if (current >= targetVal) {
              dialNum.textContent = targetVal;
              return;
            }
            dialNum.textContent = current;
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          dialObserver.disconnect();
        });
      },
      { threshold: 0.4 }
    );
    dialObserver.observe(document.querySelector('.dial'));
  }

  /* ---------- form: light validation + friendly submit ---------- */
  const form = document.querySelector('.order__form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const phone = form.querySelector('input[name="phone"]');
      const name = form.querySelector('input[name="name"]');
      const consent = form.querySelector('input[name="consent"]');
      const consentLabel = form.querySelector('.consent');

      // consent must be ticked (152-ФЗ)
      if (consent && !consent.checked) {
        if (consentLabel) {
          consentLabel.classList.add('consent--error');
          consentLabel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      if (!name.value.trim() || !phone.value.trim()) {
        [name, phone].forEach((el) => {
          if (!el.value.trim()) {
            el.style.borderColor = '#FF6B1A';
            el.focus();
          }
        });
        return;
      }

      const original = btn.textContent;
      btn.textContent = 'Отправляем…';
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = '✓ Заявка принята';
        btn.style.background = '#22c55e';
        btn.style.borderColor = '#22c55e';

        setTimeout(() => {
          btn.textContent = original;
          btn.disabled = false;
          btn.style.background = '';
          btn.style.borderColor = '';
          form.reset();
        }, 2400);
      }, 900);
    });

    // clear consent error on toggle
    const consent = form.querySelector('input[name="consent"]');
    const consentLabel = form.querySelector('.consent');
    if (consent && consentLabel) {
      consent.addEventListener('change', () => {
        if (consent.checked) consentLabel.classList.remove('consent--error');
      });
    }
  }

  /* ---------- FAQ: ensure only one open at a time (optional polish) ---------- */
  const faqs = document.querySelectorAll('.faq__item');
  faqs.forEach((f) => {
    f.addEventListener('toggle', () => {
      if (!f.open) return;
      faqs.forEach((other) => { if (other !== f) other.open = false; });
    });
  });

  /* ---------- parallax for hero chips on mouse move (subtle) — desktop only ---------- */
  const chips = document.querySelectorAll('.hero__chip');
  const visual = document.querySelector('.hero__visual');
  if (visual && chips.length && window.matchMedia('(pointer: fine)').matches) {
    visual.addEventListener('mousemove', (e) => {
      const rect = visual.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      chips.forEach((chip, i) => {
        const depth = (i + 1) * 6;
        chip.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
      });
    });
    visual.addEventListener('mouseleave', () => {
      chips.forEach((chip) => (chip.style.transform = ''));
    });
  }
})();