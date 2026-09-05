/* Wheel Pilots — interactions */
(function () {
  'use strict';

  const nav        = document.getElementById('nav');
  const burger     = document.getElementById('navBurger');
  const mobileNav  = document.getElementById('mobileNav');
  const dialSvg    = document.querySelector('.dial__progress');
  const dialNum    = document.querySelector('.dial__number');
  const stickyCta  = document.getElementById('stickyCta');

  /* ---------- nav: appear on scroll ---------- */
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');

    /* Sticky CTA visibility — показываем после hero, скрываем у формы */
    if (stickyCta) {
      const heroH = nav.offsetHeight + 480; /* после hero-секции */
      const orderTop = document.getElementById('order');
      const inOrderZone = orderTop ? window.scrollY + window.innerHeight > orderTop.offsetTop + 100 : false;
      const shouldShow = window.scrollY > heroH && !inOrderZone;
      stickyCta.classList.toggle('is-visible', shouldShow);
    }
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
    '.section__head, .compat__card, .compat__help, .model__item, .specs__row, .step, .review, .faq__item, .scenario, .order__head, .order__form, .footer__inner, .install__video, .reviews-trust, .specs__compare'
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
    const targetVal = parseInt(dialNum.textContent, 10) || 45;
    const totalLen = 691;
    dialSvg.style.strokeDashoffset = totalLen;

    const dialObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const pct = targetVal / 60;
          const offset = totalLen * (1 - pct);
          dialSvg.style.strokeDashoffset = offset;

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

  /* ---------- phone mask +7 (___) ___-__-__ ---------- */
  const maskPhone = (raw) => {
    const digits = (raw || '').replace(/\D/g, '').replace(/^8/, '7').slice(0, 11);
    let out = '+7';
    if (digits.length > 1) out += ' (' + digits.slice(1, 4);
    if (digits.length >= 4) out += ') ' + digits.slice(4, 7);
    if (digits.length >= 7) out += '-' + digits.slice(7, 9);
    if (digits.length >= 9) out += '-' + digits.slice(9, 11);
    return out;
  };
  document.querySelectorAll('input[data-mask="phone"]').forEach((input) => {
    input.addEventListener('input', (e) => {
      const caret = input.selectionStart;
      input.value = maskPhone(input.value);
      if (caret !== null) {
        try { input.setSelectionRange(caret, caret); } catch (_) {}
      }
      validateField(input);
    });
    input.addEventListener('blur', () => validateField(input));
  });

  /* ---------- field validation (live) ---------- */
  const validateField = (field) => {
    const wrap = field.closest('.field');
    if (!wrap) return false;
    let ok = true;
    let msg = '';
    const value = (field.value || '').trim();

    if (field.dataset.mask === 'phone') {
      const digits = value.replace(/\D/g, '');
      ok = digits.length === 11;
      if (value && !ok) msg = 'Введите полный номер из 11 цифр';
    } else if (field.required && !value) {
      ok = false;
      msg = 'Заполните поле';
    }

    wrap.classList.toggle('field--error', !ok && value.length > 0);
    wrap.classList.toggle('field--valid', ok && value.length > 0);
    const helper = wrap.querySelector('.field__helper');
    if (helper && msg) helper.textContent = msg;
    return ok;
  };

  document.querySelectorAll('[data-form-field]').forEach((f) => {
    f.addEventListener('input', () => validateField(f));
    f.addEventListener('blur', () => validateField(f));
  });

  /* ---------- form: validation + 4 состояния + mini-dial countdown ---------- */
  const form = document.querySelector('.order__form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const phone = form.querySelector('input[name="phone"]');
      const name = form.querySelector('input[name="name"]');
      const consent = form.querySelector('input[name="consent"]');
      const offer = form.querySelector('input[name="offer"]');
      const consentLabels = form.querySelectorAll('.consent');

      /* Step 3: оба согласия */
      const allConsents = [consent, offer].filter(Boolean);
      const missing = allConsents.filter((c) => !c.checked);
      if (missing.length) {
        consentLabels.forEach((label) => {
          const cb = label.querySelector('input[type="checkbox"]');
          if (cb && !cb.checked) label.classList.add('consent--error');
        });
        const firstError = form.querySelector('.consent--error');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      /* Step 1: имя + валидный телефон */
      const nameOk = name.value.trim().length > 0;
      const phoneOk = validateField(phone);
      if (!nameOk || !phoneOk) {
        if (!nameOk) validateField(name);
        (phoneOk ? null : (phone.closest('.field').scrollIntoView({ behavior: 'smooth', block: 'center' })));
        return;
      }

      /* submitting state */
      const original = btn.textContent;
      form.dataset.state = 'submitting';
      btn.disabled = true;
      btn.textContent = 'Отправляем…';

      setTimeout(() => {
        form.dataset.state = 'success';
        btn.textContent = '✓ Заявка принята';

        /* Mini-dial countdown 15:00 → 0 */
        const total = 15;
        const display = form.querySelector('[data-countdown]');
        const num = form.querySelector('.mini-dial__number');
        const progress = form.querySelector('.mini-dial__progress');
        const totalLen = 578;
        if (progress) progress.style.strokeDashoffset = '0';
        let left = total;
        const fmt = (s) => {
          const m = Math.floor(s / 60);
          const ss = String(s % 60).padStart(2, '0');
          return `${String(m).padStart(2, '0')}:${ss}`;
        };
        if (display) display.textContent = fmt(left);
        if (num) num.textContent = fmt(left);

        const tick = () => {
          left--;
          if (left < 0) {
            if (display) display.textContent = '00:00';
            if (num) num.textContent = '00:00';
            if (progress) progress.style.strokeDashoffset = String(totalLen);
            return;
          }
          if (display) display.textContent = fmt(left);
          if (num) num.textContent = fmt(left);
          if (progress) {
            const ratio = 1 - left / total;
            progress.style.strokeDashoffset = String(totalLen * (1 - ratio));
          }
          setTimeout(tick, 1000);
        };
        setTimeout(tick, 1000);

        /* Auto-reset через 20с для повторной отправки */
        setTimeout(() => {
          form.dataset.state = 'idle';
          btn.disabled = false;
          btn.textContent = original;
          form.reset();
          if (display) display.textContent = '15:00';
          if (num) num.textContent = '15:00';
          if (progress) progress.style.strokeDashoffset = '0';
          consentLabels.forEach((l) => l.classList.remove('consent--error'));
        }, 20000);
      }, 900);
    });

    /* Очистить consent-error при отметке */
    const consentBoxes = form.querySelectorAll('.consent input[type="checkbox"]');
    consentBoxes.forEach((cb) => {
      cb.addEventListener('change', () => {
        if (cb.checked) {
          const label = cb.closest('.consent');
          if (label) label.classList.remove('consent--error');
        }
      });
    });

    /* Compat-Check: карточка → preselect chair (radio) */
    document.querySelectorAll('.compat__card[data-chair]').forEach((card) => {
      card.addEventListener('click', () => {
        const chair = card.dataset.chair;
        if (!chair) return;
        const radio = form.querySelector(`input[name="chair"][value="${chair}"]`);
        if (radio) {
          radio.checked = true;
        }
      });
    });

    /* Обновление order__summary при смене варианта комплекта или типа коляски */
    const summaryScope = form.parentElement || document;
    const summary = summaryScope.querySelector('[data-summary-kit]');
    const variantInput = form.querySelector('[data-variant-input]');
    const summaryImg = summaryScope.querySelector('[data-summary-img]');
    if (summary && variantInput) {
      const summaryMap = {
        summer: 'Летний · держатель телефона в подарок',
        winter: 'Зимний · зимняя покрышка в подарок'
      };
      const tagMap = {
        summer: '☀ ЛЕТНИЙ',
        winter: '❄ ЗИМНИЙ'
      };
      /* Ключ картинки: вариант + тип коляски. Для «Не знаю» (help) — оставляем текущий chair из variantInput. */
      const composeKey = (variant, chair) => {
        const c = (chair === 'active' || chair === 'passive') ? chair : 'active';
        return `${variant}-${c}`;
      };
      const applySummary = () => {
        const variant = variantInput.value;
        if (!summaryMap[variant]) return;
        summary.textContent = summaryMap[variant];
        const tag = summaryScope.querySelector('[data-summary-tag]');
        if (tag && tagMap[variant]) tag.textContent = tagMap[variant];
        if (summaryImg) {
          try {
            const map = JSON.parse(summaryImg.dataset.summaryMap || '{}');
            const altMap = JSON.parse(summaryImg.dataset.summaryAlt || '{}');
            const chair = (form.querySelector('input[name="chair"]:checked') || {}).value || 'active';
            const key = composeKey(variant, chair);
            const nextSrc = map[key];
            const nextAlt = altMap[key];
            if (nextSrc && summaryImg.getAttribute('src') !== nextSrc) {
              summaryImg.style.opacity = '0.55';
              summaryImg.src = nextSrc;
              summaryImg.alt = nextAlt || summaryImg.alt;
              summaryImg.addEventListener('load', () => {
                summaryImg.style.opacity = '';
              }, { once: true });
            } else if (nextAlt) {
              summaryImg.alt = nextAlt;
            }
          } catch (_) { /* noop: data-summaryMap invalid */ }
        }
      };
      document.querySelectorAll('.order__variant').forEach((v) => {
        v.addEventListener('click', () => {
          const variant = v.dataset.variant;
          if (!variant || !summaryMap[variant]) return;
          variantInput.value = variant;
          applySummary();
        });
      });
      form.querySelectorAll('input[name="chair"]').forEach((r) => {
        r.addEventListener('change', applySummary);
      });
    }
  }

  /* ---------- Compat-Check short form ---------- */
  const compatForm = document.getElementById('compatHelpForm');
  if (compatForm) {
    const phoneInput = compatForm.querySelector('input[name="phone"]');
    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        phoneInput.value = maskPhone(phoneInput.value);
      });
    }
    compatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const digits = (phoneInput.value || '').replace(/\D/g, '');
      const btn = compatForm.querySelector('button');
      if (digits.length !== 11) {
        phoneInput.style.borderColor = 'var(--danger)';
        phoneInput.focus();
        return;
      }
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = '✓ Заявка отправлена';
      phoneInput.style.borderColor = 'var(--success)';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = orig;
        compatForm.reset();
        phoneInput.style.borderColor = '';
      }, 3000);
    });
  }

  /* ---------- Model thumbs (галерея) ---------- */
  document.querySelectorAll('.model__thumbs').forEach((group) => {
    const thumbs = group.querySelectorAll('.model__thumb');
    const photo = group.parentElement.querySelector('.model__photo-img');
    if (!photo) return;
    const source = photo.parentElement.querySelector('source');
    const altMap = (() => {
      try { return JSON.parse(group.dataset.thumbAltMap || '{}'); }
      catch (_) { return {}; }
    })();
    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        thumbs.forEach((t) => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
        const src = thumb.dataset.thumbSrc;
        if (!src) return;
        const alt = altMap[thumb.dataset.thumbKey || ''];
        /* Меняем source + img — иначе <picture> в некоторых браузерах может не перерендерить */
        if (source) source.srcset = src;
        if (photo.getAttribute('src') === src) return; // уже загружена эта картинка
        photo.style.opacity = '0.55';
        photo.src = src;
        photo.srcset = src;
        if (alt) photo.alt = alt;
        photo.addEventListener('load', () => {
          photo.style.opacity = '';
        }, { once: true });
      });
    });
  });

  /* ---------- FAQ: ensure only one open at a time ---------- */
  const faqs = document.querySelectorAll('.faq__item');
  faqs.forEach((f) => {
    f.addEventListener('toggle', () => {
      if (!f.open) return;
      faqs.forEach((other) => { if (other !== f) other.open = false; });
    });
  });

  /* ---------- Tabs (install + order variants) ---------- */
  function bindTabs(tabSelector, panelAttr) {
    const tabs = document.querySelectorAll(tabSelector);
    if (!tabs.length) return;
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab || tab.dataset.variant;
        if (!target) return;
        tabs.forEach((other) => {
          const active = other === tab;
          other.classList.toggle('is-active', active);
          other.setAttribute('aria-pressed', active ? 'true' : 'false');
          other.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        document.querySelectorAll(`[data-panel], [data-kit]`).forEach((p) => {
          const matches = (p.dataset.panel || p.dataset.kit) === target;
          p.classList.toggle('is-active', matches);
          if (p.hasAttribute('hidden')) {
            if (matches) p.removeAttribute('hidden');
          } else if (!matches) {
            p.setAttribute('hidden', '');
          }
        });
        if (tabSelector !== '.order__variant') {
          const input = document.querySelector('[data-variant-input]');
          if (input && tab.dataset.variant) input.value = tab.dataset.variant;
        }
      });
    });
  }
  bindTabs('.order__variant', 'kit');

  /* ---------- Parallax (hero chips) — disabled on touch & reduced-motion ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chips = document.querySelectorAll('.hero__chip');
  const visual = document.querySelector('.hero__visual');
  if (visual && chips.length && window.matchMedia('(pointer: fine)').matches && !reduceMotion) {
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

  /* ---------- Lightbox: клик по [data-zoom-src] открывает на полный экран ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox ? lightbox.querySelector('.lightbox__img') : null;
  const lightboxClose = lightbox ? lightbox.querySelector('.lightbox__close') : null;
  let lastFocus = null;

  const openLightbox = (src, alt, trigger) => {
    if (!lightbox || !lightboxImg) return;
    lastFocus = trigger || document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    lightboxClose && lightboxClose.focus();
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove('lightbox-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  document.querySelectorAll('[data-zoom-src]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(btn.dataset.zoomSrc, btn.dataset.zoomAlt, btn);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && !lightbox.hidden) closeLightbox();
  });

  /* ---------- Gallery tabs: переключение Активная / Пассивная ---------- */
  const galleryTabs = document.querySelectorAll('[data-gallery-tab]');
  const galleryPanes = document.querySelectorAll('.gallery__pane');
  if (galleryTabs.length && galleryPanes.length) {
    const panesById = {};
    galleryPanes.forEach((p) => { panesById[p.id.replace('gallery-pane-', '')] = p; });

    const activate = (id) => {
      galleryTabs.forEach((t) => {
        const on = t.dataset.galleryTab === id;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      Object.entries(panesById).forEach(([k, p]) => { p.hidden = k !== id; });
    };

    galleryTabs.forEach((tab) => {
      tab.addEventListener('click', () => activate(tab.dataset.galleryTab));
      tab.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        const list = Array.from(galleryTabs);
        const i = list.indexOf(tab);
        const next = e.key === 'ArrowLeft'
          ? list[(i - 1 + list.length) % list.length]
          : list[(i + 1) % list.length];
        next.focus();
        activate(next.dataset.galleryTab);
      });
    });
  }
})();