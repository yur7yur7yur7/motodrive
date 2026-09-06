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

  /* ---------- Custom video player (gated loading + full controls) ---------- */
  const videoPlayers = new Map();

  const formatTime = (sec) => {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const s = Math.floor(sec % 60);
    const m = Math.floor(sec / 60) % 60;
    const h = Math.floor(sec / 3600);
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  };

  const parseSources = (root) => {
    /* data-player-sources='[{"label":"1080p","src":"…"},{"label":"720p","src":"…"}]' */
    const raw = root.getAttribute('data-player-sources');
    if (!raw) return null;
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr) || arr.length === 0) return null;
      return arr.filter((s) => s && s.src && s.label);
    } catch (e) {
      console.warn('video: invalid data-player-sources', e);
      return null;
    }
  };

  const setSeekFill = (player, pct) => {
    const fill = player.seek.querySelector('.vp__seek-fill');
    const thumb = player.seek.querySelector('.vp__seek-thumb');
    const p = Math.max(0, Math.min(100, pct));
    fill.style.width = p + '%';
    thumb.style.left = p + '%';
    player.seek.setAttribute('aria-valuenow', String(Math.round(p)));
  };

  const setVolumeFill = (player, vol) => {
    const v = Math.max(0, Math.min(1, vol));
    player.volume.querySelector('.vp__volume-fill').style.width = (v * 100) + '%';
    player.volume.querySelector('.vp__volume-thumb').style.left = (v * 100) + '%';
    player.volume.setAttribute('aria-valuenow', String(Math.round(v * 100)));
  };

  const updateMuteUI = (player) => {
    const muted = player.video.muted || player.video.volume === 0;
    player.root.classList.toggle('is-muted', muted);
    player.mute.setAttribute(
      'aria-label',
      muted ? 'Включить звук' : 'Выключить звук'
    );
  };

  const updatePlayUI = (player) => {
    /* playing = реально проигрывается. ended считается «остановлен»,
       paused — тоже. readyState не нужен: play/pause events приходят тогда,
       когда состояние уже корректное (video действительно играет или стоит). */
    const playing = !player.video.paused && !player.video.ended;
    player.root.classList.toggle('is-playing', playing);
    player.root.classList.toggle('is-paused', !playing);
    player.play.setAttribute('aria-label', playing ? 'Пауза' : 'Воспроизвести');
  };

  const setStatus = (player, state, msg) => {
    player.root.classList.remove('is-loading', 'is-error');
    const status = player.root.querySelector('.vp__status');
    if (state === 'loading') {
      player.root.classList.add('is-loading');
      status.textContent = 'Загрузка…';
    } else if (state === 'error') {
      player.root.classList.add('is-error');
      status.innerHTML = '<span>Видео недоступно</span><span class="vp__status-msg"></span>';
      const m = status.querySelector('.vp__status-msg');
      if (m) m.textContent = msg || 'Нажмите, чтобы попробовать снова';
    } else {
      status.textContent = '';
    }
  };

  const loadInitialSource = (player) => { ensureSource(player); };

  const tryPlay = (player) => {
    ensureSource(player);
    /* При первом ручном play (user gesture) снимаем mute — у всех плееров.
       Без этого браузер всё равно проигрывает muted, и пользователь
       слышит тишину вместо озвучки ролика. */
    player.video.muted = false;
    updateMuteUI(player);
    const fire = () => {
      const p = player.video.play();
      if (p && typeof p.then === 'function') {
        p.then(() => { setStatus(player, null); }).catch((err) => {
          if (err && err.name === 'AbortError') return;
          /* Если браузер всё-таки отказал — оставляем muted=true, чтобы
             иконка mute-состояния соответствовала реальности (нет звука),
             и не показывали "звук вкл" при фактическом отсутствии. */
          player.video.muted = true;
          updateMuteUI(player);
          const p2 = player.video.play();
          if (p2 && typeof p2.then === 'function') {
            p2.then(() => setStatus(player, null)).catch(() => setStatus(player, 'error'));
          } else {
            setStatus(player, 'error');
          }
        });
      }
    };
    if (player.video.readyState >= 2) {
      fire();
    } else {
      setStatus(player, 'loading');
      const onReady = () => { fire(); };
      player.video.addEventListener('loadeddata', onReady, { once: true });
      player.video.addEventListener('error', () => setStatus(player, 'error'), { once: true });
    }
  };

  const ensureSource = (player) => {
    if (player.video.src) return;
    if (player.sources && player.sources.length > 0) {
      const initial = player.sources.find((s) => s.default) || player.sources[0];
      player.currentQuality = initial.label;
      player.video.src = pickBestSource(player.video, initial.src);
    } else {
      player.video.src = pickBestSource(player.video, player.src);
    }
    /* До явного Play качаем только метаданные (для превью-постера).
       При play() браузер догружает поток и стартует почти мгновенно. */
    try { player.video.preload = 'metadata'; } catch (e) {}
    try { player.video.load(); } catch (e) { /* noop */ }
  };

  /* Возврат src как есть. Раньше здесь был webm/mp4 autoselect через
     canPlayType('video/webm; codecs="vp9, opus"'); отключён, потому что
     в репо только .mp4. Когда появятся .webm рядом — раскомментировать. */
  const pickBestSource = (video, src) => src;
  /* const pickBestSource = (video, src) => {
    if (!src || !/\.mp4(\?|$)/i.test(src)) return src;
    const webm = src.replace(/\.mp4(\?|$)/i, '.webm$1');
    const ok = (() => {
      try { return video.canPlayType('video/webm; codecs="vp9, opus"') !== ''; }
      catch (e) { return false; }
    })();
    return ok ? webm : src;
  }; */

  const captureFirstFrame = (player) => {
    /* Используем первый кадр видео как постер.
       Снимок делаем после loadeddata; рисуем в canvas → toDataURL → <img>. */
    const v = player.video;
    if (!player.poster) return;
    let done = false;
    const snap = () => {
      if (done) return;
      done = true;
      const rect = player.root.getBoundingClientRect();
      const w = Math.max(64, Math.min(960, Math.round(rect.width || 480)));
      const h = Math.max(64, Math.round((rect.height || w * 9 / 16)));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      try {
        ctx.drawImage(v, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        if (dataUrl && dataUrl.length > 200) player.poster.src = dataUrl;
      } catch (err) {
        /* CORS-tainted video может бросить SecurityException — игнор, оставляем статичный постер */
      }
    };
    v.addEventListener('loadeddata', snap, { once: true });
  };

  const bindSlider = (el, onChange, onCommit) => {
    let dragging = false;
    const setFromEvent = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      onChange(ratio);
      return ratio;
    };
    el.addEventListener('mousedown', (e) => {
      dragging = true;
      el.classList.add('is-dragging');
      setFromEvent(e);
      const move = (ev) => { if (dragging) setFromEvent(ev); };
      const up = (ev) => {
        if (dragging) {
          dragging = false;
          el.classList.remove('is-dragging');
          if (onCommit) onCommit(setFromEvent(ev));
        }
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
      };
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
      e.preventDefault();
    });
    el.addEventListener('touchstart', (e) => {
      el.classList.add('is-dragging');
      setFromEvent(e);
      const move = (ev) => { setFromEvent(ev); };
      const end = (ev) => {
        el.classList.remove('is-dragging');
        const t = (ev.changedTouches && ev.changedTouches[0]) || ev;
        if (onCommit) onCommit(setFromEvent(t));
        el.removeEventListener('touchmove', move);
        el.removeEventListener('touchend', end);
      };
      el.addEventListener('touchmove', move, { passive: true });
      el.addEventListener('touchend', end);
    }, { passive: true });
    el.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 0.1 : 0.02;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { onChange(Math.max(0, parseFloat(el.getAttribute('aria-valuenow') || '0') / 100 - step)); e.preventDefault(); if (onCommit) onCommit((parseFloat(el.getAttribute('aria-valuenow') || '0')) / 100); }
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { onChange(Math.min(1, (parseFloat(el.getAttribute('aria-valuenow') || '0') + step * 100) / 100)); e.preventDefault(); if (onCommit) onCommit((parseFloat(el.getAttribute('aria-valuenow') || '0')) / 100); }
      if (e.key === 'Home') { onChange(0); e.preventDefault(); if (onCommit) onCommit(0); }
      if (e.key === 'End') { onChange(1); e.preventDefault(); if (onCommit) onCommit(1); }
    });
  };

  const buildQualityMenu = (player) => {
    /* Если источник всего один — кнопка всё равно видна, но меню не открывается
       и показывает текущее качество. Это убирает "Auto" без выбора. */
    if (!player.sources || player.sources.length < 1) {
      player.quality.hidden = true;
      return;
    }
    /* Сразу показываем текущее качество (по умолчанию = sources[0].label или default). */
    const initialLabel = (player.sources.find((s) => s.default) || player.sources[0]).label;
    player.currentQuality = initialLabel;
    if (player.qualityLabel) player.qualityLabel.textContent = initialLabel;
    player.quality.hidden = false;
    if (player.sources.length === 1) {
      /* Один источник — оставляем только индикатор текущего разрешения. */
      player.quality.disabled = true;
      player.quality.setAttribute('aria-disabled', 'true');
      player.quality.classList.add('vp__quality--single');
      return;
    }
    player.quality.disabled = false;
    player.quality.removeAttribute('aria-disabled');
    player.quality.classList.remove('vp__quality--single');
    const wrap = document.createElement('div');
    wrap.className = 'vp__quality-menu';
    player.root.appendChild(wrap);
    const render = () => {
      wrap.innerHTML = '';
      player.sources.forEach((s) => {
        const opt = document.createElement('button');
        opt.type = 'button';
        opt.className = 'vp__quality-opt' + (s.label === player.currentQuality ? ' is-current' : '');
        opt.textContent = s.label;
        opt.addEventListener('click', () => {
          if (s.label === player.currentQuality) {
            wrap.classList.remove('is-open');
            return;
          }
          /* Запоминаем позицию и wasPlaying ДО смены src, чтобы корректно
             возобновить воспроизведение после загрузки новых метаданных. */
          const wasPlaying = !player.video.paused && !player.video.ended;
          const t = player.video.currentTime || 0;

          /* Переключаем UI в loading-режим:
             - снимаем is-ready (чтобы не показывать пустой vp__el)
             - снимаем is-playing (чтобы big-play был виден, иконка play корректна)
             - снимаем is-paused (чтобы контролы появились на :hover) */
          player.root.classList.remove('is-ready', 'is-playing', 'is-paused');
          setStatus(player, 'loading');

          player.currentQuality = s.label;
          if (player.qualityLabel) player.qualityLabel.textContent = s.label;
          /* Перерисовываем меню, чтобы is-current встал на новый пункт
             (до того, как свернём выпадашку). Без этого все опции остаются
             со старым is-current. */
          render();

          /* Ставим src и сразу load(). currentTime сбросится в 0;
             корректную позицию восстановим на loadedmetadata. */
          player.video.src = pickBestSource(player.video, s.src);
          try { player.video.load(); } catch (e) { /* noop */ }

          const onMeta = () => {
            /* Восстанавливаем позицию и, если видео играло, запускаем play. */
            try { player.video.currentTime = t; } catch (e) { /* noop */ }
            if (wasPlaying) {
              player.video.play().then(() => setStatus(player, null)).catch(() => setStatus(player, 'error'));
            } else {
              setStatus(player, null);
            }
          };
          player.video.addEventListener('loadedmetadata', onMeta, { once: true });

          wrap.classList.remove('is-open');
        });
        wrap.appendChild(opt);
      });
    };
    player.quality.addEventListener('click', (e) => {
      e.stopPropagation();
      wrap.classList.toggle('is-open');
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target) && e.target !== player.quality) wrap.classList.remove('is-open');
    });
    render();
  };

  const initPlayer = (root) => {
    const player = {
      root,
      video: root.querySelector('.vp__el'),
      poster: root.querySelector('.vp__poster'),
      bigPlay: root.querySelector('.vp__big-play'),
      play: root.querySelector('.vp__play'),
      mute: root.querySelector('.vp__mute'),
      volume: root.querySelector('.vp__volume'),
      seek: root.querySelector('.vp__seek'),
      fs: root.querySelector('.vp__fs'),
      quality: root.querySelector('.vp__quality'),
      qualityLabel: root.querySelector('.vp__quality-label'),
      src: root.getAttribute('data-player-src') || '',
      sources: parseSources(root),
      currentQuality: null,
      noFs: root.getAttribute('data-player-no-fs') === 'true',
    };
    if (!player.video) return null;

    const posterUrl = root.getAttribute('data-player-poster');
    if (posterUrl && player.poster) player.poster.src = posterUrl;

    if (root.getAttribute('data-player-loop') === 'true') player.video.loop = true;

    /* Начальная громкость — из localStorage или 1 */
    let storedVol = 1;
    try {
      const v = localStorage.getItem('vp:volume');
      if (v !== null && !Number.isNaN(parseFloat(v))) storedVol = Math.max(0, Math.min(1, parseFloat(v)));
    } catch (e) { /* localStorage недоступен — игнор */ }
    player.video.volume = storedVol;
    setVolumeFill(player, storedVol);
    updateMuteUI(player);

    /* Превью-загрузка при hover/focus — файл начнёт качаться до клика Play. */
    const primeLoad = () => {
      if (player.video.src) return;
      ensureSource(player);
    };
    root.addEventListener('mouseenter', primeLoad);
    root.addEventListener('focusin', primeLoad);
    root.addEventListener('touchstart', primeLoad, { passive: true });
    /* И на visibility — когда плеер появляется в viewport */
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) primeLoad(); });
      }, { rootMargin: '200px' });
      io.observe(root);
    }

    /* Big play = основная кнопка запуска */
    player.bigPlay.addEventListener('click', () => {
      /* Если данные из init-muted — снимаем mute, чтобы был звук при ручном старте.
         Но! Не делаем unmute автоматически — пользователь сам решит, нажав Mute. */
      tryPlay(player);
    });

    /* Внутренний play/pause */
    player.play.addEventListener('click', () => {
      if (player.video.paused || player.video.ended) {
        tryPlay(player);
      } else {
        player.video.pause();
      }
    });

    /* Mute */
    player.mute.addEventListener('click', () => {
      if (player.video.muted || player.video.volume === 0) {
        player.video.muted = false;
        if (player.video.volume === 0) { player.video.volume = storedVol || 0.5; setVolumeFill(player, player.video.volume); }
      } else {
        player.video.muted = true;
      }
      updateMuteUI(player);
    });

    /* Volume slider */
    bindSlider(player.volume, (ratio) => {
      player.video.muted = false;
      player.video.volume = ratio;
      setVolumeFill(player, ratio);
      updateMuteUI(player);
    }, (ratio) => {
      try { localStorage.setItem('vp:volume', String(ratio)); } catch (e) {}
    });

    /* Seek slider */
    bindSlider(player.seek, (ratio) => {
      if (player.video.duration) {
        setSeekFill(player, ratio * 100);
      }
    }, (ratio) => {
      if (player.video.duration) {
        player.video.currentTime = ratio * player.video.duration;
      }
    });

    /* Fullscreen (только если не data-player-no-fs) */
    if (!player.noFs) {
      player.fs.addEventListener('click', () => {
        const inFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        if (inFs) {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
          const req = player.root.requestFullscreen || player.root.webkitRequestFullscreen;
          if (req) req.call(player.root);
        }
      });
      const onFsChange = () => {
        const inFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        player.root.classList.toggle('is-fullscreen', inFs);
        player.fs.setAttribute('aria-label', inFs ? 'Свернуть' : 'На весь экран');
      };
      document.addEventListener('fullscreenchange', onFsChange);
      document.addEventListener('webkitfullscreenchange', onFsChange);

      player.video.addEventListener('dblclick', () => player.fs.click());
    }

    /* Click on video area toggles play */
    player.video.addEventListener('click', () => {
      if (player.video.paused || player.video.ended) tryPlay(player);
      else player.video.pause();
    });

    /* Состояния видео */
    player.video.addEventListener('play', () => {
      /* Single-active rule: при старте любого плеера пауза всем остальным. */
      for (const other of videoPlayers.values()) {
        if (other === player) continue;
        if (!other.video.paused) {
          other.video.pause();
          /* Если другой плеер был инициализирован как init-muted=true (например, hero
             с data-player-unmute-on-play), его pause вернёт корректный state.
             Звук мы не трогаем. */
        }
      }
      updatePlayUI(player);
    });
    player.video.addEventListener('pause', () => updatePlayUI(player));
    player.video.addEventListener('ended', () => {
      if (player.video.loop) return;
      updatePlayUI(player);
      player.bigPlay.hidden = false;
    });
    player.video.addEventListener('timeupdate', () => {
      const t = player.video.currentTime || 0;
      const d = player.video.duration || 0;
      const cur = root.querySelector('.vp__time-cur');
      const dur = root.querySelector('.vp__time-dur');
      if (cur) cur.textContent = formatTime(t);
      if (dur) dur.textContent = formatTime(d);
      if (d > 0) setSeekFill(player, (t / d) * 100);
    });
    player.video.addEventListener('durationchange', () => {
      const dur = root.querySelector('.vp__time-dur');
      if (dur) dur.textContent = formatTime(player.video.duration || 0);
    });
    player.video.addEventListener('progress', () => {
      if (!player.video.duration || !player.video.buffered.length) return;
      const end = player.video.buffered.end(player.video.buffered.length - 1);
      const pct = (end / player.video.duration) * 100;
      const buf = player.seek.querySelector('.vp__seek-buffer');
      if (buf) buf.style.width = Math.min(100, pct) + '%';
    });
    player.video.addEventListener('waiting', () => {
      if (player.video.paused) return;
      setStatus(player, 'loading');
    });
    player.video.addEventListener('canplay', () => setStatus(player, null));
    player.video.addEventListener('loadeddata', () => {
      player.root.classList.add('is-ready');
    });
    player.video.addEventListener('error', () => {
      setStatus(player, 'error', 'Не удалось загрузить видео');
    });
    /* Снимок первого кадра — после загрузки метаданных. Используется как постер. */
    captureFirstFrame(player);

    /* Клик по статусу ошибки — повтор */
    const statusEl = root.querySelector('.vp__status');
    if (statusEl) {
      statusEl.addEventListener('click', () => {
        if (player.root.classList.contains('is-error')) {
          setStatus(player, 'loading');
          ensureSource(player);
          try { player.video.load(); } catch (e) {}
          tryPlay(player);
        }
      });
    }

    /* Качество */
    buildQualityMenu(player);

    return player;
  };

  document.querySelectorAll('[data-player]').forEach((root) => {
    const player = initPlayer(root);
    if (player) videoPlayers.set(root, player);
  });

  /* Global hotkeys — срабатывают для плеера, на котором hover или focus. */
  const getActivePlayer = () => {
    /* Приоритет: focused элемент внутри плеера → hovered плеер. */
    const active = document.activeElement;
    if (active && active.closest) {
      const r = active.closest('[data-player]');
      if (r && videoPlayers.has(r)) return videoPlayers.get(r);
    }
    /* hover fallback */
    for (const p of videoPlayers.values()) {
      if (p.root.matches(':hover')) return p;
    }
    return null;
  };
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    /* не перехватываем клавиши при активном вводе в обычном поле (хотя у нас их нет) */
    const player = getActivePlayer();
    if (!player) return;
    const key = e.key;
    if (key === ' ' || key === 'k' || key === 'K') {
      if (player.video.paused || player.video.ended) tryPlay(player);
      else player.video.pause();
      e.preventDefault();
    } else if (key === 'ArrowLeft') {
      player.video.currentTime = Math.max(0, player.video.currentTime - 5);
      e.preventDefault();
    } else if (key === 'ArrowRight') {
      player.video.currentTime = Math.min(player.video.duration || 0, player.video.currentTime + 5);
      e.preventDefault();
    } else if (key === 'm' || key === 'M' || key === 'ь' || key === 'Ь') {
      player.video.muted = !player.video.muted;
      updateMuteUI(player);
      e.preventDefault();
    } else if ((key === 'f' || key === 'F' || key === 'а' || key === 'А') && !player.noFs) {
      player.fs.click();
      e.preventDefault();
    } else if (key === 'j' || key === 'J') {
      player.video.currentTime = Math.max(0, player.video.currentTime - 10);
      e.preventDefault();
    } else if (key === 'l' || key === 'L') {
      player.video.currentTime = Math.min(player.video.duration || 0, player.video.currentTime + 10);
      e.preventDefault();
    }
  });

  /* Install tabs: при переключении вкладки пауза других плееров */
  const videoRoot = document.querySelector('[data-video-tabs]');
  if (videoRoot) {
    const tabs = videoRoot.querySelectorAll('.install__video-tab');
    const panes = videoRoot.querySelectorAll('.install__video-pane');
    const metas = videoRoot.querySelectorAll('[data-install-meta-for]');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('aria-controls');
        const targetPane = targetId ? videoRoot.querySelector('#' + targetId) : null;

        tabs.forEach((other) => {
          const active = other === tab;
          other.classList.toggle('is-active', active);
          other.setAttribute('aria-selected', active ? 'true' : 'false');
          other.tabIndex = active ? 0 : -1;
        });

        panes.forEach((pane) => {
          const panePlayer = pane.querySelector('[data-player]');
          if (pane === targetPane) {
            pane.removeAttribute('hidden');
          } else {
            pane.setAttribute('hidden', '');
            /* panePlayer — это <div class="vp" data-player>, у него нет свойства .video.
               Достаём сам <video> через querySelector, чтобы вызвать pause(). */
            const v = panePlayer && panePlayer.querySelector('.vp__el');
            if (v) v.pause();
          }
        });

        metas.forEach((m) => {
          if (m.getAttribute('data-install-meta-for') === targetId) {
            m.removeAttribute('hidden');
          } else {
            m.setAttribute('hidden', '');
          }
        });
      });
    });
  }

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

  /* ---------- Lightbox: клик по [data-zoom-src] открывает на полный экран ----------
     Одиночный режим (по умолчанию): одна картинка, без навигации.
     Групповой режим (data-zoom-group): навигация prev/next, счётчик и миниатюры. */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = lightbox ? lightbox.querySelector('.lightbox__img') : null;
  const lightboxClose = lightbox ? lightbox.querySelector('.lightbox__close') : null;
  const lightboxPrev = lightbox ? lightbox.querySelector('[data-lightbox-prev]') : null;
  const lightboxNext = lightbox ? lightbox.querySelector('[data-lightbox-next]') : null;
  const lightboxCounter = lightbox ? lightbox.querySelector('[data-lightbox-counter]') : null;
  const lightboxCounterCur = lightbox ? lightbox.querySelector('[data-lightbox-current]') : null;
  const lightboxCounterTot = lightbox ? lightbox.querySelector('[data-lightbox-total]') : null;
  const lightboxThumbs = lightbox ? lightbox.querySelector('[data-lightbox-thumbs]') : null;
  let lastFocus = null;
  let lbGroup = null;     /* { items: [...], index: number } или null */
  let lbTouchX = null;    /* для свайпа */

  const setNavVisible = (show) => {
    [lightboxPrev, lightboxNext, lightboxCounter, lightboxThumbs].forEach((el) => {
      if (!el) return;
      if (show) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
    if (lightbox) lightbox.classList.toggle('is-group', !!show);
  };

  const renderLightbox = () => {
    if (!lbGroup) return;
    const item = lbGroup.items[lbGroup.index];
    if (!item) return;
    lightboxImg.src = item.dataset.zoomSrc;
    lightboxImg.alt = item.dataset.zoomAlt || '';
    if (lightboxCounterCur) lightboxCounterCur.textContent = String(lbGroup.index + 1);
    if (lightboxCounterTot) lightboxCounterTot.textContent = String(lbGroup.items.length);
    /* подсветить активную миниатюру + прокрутить её в видимую зону */
    if (lightboxThumbs) {
      lightboxThumbs.querySelectorAll('.lightbox__thumb').forEach((t, i) => {
        t.classList.toggle('is-active', i === lbGroup.index);
        t.setAttribute('aria-selected', i === lbGroup.index ? 'true' : 'false');
      });
      const active = lightboxThumbs.querySelector('.lightbox__thumb.is-active');
      if (active && typeof active.scrollIntoView === 'function') {
        active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    }
  };

  const buildThumbs = () => {
    if (!lightboxThumbs || !lbGroup) return;
    lightboxThumbs.innerHTML = '';
    lbGroup.items.forEach((item, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lightbox__thumb';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', `Изображение ${i + 1} из ${lbGroup.items.length}`);
      const img = document.createElement('img');
      img.alt = '';
      img.loading = 'lazy';
      img.src = item.dataset.zoomThumb || item.dataset.zoomSrc;
      btn.appendChild(img);
      btn.addEventListener('click', () => {
        lbGroup.index = i;
        renderLightbox();
      });
      lightboxThumbs.appendChild(btn);
    });
  };

  const navigate = (delta) => {
    if (!lbGroup || lbGroup.items.length < 2) return;
    const len = lbGroup.items.length;
    lbGroup.index = ((lbGroup.index + delta) % len + len) % len;
    renderLightbox();
  };

  const openLightbox = (src, alt, trigger) => {
    if (!lightbox || !lightboxImg) return;
    lastFocus = trigger || document.activeElement;
    const groupName = trigger && trigger.dataset.zoomGroup;
    if (groupName) {
      const items = Array.from(document.querySelectorAll(`[data-zoom-group="${groupName}"]`));
      const index = items.indexOf(trigger);
      lbGroup = { items, index: index >= 0 ? index : 0 };
      setNavVisible(true);
      buildThumbs();
      renderLightbox();
    } else {
      lbGroup = null;
      setNavVisible(false);
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
    }
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    (lightboxClose || lightbox).focus();
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove('lightbox-open');
    lbGroup = null;
    if (lightboxThumbs) lightboxThumbs.innerHTML = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  /* Кешируем миниатюру (для быстрого рендера) — production-quality */
  document.querySelectorAll('[data-zoom-src]').forEach((btn) => {
    /* у gallery-ячеек thumb уже есть рядом — подсунем его как миниатюру */
    if (!btn.dataset.zoomThumb) {
      const innerImg = btn.querySelector('img');
      if (innerImg && innerImg.src) btn.dataset.zoomThumb = innerImg.src;
    }
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openLightbox(btn.dataset.zoomSrc, btn.dataset.zoomAlt, btn);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', () => navigate(-1));
  if (lightboxNext) lightboxNext.addEventListener('click', () => navigate(1));
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  /* Клавиатура */
  document.addEventListener('keydown', (e) => {
    if (!lightbox || lightbox.hidden) return;
    if (e.key === 'Escape') { closeLightbox(); return; }
    if (!lbGroup) return;
    if (e.key === 'ArrowLeft')  { navigate(-1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { navigate(1);  e.preventDefault(); }
  });

  /* Touch-свайп (горизонтальный) */
  if (lightbox) {
    lightbox.addEventListener('touchstart', (e) => {
      if (!lbGroup) return;
      const t = e.touches[0];
      lbTouchX = t.clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
      if (!lbGroup || lbTouchX == null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - lbTouchX;
      if (Math.abs(dx) > 40) navigate(dx > 0 ? -1 : 1);
      lbTouchX = null;
    }, { passive: true });
  }

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