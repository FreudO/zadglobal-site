const menuButton = document.querySelector('[data-menu-button]');
const navLinks = document.querySelector('[data-nav-links]');
if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', navLinks.classList.contains('open'));
  });
}

function isMobileDeviceMode() {
  const smallViewport = window.matchMedia('(max-width: 760px)').matches;
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
  return smallViewport && mobileUA;
}

function syncMobileDeviceClass() {
  document.body.classList.toggle('is-mobile-device', isMobileDeviceMode());
}

syncMobileDeviceClass();
window.addEventListener('resize', syncMobileDeviceClass);

const forms = document.querySelectorAll('form[data-static-form]');
forms.forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const note = form.querySelector('[data-form-note]');
    if (note) {
      const isFr = (document.documentElement.lang || '').toLowerCase().startsWith('fr');
      note.textContent = isFr
        ? 'Merci — votre demande a bien ete recue. Notre equipe vous contactera rapidement.'
        : 'Thank you - your request has been received. Our team will contact you shortly.';
    }
  });
});

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
      focus.textContent = document.documentElement.lang === 'fr' ? 'Aucune priorité sélectionnée. Choisissez tous les besoins pertinents.' : 'No focus selected yet. Choose all priorities that apply.';
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
      fr: ['Exemples de documents, emails, WhatsApp ou formulaires.', 'Outils et passages de main actuels : CRM, Excel, ERP, inbox, validations.', 'Volume mensuel, questions répétitives et points de blocage.']
    },
    software: {
      en: ['Current systems, links, exports, screenshots, or workflow examples.', 'User roles, permissions, integrations, reports, and must-have actions.', 'Timeline, launch constraints, and what the current tools cannot do.'],
      fr: ['Systèmes actuels, liens, exports, captures ou exemples de workflow.', 'Rôles, permissions, intégrations, rapports et actions indispensables.', 'Délai, contraintes de lancement et limites des outils actuels.']
    },
    training: {
      en: ['Existing SOPs, manuals, videos, slides, or onboarding documents.', 'Roles to train, number of learners, common mistakes, and target behavior.', 'Whether training should be live, online, hybrid, or supported by an AI coach.'],
      fr: ['SOP, manuels, vidéos, slides ou documents d’onboarding existants.', 'Rôles à former, nombre de personnes, erreurs fréquentes et comportements attendus.', 'Format souhaité : présentiel, en ligne, hybride ou coach IA interne.']
    },
    robotics: {
      en: ['Site type, photos, inspection routines, safety constraints, and connectivity limits.', 'Existing hardware: drones, sensors, cameras, robots, vehicles, or none yet.', 'The field decision management needs to make from the data.'],
      fr: ['Type de site, photos, routines d’inspection, contraintes sécurité et connectivité.', 'Matériel existant : drones, capteurs, caméras, robots, véhicules ou rien encore.', 'La décision terrain que la direction veut mieux prendre avec les données.']
    },
    finance: {
      en: ['Clarify whether this is company operational finance or personal wealth coordination.', 'Budgets, account types, cost centers, staff allocation, or planning timeline.', 'Decision makers involved and any compliance or suitability constraints.'],
      fr: ['Préciser s’il s’agit de finance opérationnelle entreprise ou de patrimoine personnel.', 'Budgets, types de comptes, centres de coûts, effectifs ou calendrier de décision.', 'Décideurs impliqués et contraintes de conformité ou d’adéquation.']
    },
    general: {
      en: ['Countries involved, stakeholders, partner expectations, and desired outcome.', 'Any existing documents, supplier context, quality requirements, or deadlines.', 'What would make the first conversation useful.'],
      fr: ['Pays concernés, parties prenantes, attentes partenaires et résultat recherché.', 'Documents existants, contexte fournisseur, exigences qualité ou délais.', 'Ce qui rendrait le premier échange utile.']
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
        ? (lang === 'fr' ? `${count} priorité${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''}` : `${count} selected priorit${count === 1 ? 'y' : 'ies'}`)
        : (lang === 'fr' ? 'Portée combinée' : 'Combined scope');
    }

    if (focus) {
      if (!count) {
        focus.textContent = lang === 'fr'
          ? 'Aucune sélection. Sélectionnez tous les services pertinents, même dans plusieurs onglets.'
          : 'No selections yet. Select all relevant services, even across multiple tabs.';
      } else {
        focus.innerHTML = Object.entries(selections).map(([lane, items]) => {
          const chips = items.map((item) => `<span class="brief-selected-chip">${item}</span>`).join('');
          return `<div class="brief-lane-group"><strong>${laneLabels[lane]?.[lang] || lane}<span>${items.length}</span></strong><div class="brief-chip-list">${chips}</div></div>`;
        }).join('');
      }
    }

    if (engagement) {
      if (!count) engagement.textContent = lang === 'fr' ? 'Diagnostic simple. Ajoutez les priorités qui s’appliquent.' : 'Single-lane diagnostic. Add the priorities that apply.';
      else if (laneCount === 1) engagement.textContent = lang === 'fr' ? 'Mission ciblée dans un domaine, avec contexte déjà structuré.' : 'Focused single-lane engagement with structured context.';
      else engagement.textContent = lang === 'fr' ? `Mission combinée sur ${laneCount} domaines. ZAD pourra préparer une feuille de route intégrée.` : `Combined engagement across ${laneCount} lanes. ZAD can prepare an integrated roadmap.`;
    }

    if (outcome) {
      outcome.textContent = lang === 'fr'
        ? 'Cette synthèse nous aide à orienter le premier échange, identifier les dépendances entre équipes, et éviter les questions de clarification répétitives.'
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
  const world = document.querySelector('[data-case-world]');
  if (world) {
    const buttons = [...world.querySelectorAll('[data-world-tab]')];
    const panels = [...world.querySelectorAll('[data-world-panel]')];
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-world-tab');
        buttons.forEach((b) => b.classList.toggle('active', b === btn));
        panels.forEach((p) => p.classList.toggle('active', p.getAttribute('data-world-panel') === target));
      });
    });
  }
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
      });
    });
  });
})();


// v18: language switching preserves active section/panel, service-map deep links open the correct domain,
// and Cases deep links open the right case world.
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

// v25: phone-first Solutions goal flow.
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

// v24 + v26: mobile contact mode + hash deep-links. On phone, lane tabs and panels live inside
// .mobile-advanced-section, which is hidden until .mobile-advanced-open — open that first, then select the lane.
function setGuidedIntakeMobileOpen(wrap, open) {
  const toggle = wrap.querySelector('[data-mobile-advanced-toggle]');
  if (!isMobileDeviceMode() || !toggle) return;
  wrap.classList.toggle('mobile-advanced-open', open);
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  const isFr = (document.documentElement.lang || '').toLowerCase().startsWith('fr');
  const closeLbl = toggle.dataset.labelClose || (isFr ? 'Masquer les details' : 'Hide detailed scope');
  const openLbl = toggle.dataset.labelOpen || (isFr ? 'Ajouter des details (optionnel)' : 'Add detailed scope (optional)');
  toggle.textContent = open ? closeLbl : openLbl;
}

function applyContactIntakeHash() {
  const target = (window.location.hash || '').replace('#', '');
  document.querySelectorAll('[data-guided-intake]').forEach((wrap) => {
    const laneButton = target ? wrap.querySelector(`[data-intake-target="${target}"]`) : null;

    if (!laneButton) {
      setGuidedIntakeMobileOpen(wrap, false);
      return;
    }

    const activate = () => {
      laneButton.click();
      if (typeof window.refreshIntakeBrief === 'function') {
        window.refreshIntakeBrief(wrap);
      }
    };

    if (isMobileDeviceMode()) {
      setGuidedIntakeMobileOpen(wrap, true);
      requestAnimationFrame(() => {
        requestAnimationFrame(activate);
      });
    } else {
      activate();
    }

    const section = document.querySelector('.contact-intake-section');
    if (section) {
      setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  });
}

document.querySelectorAll('[data-guided-intake]').forEach((wrap) => {
  const toggle = wrap.querySelector('[data-mobile-advanced-toggle]');
  if (!toggle || !isMobileDeviceMode()) return;
  toggle.addEventListener('click', () => {
    const open = !wrap.classList.contains('mobile-advanced-open');
    setGuidedIntakeMobileOpen(wrap, open);
  });
});

applyContactIntakeHash();
window.addEventListener('hashchange', applyContactIntakeHash);
