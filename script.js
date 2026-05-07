const menuButton = document.querySelector('[data-menu-button]');
const navLinks = document.querySelector('[data-nav-links]');
if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', navLinks.classList.contains('open'));
  });
}

function isMobileDeviceMode() {
  const ua = navigator.userAgent || '';
  const mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  // iPhone/iPad "Request Desktop Website": UA looks like Mac + Safari but the device is touch-first.
  const iosAsDesktopUa = !mobileUa && navigator.maxTouchPoints > 1 && /Macintosh|Mac OS X/i.test(ua);
  if (!mobileUa && !iosAsDesktopUa) return false;
  // Portrait phones fit 760px; landscape iPhones often exceed 760 CSS px. Laptop browsers never match mobileUa/iosAsDesktopUa.
  return window.matchMedia('(max-width: 1024px)').matches;
}

function syncMobileDeviceClass() {
  document.body.classList.toggle('is-mobile-device', isMobileDeviceMode());
}

syncMobileDeviceClass();
window.addEventListener('resize', syncMobileDeviceClass);
window.addEventListener('orientationchange', syncMobileDeviceClass);

/** Web3Forms: create a free access key at https://web3forms.com — safe to use in frontend JS. */
const WEB3FORMS_ACCESS_KEY = '97e1d4b2-a4c8-4553-9583-3f6a01b3168b';

const forms = document.querySelectorAll('form[data-static-form]');
forms.forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const note = form.querySelector('[data-form-note]');
    if (note) {
      const isFr = (document.documentElement.lang || '').toLowerCase().startsWith('fr');
      note.textContent = isFr
        ? 'Merci — demande reçue. Nous recontactons vite.'
        : 'Thank you - your request has been received. Our team will contact you shortly.';
    }
  });
});

(function setupGuidedContactReachValidation() {
  function normalizeWhatsAppCountryCode(raw) {
    let s = (raw || '').trim().replace(/\s+/g, '');
    if (!s) return '';
    if (s.startsWith('00')) s = `+${s.slice(2)}`;
    if (!s.startsWith('+')) {
      const d = s.replace(/\D/g, '');
      if (!d || d.length > 4) return '';
      return `+${d}`;
    }
    const d = s.slice(1).replace(/\D/g, '');
    if (!d || d.length > 4) return '';
    return `+${d}`;
  }

  function contactDigitsOnly(value) {
    return (value || '').replace(/\D/g, '');
  }

  function validateContactEmailStrict(email) {
    const e = (email || '').trim();
    if (!e || e.length > 254) return false;
    const at = e.lastIndexOf('@');
    if (at < 1 || at === e.length - 1) return false;
    const local = e.slice(0, at);
    const domain = e.slice(at + 1);
    if (local.length > 64 || domain.length > 253) return false;
    if (e.includes('..') || domain.startsWith('.') || domain.endsWith('.')) return false;
    if (!domain.includes('.')) return false;
    const labels = domain.split('.');
    if (!labels.length) return false;
    for (const label of labels) {
      if (!label || label.length > 63) return false;
      if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(label)) return false;
    }
    const tld = labels[labels.length - 1];
    if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9._+-]{0,62}[a-zA-Z0-9])?$/.test(local)) return false;
    const disposable = /^(mailinator\.com|tempmail\.com|guerrillamail\.com|10minutemail\.com|throwaway\.email)$/i;
    if (disposable.test(domain)) return false;
    return true;
  }

  function isAllSameDigit(digits) {
    return digits.length >= 8 && /^(\d)\1+$/.test(digits);
  }

  function guidedFormFieldsPayload(form) {
    const wrap = form.closest('[data-guided-intake]');
    if (wrap && typeof window.refreshIntakeBrief === 'function') {
      window.refreshIntakeBrief(wrap);
    }
    const fd = new FormData(form);
    const data = {};
    for (const [key, val] of fd.entries()) {
      if (key === 'access_key' || key === 'botcheck') continue;
      if (val instanceof File) continue;
      if (data[key] !== undefined) {
        data[key] = `${data[key]}\n${val}`;
      } else {
        data[key] = val;
      }
    }
    return data;
  }

  document.querySelectorAll('form.guided-intake-form').forEach((form) => {
    const note = form.querySelector('[data-form-note]');
    const emailInput = form.querySelector('input[name="email"]');
    const whatsCcInput = form.querySelector('input[name="whatsapp_country_code"]');
    const whatsLocalInput = form.querySelector('input[name="whatsapp_local"]');
    const submitBtn = form.querySelector('.contact-submit-zone button[type="submit"]');
    const mainPanel = form.closest('.intake-main-panel');
    const successPanel = mainPanel && mainPanel.querySelector('[data-contact-success-panel]');
    const studio = form.closest('[data-guided-intake]');

    const clearReachError = () => {
      if (!note) return;
      note.textContent = '';
      delete note.dataset.contactReachError;
      note.classList.remove('form-submit-note--error');
    };

    const showReachError = (message, focusEl) => {
      if (note) {
        note.textContent = message;
        note.dataset.contactReachError = '1';
        note.classList.add('form-submit-note--error');
      }
      focusEl?.focus();
      note?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    [emailInput, whatsCcInput, whatsLocalInput].forEach((el) => {
      if (!el) return;
      el.addEventListener('input', clearReachError);
    });

    if (whatsLocalInput) {
      whatsLocalInput.addEventListener('input', () => {
        const d = contactDigitsOnly(whatsLocalInput.value);
        if (whatsLocalInput.value !== d) whatsLocalInput.value = d;
      });
    }

    if (whatsCcInput) {
      whatsCcInput.addEventListener('input', () => {
        let v = whatsCcInput.value.replace(/[^\d+]/g, '');
        const firstPlus = v.indexOf('+');
        if (firstPlus > 0) v = v.slice(firstPlus);
        if (firstPlus === -1 && v.length > 0) {
          const digits = v.replace(/\D/g, '').slice(0, 4);
          v = digits.length ? `+${digits}` : '';
        } else if (v.startsWith('+')) {
          v = `+${v.slice(1).replace(/\D/g, '').slice(0, 4)}`;
        }
        whatsCcInput.value = v;
      });
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const isFr = (document.documentElement.lang || '').toLowerCase().startsWith('fr');
      const emailVal = (emailInput?.value || '').trim();
      const ccRaw = (whatsCcInput?.value || '').trim();
      const localDigits = contactDigitsOnly(whatsLocalInput?.value || '');
      const ccNorm = normalizeWhatsAppCountryCode(ccRaw);

      const hasEmail = emailVal.length > 0;
      const waTouched = ccRaw.length > 0 || localDigits.length > 0;
      const ccDigitsLen = ccNorm ? ccNorm.length - 1 : 0;
      const waComplete =
        Boolean(ccNorm && localDigits.length >= 5 && ccDigitsLen >= 1 && ccDigitsLen <= 4);
      const totalDigits = ccDigitsLen + localDigits.length;

      if (!hasEmail && !waComplete) {
        if (waTouched) {
          let focusEl = whatsCcInput;
          if (ccNorm && localDigits.length < 5) focusEl = whatsLocalInput;
          showReachError(
            isFr
              ? 'WhatsApp : indicatif (ex. +250) + numéro en chiffres.'
              : 'For WhatsApp: enter both a country code (e.g. +250) and your number (digits only).',
            focusEl
          );
        } else {
          showReachError(
            isFr
              ? 'Ajoutez un e-mail ou un WhatsApp valide pour qu’on puisse répondre.'
              : 'Please enter either an email address or a WhatsApp number so we can reach you.',
            emailInput || whatsCcInput
          );
        }
        return;
      }

      if (waTouched && !waComplete && hasEmail) {
        showReachError(
          isFr
            ? 'Complétez WhatsApp ou videz les deux champs.'
            : 'Complete WhatsApp country code and number correctly, or leave both blank.',
          ccRaw ? whatsLocalInput : whatsCcInput
        );
        return;
      }

      if (waComplete) {
        if (!ccNorm || ccDigitsLen < 1 || ccDigitsLen > 4) {
          showReachError(
            isFr
              ? 'Indicatif invalide (+ et 1–4 chiffres, ex. +250).'
              : 'Invalid country code: use + followed by 1–4 digits (e.g. +250).',
            whatsCcInput
          );
          return;
        }
        if (localDigits.length < 5 || localDigits.length > 14) {
          showReachError(
            isFr
              ? 'Le numéro local doit avoir au moins 5 chiffres.'
              : 'WhatsApp number needs at least 5 digits (excluding country code).',
            whatsLocalInput
          );
          return;
        }
        if (totalDigits < 8 || totalDigits > 15) {
          showReachError(
            isFr
              ? 'Numéro international trop court ou trop long.'
              : 'The full number looks too short or too long for international format.',
            whatsLocalInput
          );
          return;
        }
        const fullDigits = `${contactDigitsOnly(ccNorm)}${localDigits}`;
        if (isAllSameDigit(fullDigits)) {
          showReachError(
            isFr
              ? 'Numéro peu crédible — vérifiez indicatif et chiffres.'
              : 'That number does not look valid. Please check country code and digits.',
            whatsLocalInput
          );
          return;
        }
      }

      if (hasEmail) {
        if (emailInput && !emailInput.checkValidity()) {
          emailInput.reportValidity();
          return;
        }
        if (!validateContactEmailStrict(emailVal)) {
          showReachError(
            isFr
              ? 'E-mail invalide (ex. vous@entreprise.com).'
              : 'Please enter a valid email address (e.g. you@company.com).',
            emailInput
          );
          return;
        }
      }

      clearReachError();

      const accessKey = WEB3FORMS_ACCESS_KEY.trim();
      if (!accessKey) {
        if (note) {
          note.textContent = isFr
            ? 'Clé Web3Forms manquante : WEB3FORMS_ACCESS_KEY dans script.js.'
            : 'Form not configured yet: add your Web3Forms access key in script.js (WEB3FORMS_ACCESS_KEY).';
          note.classList.add('form-submit-note--error');
        }
        note?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      const botcheck = form.querySelector('input[name="botcheck"]');
      if (botcheck && botcheck.checked) {
        return;
      }

      const fields = guidedFormFieldsPayload(form);
      delete fields.whatsapp_country_code;
      delete fields.whatsapp_local;
      if (waComplete && ccNorm) {
        fields.whatsapp = `${ccNorm}${localDigits}`;
      }

      const firstName = (fields.first_name || '').trim();
      const payload = {
        access_key: accessKey,
        subject: isFr ? 'ZAD — Brief projet' : 'ZAD — New project brief (contact form)',
        from_name: firstName ? `${firstName} (ZAD contact)` : 'ZAD contact form',
        ...fields
      };
      if (emailVal) payload.replyto = emailVal;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
      }

      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        });
        let data = {};
        try {
          data = await res.json();
        } catch (_) {}

        if (!res.ok || data.success === false) {
          const msg = typeof data.message === 'string' ? data.message : '';
          if (note) {
            note.textContent = msg || (isFr
              ? 'Échec d’envoi. Réessayez ou écrivez à info@zadglobal.org.'
              : 'Something went wrong sending your request. Try again shortly or email info@zadglobal.org.');
            note.classList.add('form-submit-note--error');
          }
          note?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return;
        }

        form.classList.add('is-contact-success-hidden');
        if (studio) studio.classList.add('contact-success-state');
        if (successPanel) {
          successPanel.hidden = false;
          successPanel.classList.add('is-visible');
          requestAnimationFrame(() => {
            successPanel.focus();
            successPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        } else if (note) {
          note.textContent = isFr
            ? 'Merci — demande reçue. À très vite.'
            : 'Thank you — your request has been received. Our team will contact you shortly.';
        }
      } catch (_) {
        if (note) {
          note.textContent = isFr
            ? 'Serveur injoignable. Réessayez ou écrivez à info@zadglobal.org.'
            : 'We could not reach the server. Check your connection or email info@zadglobal.org.';
          note.classList.add('form-submit-note--error');
        }
        note?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.removeAttribute('aria-busy');
        }
      }
    });
  });
})();

const serviceMaps = document.querySelectorAll('[data-service-map]');
const serviceAliases = {
  software: 'digital', 'software-ai': 'digital', digital: 'digital', systems: 'digital',
  ai: 'ai', automation: 'ai', 'ai-automation': 'ai',
  robotics: 'robotics', robotique: 'robotics', 'field-ops': 'robotics', terrain: 'robotics',
  people: 'people', training: 'people', formation: 'people', enablement: 'people',
  strategy: 'strategy', operations: 'strategy', consulting: 'strategy', strategie: 'strategy',
  capital: 'capital', finance: 'capital', partners: 'capital', patrimoine: 'capital'
};
function openServicePanel(target, options = {}) {
  const key = serviceAliases[target] || target;
  if (!key) return false;
  let opened = false;
  serviceMaps.forEach((map) => {
    const buttons = map.querySelectorAll('[data-service-target]');
    const panels = map.querySelectorAll('[data-service-panel]');
    const activeButton = map.querySelector(`[data-service-target="${key}"]`);
    const activePanel = map.querySelector(`[data-service-panel="${key}"]`);
    if (!activeButton || !activePanel) return;
    buttons.forEach((item) => item.classList.toggle('active', item === activeButton));
    panels.forEach((panel) => panel.classList.toggle('active', panel === activePanel));
    opened = true;
    if (options.updateHash) history.replaceState(null, '', `#${key}`);
    if (options.scroll) {
      const section = document.getElementById('service-map');
      if (section) setTimeout(() => section.scrollIntoView({ behavior: options.smooth ? 'smooth' : 'auto', block: 'start' }), 40);
    }
  });
  return opened;
}
serviceMaps.forEach((map) => {
  const buttons = map.querySelectorAll('[data-service-target]');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.getAttribute('data-service-target');
      openServicePanel(target, { updateHash: true });
    });
  });
});
function applyServiceHash() {
  const target = (window.location.hash || '').replace('#', '');
  if (target && openServicePanel(target, { scroll: true })) return true;
  return false;
}
applyServiceHash();
window.addEventListener('hashchange', applyServiceHash);


// v9 interactive upgrades
function wireTabs(rootSelector, buttonAttr, panelAttr) {
  document.querySelectorAll(rootSelector).forEach((wrap) => {
    const buttons = wrap.querySelectorAll(`[${buttonAttr}]`);
    const panels = wrap.querySelectorAll(`[${panelAttr}]`);
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const target = button.getAttribute(buttonAttr);
        buttons.forEach((b) => b.classList.toggle('active', b === button));
        panels.forEach((p) => p.classList.toggle('active', p.getAttribute(panelAttr) === target));
      });
    });
  });
}
wireTabs('[data-need-selector]', 'data-need-target', 'data-need-panel');
wireTabs('[data-case-switcher]', 'data-case-target', 'data-case-panel');
wireTabs('[data-guided-intake]', 'data-intake-target', 'data-intake-panel');

function defaultCurrencyFromLocale() {
  const locale = (navigator.language || 'en-US').toLowerCase();
  if (locale.includes('fr-fr') || locale.includes('de') || locale.includes('es') || locale.includes('it')) return 'EUR';
  if (locale.includes('fr-ca') || locale.includes('en-ca')) return 'CAD';
  if (locale.includes('en-gb')) return 'GBP';
  if (locale.includes('rw')) return 'RWF';
  if (locale.includes('ng')) return 'NGN';
  if (locale.includes('gh')) return 'GHS';
  if (locale.includes('za')) return 'ZAR';
  if (locale.includes('bf') || locale.includes('ci') || locale.includes('sn') || locale.includes('ml') || locale.includes('ne')) return 'XOF';
  return 'USD';
}
function formatMoney(value, currencyCode) {
  const rounded = Math.round(value);
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(rounded) + ' ' + currencyCode;
  } catch (e) {
    return rounded.toLocaleString() + ' ' + currencyCode;
  }
}
document.querySelectorAll('[data-roi-calculator]').forEach((calc) => {
  const employees = calc.querySelector('[data-roi-employees]');
  const hours = calc.querySelector('[data-roi-hours]');
  const rate = calc.querySelector('[data-roi-rate]');
  const lift = calc.querySelector('[data-roi-lift]');
  const currencySelect = calc.querySelector('[data-roi-currency]');
  const outHours = calc.querySelector('[data-roi-monthly-hours]');
  const outMonth = calc.querySelector('[data-roi-monthly-value]');
  const outYear = calc.querySelector('[data-roi-yearly-value]');
  if (currencySelect) {
    const preferred = defaultCurrencyFromLocale();
    const hasPreferred = Array.from(currencySelect.options).some((option) => option.value === preferred);
    if (hasPreferred && !currencySelect.dataset.userSet) currencySelect.value = preferred;
  }
  function update() {
    const e = Math.max(0, parseFloat(employees.value) || 0);
    const h = Math.max(0, parseFloat(hours.value) || 0);
    const r = Math.max(0, parseFloat(rate.value) || 0);
    const l = Math.max(0, parseFloat(lift.value) || 0);
    const currencyCode = currencySelect ? currencySelect.value : 'USD';
    const monthlyHours = e * h * 4 * l;
    const monthlyValue = monthlyHours * r;
    outHours.textContent = Math.round(monthlyHours).toLocaleString();
    outMonth.textContent = formatMoney(monthlyValue, currencyCode);
    outYear.textContent = formatMoney(monthlyValue * 12, currencyCode);
  }
  [employees, hours, rate, lift, currencySelect].filter(Boolean).forEach((input) => input.addEventListener('input', update));
  if (currencySelect) currencySelect.addEventListener('change', () => { currencySelect.dataset.userSet = 'true'; update(); });
  update();
});

const revealItems = document.querySelectorAll('[data-reveal], section:not(.hero):not(.page-hero)');
revealItems.forEach((item) => item.setAttribute('data-reveal', ''));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

function animateRange(el, finalText) {
  const match = finalText.match(/^(\d+)[–-](\d+)(.*)$/);
  if (!match) return;
  const start = parseInt(match[1], 10);
  const end = parseInt(match[2], 10);
  const suffix = match[3] || '';
  const duration = 900;
  const t0 = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const a = Math.round(start * eased);
    const b = Math.round(end * eased);
    el.textContent = `${a}–${b}${suffix}`;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = finalText;
  }
  requestAnimationFrame(tick);
}
document.querySelectorAll('[data-count-range]').forEach((el) => {
  const finalText = el.getAttribute('data-count-range');
  const trigger = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateRange(el, finalText);
        trigger.disconnect();
      }
    });
  }, { threshold: 0.3 });
  trigger.observe(el);
});

// v12: make guided contact intake genuinely useful by summarizing selected needs.
const evidenceByLane = {
  ai: 'Examples of requests, documents, current tools, handoffs, approval rules, repeated questions, and volume estimates.',
  software: 'Existing systems, user roles, must-have workflows, sample reports, integrations, permissions, and timeline constraints.',
  training: 'Current onboarding materials, SOPs, roles to train, number of learners, common mistakes, and target behaviors after training.',
  robotics: 'Field environment, safety constraints, connectivity limits, sample inspection routines, current hardware, and decisions management needs to make.',
  finance: 'Clarify whether the need is company operational finance or personal wealth / retirement coordination; prepare account/process context and decision timeline.',
  general: 'Countries involved, partners or stakeholders, desired outcome, timeline, available documents, and what would make the first conversation useful.'
};
function refreshIntakeBrief(wrap) {
  const activeButton = wrap.querySelector('[data-intake-target].active');
  if (!activeButton) return;
  const target = activeButton.getAttribute('data-intake-target');
  const activePanel = wrap.querySelector(`[data-intake-panel="${target}"]`);
  const lane = wrap.querySelector('[data-brief-lane]');
  const focus = wrap.querySelector('[data-brief-focus]');
  const evidence = wrap.querySelector('[data-brief-evidence]');
  if (lane) lane.textContent = activePanel?.getAttribute('data-brief') || activeButton.textContent.trim();
  if (focus && activePanel) {
    const checked = Array.from(activePanel.querySelectorAll('.choice-chip input:checked')).map((input) => input.value || input.parentElement.textContent.trim());
    if (checked.length) {
      focus.innerHTML = checked.map((item) => `<span class="brief-selected-chip">${item}</span>`).join('');
    } else {
      focus.textContent = document.documentElement.lang === 'fr' ? 'Rien de coché dans cet onglet.' : 'No focus selected yet. Choose all priorities that apply.';
    }
  }
  if (evidence) evidence.textContent = evidenceByLane[target] || evidenceByLane.general;
}
document.querySelectorAll('[data-guided-intake]').forEach((wrap) => {
  wrap.querySelectorAll('[data-intake-target]').forEach((button) => button.addEventListener('click', () => setTimeout(() => refreshIntakeBrief(wrap), 0)));
  wrap.querySelectorAll('.choice-chip input').forEach((input) => input.addEventListener('change', () => refreshIntakeBrief(wrap)));
  refreshIntakeBrief(wrap);
});

// v13 dedicated case-study workspace tabs
wireTabs('[data-case-workspace]', 'data-case-tab', 'data-workspace-panel');

// v14: cross-tab guided contact brief. Selections persist across lanes and summarize as one combined request.
(function () {
  const laneLabels = {
    ai: { en: 'AI & Automation', fr: 'IA & automatisation' },
    software: { en: 'Software', fr: 'Logiciel' },
    training: { en: 'Training', fr: 'Formation' },
    robotics: { en: 'Robotics', fr: 'Robotique' },
    finance: { en: 'Finance', fr: 'Finance' },
    general: { en: 'General', fr: 'Général' }
  };
  const evidence = {
    ai: {
      en: ['Sample documents, emails, WhatsApp messages, or forms.', 'Current tools and handoffs: CRM, Excel, ERP, inbox, approvals.', 'Monthly volume, repeated questions, and where the work gets delayed.'],
      fr: ['Documents, emails, WhatsApp ou formulaires.', 'Outils : CRM, Excel, ERP, validations…', 'Volume mensuel et points de blocage.']
    },
    software: {
      en: ['Current systems, links, exports, screenshots, or workflow examples.', 'User roles, permissions, integrations, reports, and must-have actions.', 'Timeline, launch constraints, and what the current tools cannot do.'],
      fr: ['Exports, captures, exemples de flux.', 'Rôles, permissions, intégrations, délais.', 'Ce que les outils actuels ne font pas.']
    },
    training: {
      en: ['Existing SOPs, manuals, videos, slides, or onboarding documents.', 'Roles to train, number of learners, common mistakes, and target behavior.', 'Whether training should be live, online, hybrid, or supported by an AI coach.'],
      fr: ['Supports existants (modes opératoires, vidéos…)', 'Rôles, volume d’apprenants, erreurs fréquentes.', 'Format : présentiel, distanciel ou hybride.']
    },
    robotics: {
      en: ['Site type, photos, inspection routines, safety constraints, and connectivity limits.', 'Existing hardware: drones, sensors, cameras, robots, vehicles, or none yet.', 'The field decision management needs to make from the data.'],
      fr: ['Photos, routine d’inspection, contraintes terrain.', 'Matériel : drones, capteurs, caméras…', 'Décision terrain à mieux piloter.']
    },
    finance: {
      en: ['Clarify whether this is company operational finance or personal wealth coordination.', 'Budgets, account types, cost centers, staff allocation, or planning timeline.', 'Decision makers involved and any compliance or suitability constraints.'],
      fr: ['Préciser entreprise ou patrimoine personnel.', 'Budgets, comptes concernés, calendrier.', 'Décideurs et contraintes réglementaires.']
    },
    general: {
      en: ['Countries involved, stakeholders, partner expectations, and desired outcome.', 'Any existing documents, supplier context, quality requirements, or deadlines.', 'What would make the first conversation useful.'],
      fr: ['Pays, parties prenantes, résultat attendu.', 'Documents existants, délais, exigences qualité.', 'Ce qui rendrait le premier contact utile.']
    }
  };
  function isFr() { return (document.documentElement.lang || '').toLowerCase().startsWith('fr'); }
  function language() { return isFr() ? 'fr' : 'en'; }
  function getSelections(wrap) {
    const selections = {};
    wrap.querySelectorAll('.choice-chip input[type="checkbox"]').forEach((input) => {
      if (!input.checked) return;
      const panel = input.closest('[data-intake-panel]');
      const lane = input.dataset.lane || panel?.getAttribute('data-intake-panel') || 'general';
      if (!selections[lane]) selections[lane] = [];
      selections[lane].push(input.value || input.parentElement.textContent.trim());
    });
    return selections;
  }
  function totalSelected(selections) {
    return Object.values(selections).reduce((sum, items) => sum + items.length, 0);
  }
  function updateCounts(wrap, selections) {
    Object.keys(laneLabels).forEach((lane) => {
      const count = selections[lane]?.length || 0;
      const button = wrap.querySelector(`[data-intake-target="${lane}"]`);
      const badge = wrap.querySelector(`[data-lane-count="${lane}"]`);
      if (badge) badge.textContent = String(count);
      if (button) button.classList.toggle('has-selection', count > 0);
    });
  }
  function updateHiddenScope(wrap, selections) {
    const hidden = wrap.querySelector('[data-request-scope]');
    if (!hidden) return;
    const lang = language();
    const lines = Object.entries(selections).map(([lane, items]) => `${laneLabels[lane]?.[lang] || lane}: ${items.join(', ')}`);
    hidden.value = lines.join(' | ');
  }
  window.refreshIntakeBrief = function refreshIntakeBrief(wrap) {
    const lang = language();
    const selections = getSelections(wrap);
    const count = totalSelected(selections);
    updateCounts(wrap, selections);
    updateHiddenScope(wrap, selections);

    const laneHeading = wrap.querySelector('[data-brief-lane]');
    const focus = wrap.querySelector('[data-brief-focus]');
    const engagement = wrap.querySelector('[data-brief-engagement]');
    const outcome = wrap.querySelector('[data-brief-outcome]');
    const evidenceList = wrap.querySelector('[data-brief-evidence-list]');
    const laneCount = Object.keys(selections).length;

    if (laneHeading) {
      laneHeading.textContent = count
        ? (lang === 'fr' ? `${count} sélection${count > 1 ? 's' : ''}` : `${count} selected priorit${count === 1 ? 'y' : 'ies'}`)
        : (lang === 'fr' ? 'Portée combinée' : 'Combined scope');
    }

    if (focus) {
      if (!count) {
        focus.textContent = lang === 'fr'
          ? 'Aucune sélection — cochez les besoins (plusieurs onglets possibles).'
          : 'No selections yet. Select all relevant services, even across multiple tabs.';
      } else {
        focus.innerHTML = Object.entries(selections).map(([lane, items]) => {
          const chips = items.map((item) => `<span class="brief-selected-chip">${item}</span>`).join('');
          return `<div class="brief-lane-group"><strong>${laneLabels[lane]?.[lang] || lane}<span>${items.length}</span></strong><div class="brief-chip-list">${chips}</div></div>`;
        }).join('');
      }
    }

    if (engagement) {
      if (!count) engagement.textContent = lang === 'fr' ? 'Ajoutez les priorités qui comptent.' : 'Single-lane diagnostic. Add the priorities that apply.';
      else if (laneCount === 1) engagement.textContent = lang === 'fr' ? 'Mission ciblée sur un domaine.' : 'Focused single-lane engagement with structured context.';
      else engagement.textContent = lang === 'fr' ? `Mission multi-domaines (${laneCount}). Feuille de route intégrée possible.` : `Combined engagement across ${laneCount} lanes. ZAD can prepare an integrated roadmap.`;
    }

    if (outcome) {
      outcome.textContent = lang === 'fr'
        ? 'Aide à cadrer le premier échange et les dépendances entre équipes.'
        : 'This summary helps us route the first conversation, identify dependencies across teams, and avoid repeated clarification emails.';
    }

    if (evidenceList) {
      const lanes = Object.keys(selections).length ? Object.keys(selections) : ['ai', 'software', 'training'];
      const items = [];
      lanes.forEach((lane) => (evidence[lane]?.[lang] || []).forEach((entry) => { if (!items.includes(entry)) items.push(entry); }));
      evidenceList.innerHTML = items.slice(0, 6).map((entry) => `<li>${entry}</li>`).join('');
    }
  };

  document.querySelectorAll('[data-guided-intake]').forEach((wrap) => {
    const refresh = () => window.refreshIntakeBrief(wrap);
    wrap.querySelectorAll('[data-intake-target]').forEach((button) => button.addEventListener('click', () => setTimeout(refresh, 0)));
    wrap.querySelectorAll('.choice-chip input, input, textarea, select').forEach((input) => input.addEventListener('input', refresh));
    wrap.querySelectorAll('.choice-chip input, select').forEach((input) => input.addEventListener('change', refresh));
    refresh();
  });
})();

// v15 case worlds and nested case demos
(function(){
  function syncCaseWorldTabLede(worldRoot, targetTab) {
    if (!worldRoot || !targetTab) return;
    worldRoot.querySelectorAll('[data-world-tab-lede]').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-world-tab-lede') === targetTab);
    });
  }
  function hydrateCaseWorldTables() {
    document.querySelectorAll('[data-case-world] table.cockpit-table').forEach((table) => {
      const ths = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
      table.querySelectorAll('tbody tr').forEach((tr) => {
        tr.querySelectorAll('td').forEach((td, i) => {
          if (ths[i]) td.setAttribute('data-label', ths[i]);
        });
      });
    });
  }
  hydrateCaseWorldTables();

  const world = document.querySelector('[data-case-world]');
  if (world) {
    const buttons = [...world.querySelectorAll('[data-world-tab]')];
    const panels = [...world.querySelectorAll('[data-world-panel]')];
    const initial = buttons.find((b) => b.classList.contains('active'))?.getAttribute('data-world-tab');
    if (initial) syncCaseWorldTabLede(world, initial);
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-world-tab');
        buttons.forEach((b) => b.classList.toggle('active', b === btn));
        panels.forEach((p) => p.classList.toggle('active', p.getAttribute('data-world-panel') === target));
        syncCaseWorldTabLede(world, target);
      });
    });
  }
  window.syncCaseWorldTabLede = syncCaseWorldTabLede;
  document.querySelectorAll('[data-mini-case]').forEach((wrap) => {
    const scope = wrap.closest('.workspace-showcase');
    if (!scope) return;
    const buttons = [...wrap.querySelectorAll('[data-mini-tab]')];
    const panels = [...scope.querySelectorAll('[data-mini-panel]')];
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-mini-tab');
        buttons.forEach((b) => b.classList.toggle('active', b === btn));
        panels.forEach((p) => p.classList.toggle('active', p.getAttribute('data-mini-panel') === target));
        const screen = scope.querySelector('.software-screen');
        if (screen && window.matchMedia('(max-width: 980px)').matches) {
          const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          requestAnimationFrame(() => {
            screen.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
          });
        }
      });
    });
  });
})();


// v18: language switching preserves active section/panel, service-map deep links open the correct domain,
// and Case studies deep links open the right case world.
(function () {
  const storageKeyFor = (path) => `zad-lang-scroll:${path}`;
  const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  function nearestSectionId() {
    const sections = [...document.querySelectorAll('section[id], main [id]')].filter((el) => el.offsetParent !== null);
    if (!sections.length) return '';
    let best = sections[0];
    let bestDistance = Infinity;
    sections.forEach((section) => {
      const distance = Math.abs(section.getBoundingClientRect().top - 120);
      if (distance < bestDistance) { best = section; bestDistance = distance; }
    });
    return best.id || '';
  }
  function currentDeepLink() {
    const activeService = document.querySelector('[data-service-target].active')?.getAttribute('data-service-target');
    const serviceMap = document.querySelector('[data-service-map]');
    if (serviceMap && activeService && window.scrollY + 220 >= serviceMap.getBoundingClientRect().top + window.scrollY) return activeService;
    const activeWorld = document.querySelector('[data-world-tab].active')?.getAttribute('data-world-tab');
    if (activeWorld && document.querySelector('[data-case-world]')) return activeWorld;
    const hash = (window.location.hash || '').replace('#', '');
    if (hash) return hash;
    return nearestSectionId();
  }
  document.querySelectorAll('.lang-switch a:not(.active)').forEach((link) => {
    link.addEventListener('click', () => {
      try {
        const target = new URL(link.getAttribute('href'), window.location.href);
        const ratio = window.scrollY / maxScroll();
        sessionStorage.setItem(storageKeyFor(target.pathname), String(ratio));
        const id = currentDeepLink();
        if (id) target.hash = id;
        link.href = target.href;
      } catch (e) {}
    });
  });
  window.addEventListener('load', () => {
    const key = storageKeyFor(window.location.pathname);
    const saved = sessionStorage.getItem(key);
    if (saved && !window.location.hash) {
      sessionStorage.removeItem(key);
      const ratio = Math.max(0, Math.min(1, parseFloat(saved) || 0));
      setTimeout(() => window.scrollTo({ top: ratio * maxScroll(), behavior: 'auto' }), 60);
    }
  });

  const world = document.querySelector('[data-case-world]');
  if (world) {
    const openWorld = (target) => {
      const btn = world.querySelector(`[data-world-tab="${target}"]`);
      const panel = world.querySelector(`[data-world-panel="${target}"]`);
      if (!btn || !panel) return false;
      world.querySelectorAll('[data-world-tab]').forEach((b) => b.classList.toggle('active', b === btn));
      world.querySelectorAll('[data-world-panel]').forEach((p) => p.classList.toggle('active', p === panel));
      if (typeof window.syncCaseWorldTabLede === 'function') window.syncCaseWorldTabLede(world, target);
      return true;
    };
    const applyHash = () => {
      const target = (window.location.hash || '').replace('#', '');
      if (target && openWorld(target)) {
        const section = document.getElementById('case-worlds');
        if (section) setTimeout(() => section.scrollIntoView({ behavior: 'auto', block: 'start' }), 40);
      }
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    world.querySelectorAll('[data-world-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-world-tab');
        if (target) history.replaceState(null, '', `#${target}`);
      });
    });
  }
})();

// v20: custom localized file upload control. Native file inputs use browser UI strings,
// so we hide the native text and update our own translated status label.
document.querySelectorAll('[data-file-upload]').forEach((wrap) => {
  const input = wrap.querySelector('input[type="file"]');
  const status = wrap.querySelector('[data-file-status]');
  if (!input || !status) return;
  const updateStatus = () => {
    const count = input.files ? input.files.length : 0;
    if (!count) {
      status.textContent = input.dataset.emptyLabel || 'No files selected';
      return;
    }
    if (count === 1) {
      const fileName = input.files[0]?.name || (input.dataset.singleLabel || '1 file selected');
      status.textContent = fileName;
      return;
    }
    status.textContent = (input.dataset.multipleLabel || '{count} files selected').replace('{count}', String(count));
  };
  input.addEventListener('change', updateStatus);
  updateStatus();
});

// v25: phone-first Services goal flow.
document.querySelectorAll('[data-mobile-solution-flow]').forEach((wrap) => {
  const buttons = Array.from(wrap.querySelectorAll('[data-goal-target]'));
  const panels = Array.from(wrap.querySelectorAll('[data-goal-panel]'));
  if (!buttons.length || !panels.length) return;

  const setActive = (target) => {
    buttons.forEach((button) => {
      const active = button.getAttribute('data-goal-target') === target;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach((panel) => {
      const active = panel.getAttribute('data-goal-panel') === target;
      panel.classList.toggle('active', active);
      panel.classList.remove('expanded');
      const expand = panel.querySelector('[data-goal-expand]');
      if (expand) {
        const isFr = (document.documentElement.lang || '').toLowerCase().startsWith('fr');
        expand.textContent = isFr ? 'Voir les détails' : 'See details';
        expand.setAttribute('aria-expanded', 'false');
      }
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => setActive(button.getAttribute('data-goal-target')));
  });

  panels.forEach((panel) => {
    const expand = panel.querySelector('[data-goal-expand]');
    if (!expand) return;
    expand.addEventListener('click', () => {
      const isFr = (document.documentElement.lang || '').toLowerCase().startsWith('fr');
      const expanded = panel.classList.toggle('expanded');
      expand.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      expand.textContent = expanded
        ? (isFr ? 'Masquer les détails' : 'Hide details')
        : (isFr ? 'Voir les détails' : 'See details');
    });
  });
});

// v27: contact hash deep-links — select intake lane (mobile uses full visible form; no advanced toggle).
function applyContactIntakeHash() {
  const target = (window.location.hash || '').replace('#', '');
  document.querySelectorAll('[data-guided-intake]').forEach((wrap) => {
    if (!target) return;
    const laneButton = wrap.querySelector(`[data-intake-target="${target}"]`);
    if (!laneButton) return;
    laneButton.click();
    if (typeof window.refreshIntakeBrief === 'function') {
      window.refreshIntakeBrief(wrap);
    }
    const panels = wrap.querySelector('.intake-panels');
    const scrollEl = panels || document.querySelector('.contact-intake-section');
    if (scrollEl) {
      setTimeout(() => scrollEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  });
}

applyContactIntakeHash();
window.addEventListener('hashchange', applyContactIntakeHash);

// v28: Services → Contact prefill + mobile contact power UX (stepper, lane label, brief sheet, optional lane fields).
(function () {
  const PREFILL_KEY = 'zad_contact_prefill';
  document.addEventListener(
    'click',
    (e) => {
      const link = e.target.closest('a[data-contact-prefill]');
      if (!link) return;
      try {
        sessionStorage.setItem(PREFILL_KEY, link.getAttribute('data-contact-prefill') || '');
      } catch (_) {}
    },
    true
  );

  function applyContactPrefill() {
    const ta = document.querySelector('.contact-workspace-v14 textarea[name="additional_context"]');
    if (!ta) return;
    try {
      const v = sessionStorage.getItem(PREFILL_KEY);
      if (!v) return;
      sessionStorage.removeItem(PREFILL_KEY);
      const cur = ta.value.trim();
      ta.value = cur ? `${cur}\n\n${v}` : v;
    } catch (_) {}
  }

  applyContactPrefill();

  let mobileContactTeardown = null;

  function syncContactMobileActiveLane(wrap) {
    const status = wrap.querySelector('[data-contact-active-lane]');
    if (!status) return;
    const isFr = (document.documentElement.lang || '').toLowerCase().startsWith('fr');
    const btn = wrap.querySelector('[data-intake-target].active');
    if (!btn) {
      status.textContent = '';
      return;
    }
    const title = (btn.querySelector('span') && btn.querySelector('span').textContent.trim()) || btn.textContent.trim();
      status.textContent = isFr ? `Onglet : ${title}` : `You're editing: ${title}`;
  }

  function initMobileContactPowerUX() {
    if (mobileContactTeardown) {
      mobileContactTeardown();
      mobileContactTeardown = null;
    }

    const workspace = document.querySelector('.contact-workspace-v14');
    if (!workspace) return;

    const wrap = workspace.querySelector('[data-guided-intake]');
    const form = workspace.querySelector('form.guided-intake-form');
    if (!wrap || !form) return;

    if (!isMobileDeviceMode()) {
      const sheet = workspace.querySelector('#contact-brief-sheet-panel');
      if (sheet) sheet.classList.remove('contact-brief-sheet-open');
      return;
    }

    const cleanups = [];
    const stepperItems = () => [...form.querySelectorAll('.contact-mobile-stepper [data-contact-step-index]')];

    function setStepperCurrent(idx) {
      stepperItems().forEach((li) => {
        const i = parseInt(li.getAttribute('data-contact-step-index'), 10);
        const on = i === idx;
        li.classList.toggle('is-current', on);
        const jump = li.querySelector('.contact-step-jump');
        if (jump) {
          if (on) jump.setAttribute('aria-current', 'step');
          else jump.removeAttribute('aria-current');
        }
      });
    }

    const stepTargets = [
      { idx: 0, el: form.querySelector('.intake-choice-grid') },
      { idx: 1, el: form.querySelector('.intake-panels') },
      { idx: 2, el: form.querySelector('.contact-basics') },
      { idx: 3, el: form.querySelector('.contact-form-tail') }
    ].filter((s) => s.el);

    function computeStepperIndexFromScroll() {
      if (!stepTargets.length) return 0;
      const mid = window.innerHeight * 0.33;
      let bestIdx = stepTargets[0].idx;
      let bestScore = -Infinity;
      stepTargets.forEach(({ idx, el }) => {
        const rect = el.getBoundingClientRect();
        const visibleH = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
        if (visibleH < 12) return;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.abs(centerY - mid);
        const score = visibleH - dist * 0.35;
        if (score > bestScore) {
          bestScore = score;
          bestIdx = idx;
        }
      });
      return bestIdx;
    }

    let stepperRaf = 0;
    function updateStepperFromScroll() {
      if (stepperRaf) cancelAnimationFrame(stepperRaf);
      stepperRaf = requestAnimationFrame(() => {
        stepperRaf = 0;
        setStepperCurrent(computeStepperIndexFromScroll());
      });
    }

    if (stepTargets.length) {
      updateStepperFromScroll();
      window.addEventListener('scroll', updateStepperFromScroll, { passive: true });
      window.addEventListener('resize', updateStepperFromScroll);
      cleanups.push(() => {
        window.removeEventListener('scroll', updateStepperFromScroll);
        window.removeEventListener('resize', updateStepperFromScroll);
        if (stepperRaf) cancelAnimationFrame(stepperRaf);
      });
    }

    const stepperOl = form.querySelector('.contact-mobile-stepper ol');
    let stepJumpScrollTimer = 0;
    function scrollContactStepTargetIntoView(el) {
      if (!el) return;
      const headerOffset = 88;
      const rect = el.getBoundingClientRect();
      const y = window.scrollY + rect.top - headerOffset;
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: Math.max(0, y), behavior: smooth ? 'smooth' : 'auto' });
      if (stepJumpScrollTimer) clearTimeout(stepJumpScrollTimer);
      stepJumpScrollTimer = window.setTimeout(() => {
        stepJumpScrollTimer = 0;
        updateStepperFromScroll();
      }, smooth ? 320 : 32);
    }
    function onStepperJumpClick(e) {
      const btn = e.target.closest('.contact-step-jump');
      if (!btn) return;
      const li = btn.closest('[data-contact-step-index]');
      if (!li) return;
      const idx = parseInt(li.getAttribute('data-contact-step-index'), 10);
      const row = stepTargets.find((s) => s.idx === idx);
      scrollContactStepTargetIntoView(row?.el);
    }
    if (stepperOl) {
      stepperOl.addEventListener('click', onStepperJumpClick);
      cleanups.push(() => {
        stepperOl.removeEventListener('click', onStepperJumpClick);
        if (stepJumpScrollTimer) clearTimeout(stepJumpScrollTimer);
      });
    }

    syncContactMobileActiveLane(wrap);
    const laneCtl = new AbortController();
    wrap.querySelectorAll('[data-intake-target]').forEach((btn) => {
      btn.addEventListener(
        'click',
        () => setTimeout(() => syncContactMobileActiveLane(wrap), 0),
        { signal: laneCtl.signal }
      );
    });

    const sheet = workspace.querySelector('#contact-brief-sheet-panel');
    const sheetToggle = workspace.querySelector('[data-contact-brief-sheet-toggle]');
    const onBriefToggle = () => {
      if (!sheet || !sheetToggle) return;
      const open = !sheet.classList.contains('contact-brief-sheet-open');
      sheet.classList.toggle('contact-brief-sheet-open', open);
      sheetToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      const isFr = (document.documentElement.lang || '').toLowerCase().startsWith('fr');
      const hint = sheetToggle.querySelector('.contact-brief-sheet-hint');
      if (hint) {
        hint.textContent = open
          ? (isFr ? 'Fermer' : 'Tap to collapse')
          : (isFr ? 'Ouvrir' : 'Tap to expand');
      }
    };
    if (sheetToggle) sheetToggle.addEventListener('click', onBriefToggle);

    form.querySelectorAll('fieldset.intake-panel .form-grid.mt-20').forEach((grid) => {
      if (grid.dataset.contactLaneMoreBound) return;
      grid.dataset.contactLaneMoreBound = '1';
      grid.classList.add('contact-lane-extra-collapsible');
      const isFr = (document.documentElement.lang || '').toLowerCase().startsWith('fr');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'contact-lane-more-btn';
      btn.setAttribute('data-contact-injected', 'lane-more');
      btn.textContent = isFr ? 'Autres champs' : 'More fields (optional)';
      btn.setAttribute('aria-expanded', 'false');
      grid.parentNode.insertBefore(btn, grid);
      btn.addEventListener('click', () => {
        const ex = grid.classList.toggle('is-expanded');
        btn.setAttribute('aria-expanded', ex ? 'true' : 'false');
        btn.textContent = ex
          ? (isFr ? 'Masquer' : 'Hide optional fields')
          : (isFr ? 'Autres champs' : 'More fields (optional)');
      });
    });

    mobileContactTeardown = () => {
      cleanups.forEach((fn) => fn());
      laneCtl.abort();
      if (sheetToggle) sheetToggle.removeEventListener('click', onBriefToggle);
      form.querySelectorAll('[data-contact-injected="lane-more"]').forEach((n) => n.remove());
      form.querySelectorAll('.form-grid.mt-20.contact-lane-extra-collapsible').forEach((grid) => {
        grid.classList.remove('contact-lane-extra-collapsible', 'is-expanded');
        delete grid.dataset.contactLaneMoreBound;
      });
      stepperItems().forEach((li) => li.classList.remove('is-current'));
      if (sheet) {
        sheet.classList.remove('contact-brief-sheet-open');
        if (sheetToggle) sheetToggle.setAttribute('aria-expanded', 'false');
      }
    };
  }

  initMobileContactPowerUX();
  window.addEventListener('resize', () => {
    syncMobileDeviceClass();
    initMobileContactPowerUX();
  });
  window.addEventListener('orientationchange', () => {
    requestAnimationFrame(() => initMobileContactPowerUX());
  });
})();
