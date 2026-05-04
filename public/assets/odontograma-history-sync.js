(function () {
  // CLINIDENT_LANDING_GUARD_V1
  function __isPublicLandingRoute() {
    var p = (window.location.pathname || '').toLowerCase();
    return p === '/' || p === '/index.html' || p === '/la92' || p === '/la92/';
  }

  function __hasSoftwareSession() {
    try {
      return !!(localStorage.getItem('auth_token') || localStorage.getItem('try_token'));
    } catch (_) {
      return false;
    }
  }

  if (__isPublicLandingRoute() || !__hasSoftwareSession()) {
    return;
  }

  const API_BASE = 'https://clinident.trycompany.es/api';
  const SCRIPT_VER = 'odonto-sync-v1';
  const CACHE_KEY = 'clinident_odonto_patient_cache_v1';

  let patientsCache = null;
  let cacheLoadedAt = 0;
  let lastToothLogged = '';
  let lastToothLogTs = 0;

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getUser() {
    try {
      const raw = localStorage.getItem('auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function roleAllowed() {
    const u = getUser() || {};
    const role = norm(u.role || '');
    return role === 'doctor' || role === 'assistant' || role === 'auxiliar';
  }

  function token() {
    return localStorage.getItem('auth_token') || '';
  }

  async function api(path, options) {
    const headers = Object.assign(
      { 'Content-Type': 'application/json', Accept: 'application/json' },
      (options && options.headers) || {}
    );
    const t = token();
    if (t) headers['X-Session-Token'] = t;

    const res = await fetch(API_BASE + path, Object.assign({}, options || {}, { headers }));
    const txt = await res.text();
    let data = null;
    try { data = txt ? JSON.parse(txt) : null; } catch (_) { data = txt; }
    if (!res.ok) {
      const msg = (data && (data.message || data.error || data.details)) || ('HTTP ' + res.status);
      throw new Error(msg);
    }
    return data;
  }

  function loadCacheFromStorage() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (Array.isArray(p.items)) {
        patientsCache = p.items;
        cacheLoadedAt = Number(p.ts || 0);
      }
    } catch (_) {}
  }

  function saveCacheToStorage(items) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items: items || [] }));
    } catch (_) {}
  }

  async function getPatientsCached() {
    if (!patientsCache) loadCacheFromStorage();
    const fresh = Date.now() - cacheLoadedAt < 5 * 60 * 1000;
    if (patientsCache && fresh) return patientsCache;

    const rows = await api('/patients?select=id,first_name,last_name,document_number,clinical_history_code&limit=500');
    patientsCache = Array.isArray(rows) ? rows : [];
    cacheLoadedAt = Date.now();
    saveCacheToStorage(patientsCache);
    return patientsCache;
  }

  function getContextText() {
    const blocks = [];
    const open = document.querySelectorAll('[role="dialog"],[data-state="open"],main');
    for (let i = 0; i < open.length; i++) {
      const tx = (open[i].textContent || '').trim();
      if (tx) blocks.push(tx);
    }
    blocks.push(document.title || '');
    return blocks.join('\n');
  }

  function extractUuidFromUrl() {
    const m = String(location.href).match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    return m ? m[0] : null;
  }

  async function detectActivePatient() {
    const list = await getPatientsCached();
    if (!list.length) return null;

    const byUrl = extractUuidFromUrl();
    if (byUrl) {
      const p = list.find(x => String(x.id).toLowerCase() === byUrl.toLowerCase());
      if (p) return p;
    }

    const txt = norm(getContextText());
    if (!txt) return null;

    const docs = txt.match(/\b\d{6,14}\b/g) || [];
    for (const d of docs) {
      const p = list.find(x => String(x.document_number || '') === d);
      if (p) return p;
    }

    for (const p of list) {
      const hc = norm(p.clinical_history_code || '');
      if (hc && txt.indexOf(hc) >= 0) return p;
    }

    for (const p of list) {
      const full = norm((p.first_name || '') + ' ' + (p.last_name || ''));
      if (full && full.length >= 6 && txt.indexOf(full) >= 0) return p;
    }

    return null;
  }


  function humanReadableNote(operation, tooth, patient, extra) {
    var patientName = ((patient.first_name || '') + ' ' + (patient.last_name || '')).trim() || 'paciente';
    if (operation === 'SELECCION_PIEZA') {
      return 'Durante la atencion de ' + patientName + ' se selecciono la pieza dental ' + (tooth || '-') + ' en el odontograma para registro clinico.';
    }
    if (operation === 'INICIO_CITA_ODONTOGRAMA') {
      return 'Se inicio cita clinica con apoyo de odontograma para ' + patientName + '.';
    }
    if (operation === 'FIN_CITA_ODONTOGRAMA') {
      return 'Se finalizo cita clinica registrada en odontograma para ' + patientName + '.';
    }
    if (operation === 'MODO_AUTO_ODONTOGRAMA') {
      return 'El profesional activo el modo automatico de odontograma durante la atencion de ' + patientName + '.';
    }
    if (operation === 'LIMPIEZA_HISTORIAL_LOCAL_ODONTOGRAMA') {
      return 'Se ejecuto limpieza del historial local de productividad del odontograma.';
    }
    return 'Se registro evento de odontograma (' + operation + ')' + (tooth ? (' sobre pieza ' + tooth) : '') + '.';
  }
  async function writeHistory(operation, tooth, extra) {
    if (!roleAllowed()) return;

    let patient = null;
    try {
      patient = await detectActivePatient();
    } catch (_) {
      return;
    }
    if (!patient || !patient.id) return;

    const u = getUser() || {};
    const payload = {
      patient_id: patient.id,
      diagnosis: 'ODONTOGRAMA_EVENTO',
      treatment: operation,
      tooth_number: tooth || null,
      notes: humanReadableNote(operation, tooth, patient, extra),
      attachments: {
        source: SCRIPT_VER,
        route: location.pathname,
        operation: operation,
        tooth: tooth || null,
        patient_name: ((patient.first_name || '') + ' ' + (patient.last_name || '')).trim(),
        user_id: u.id || null,
        user_role: u.role || null,
        extra: extra || null,
        at: new Date().toISOString(),
      },
      is_active: true,
      created_by: u.id || null,
    };

    try {
      await api('/patient_health_history', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify([payload]),
      });
    } catch (_) {
      // silent to avoid blocking UI
    }
  }

  function debounceToothLog(tooth) {
    const now = Date.now();
    if (!tooth) return;
    if (tooth === lastToothLogged && now - lastToothLogTs < 4000) return;
    lastToothLogged = tooth;
    lastToothLogTs = now;
    writeHistory('SELECCION_PIEZA', tooth, { mode: 'panel' });
  }

  function bindPanel(panel) {
    if (!panel || panel.dataset.syncBound === '1') return;

    panel.addEventListener('click', function (ev) {
      const target = ev.target;
      if (!target) return;
      const btn = target.closest('button');
      if (!btn) return;

      const tooth = btn.getAttribute('data-tooth');
      if (tooth) {
        debounceToothLog(tooth);
        return;
      }

      const id = btn.id || '';
      if (id === 'odonto-start-session') writeHistory('INICIO_CITA_ODONTOGRAMA', null, null);
      if (id === 'odonto-stop-session') writeHistory('FIN_CITA_ODONTOGRAMA', null, null);
      if (id === 'odonto-auto-mode') writeHistory('MODO_AUTO_ODONTOGRAMA', null, null);
      if (id === 'odonto-clear-history') writeHistory('LIMPIEZA_HISTORIAL_LOCAL_ODONTOGRAMA', null, null);
    }, true);

    panel.dataset.syncBound = '1';
  }

  function watchPanel() {
    const panel = document.getElementById('odontograma-visual-panel');
    if (panel) bindPanel(panel);
  }

  function startObservers() {
    watchPanel();
    setInterval(watchPanel, 1000);

    const mo = new MutationObserver(function () {
      watchPanel();
    });
    mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObservers);
  } else {
    startObservers();
  }
})();

