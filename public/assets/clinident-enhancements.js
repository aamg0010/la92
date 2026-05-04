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
  const ALERT_FLAG = 'clinident_ext_alerts_shown';
  const PANEL_ID = 'clinident-ext-panel';
  const BTN_ID = 'clinident-ext-btn';
  const TOAST_WRAP_ID = 'clinident-ext-toasts';

  let alertsShown = false;

  function getAuthToken() {
    try {
      return localStorage.getItem('auth_token') || localStorage.getItem('try_token') || '';
    } catch (_) {
      return '';
    }
  }

  async function api(path, options) {
    const token = getAuthToken();
    const headers = Object.assign(
      {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      (options && options.headers) || {}
    );

    if (token) headers['X-Session-Token'] = token;

    const res = await fetch(API_BASE + path, Object.assign({}, options || {}, { headers }));
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = text;
    }

    if (!res.ok) {
      const msg = (data && (data.message || data.error || data.details)) || ('HTTP ' + res.status);
      throw new Error(msg);
    }

    return data;
  }

  function injectStyles() {
    if (document.getElementById('clinident-ext-styles')) return;
    const style = document.createElement('style');
    style.id = 'clinident-ext-styles';
        style.textContent = [
      '#' + BTN_ID + '{position:fixed;left:18px;bottom:18px;z-index:9998;background:linear-gradient(135deg,#0b1f2a,#153547);color:#f8fafc;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:11px 16px;font:700 13px/1 "Segoe UI",system-ui,sans-serif;letter-spacing:.25px;box-shadow:0 14px 34px rgba(10,23,33,.42);cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}',
      '#' + BTN_ID + ':hover{transform:translateY(-1px);box-shadow:0 18px 38px rgba(10,23,33,.52)}',
      '#' + PANEL_ID + '{position:fixed;left:18px;bottom:66px;width:min(96vw,560px);max-height:84vh;overflow:auto;background:linear-gradient(180deg,#fcfcfd,#f5f7fa);border:1px solid #d8dde6;border-radius:18px;z-index:9999;box-shadow:0 26px 60px rgba(15,23,42,.26);font:13px/1.5 "Segoe UI",system-ui,sans-serif;color:#0f172a}',
      '#' + PANEL_ID + ' .head{display:flex;justify-content:space-between;align-items:flex-start;padding:16px 16px 12px;border-bottom:1px solid #e3e8ef;position:sticky;top:0;background:linear-gradient(180deg,#ffffff,#f7f9fc)}',
      '#' + PANEL_ID + ' .head .title{font-size:15px;font-weight:800;line-height:1.2;color:#0f172a}',
      '#' + PANEL_ID + ' .head .sub{font-size:11px;color:#64748b;margin-top:3px}',
      '#' + PANEL_ID + ' .body{padding:14px 14px 16px}',
      '#' + PANEL_ID + ' .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '#' + PANEL_ID + ' .tabs{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px;padding-bottom:5px;border-bottom:1px dashed #d8e0ea}',
      '#' + PANEL_ID + ' .tab{border:1px solid #d5dbe5;background:#ffffff;padding:7px 11px;border-radius:999px;cursor:pointer;font-weight:600;color:#334155;transition:all .16s ease}',
      '#' + PANEL_ID + ' .tab:hover{border-color:#0b3b53;color:#0b3b53;background:#f8fbff}',
      '#' + PANEL_ID + ' .tab.active{background:linear-gradient(135deg,#0b1f2a,#1e4a60);color:#f8fafc;border-color:#173e52;box-shadow:0 8px 20px rgba(15,23,42,.22)}',
      '#' + PANEL_ID + ' label{display:block;font-size:11px;font-weight:700;letter-spacing:.2px;color:#334155;margin:10px 0 5px}',
      '#' + PANEL_ID + ' input,#' + PANEL_ID + ' textarea,#' + PANEL_ID + ' select{width:100%;box-sizing:border-box;border:1px solid #d0d7e2;border-radius:11px;padding:10px 11px;font-size:13px;background:#fff;color:#0f172a;transition:border-color .14s ease,box-shadow .14s ease}',
      '#' + PANEL_ID + ' input:focus,#' + PANEL_ID + ' textarea:focus,#' + PANEL_ID + ' select:focus{outline:none;border-color:#1f5a77;box-shadow:0 0 0 3px rgba(31,90,119,.14)}',
      '#' + PANEL_ID + ' textarea{min-height:78px;resize:vertical}',
      '#' + PANEL_ID + ' #cex-tab-perfil,#' + PANEL_ID + ' #cex-tab-rec,#' + PANEL_ID + ' #cex-tab-formula,#' + PANEL_ID + ' #cex-tab-consent,#' + PANEL_ID + ' #cex-tab-cierre{background:#ffffff;border:1px solid #e3e8ef;border-radius:13px;padding:11px 11px 13px;box-shadow:0 4px 14px rgba(148,163,184,.08)}',
      '#' + PANEL_ID + ' .actions{display:flex;gap:8px;justify-content:flex-end;margin-top:11px;padding-top:9px;border-top:1px dashed #d9e1eb}',
      '#' + PANEL_ID + ' button.save{background:linear-gradient(135deg,#0f172a,#1f4b63);color:#fff;border:none;border-radius:11px;padding:8px 14px;cursor:pointer;font-weight:700;letter-spacing:.15px}',
      '#' + PANEL_ID + ' button.ghost{background:#ffffff;border:1px solid #d0d7e2;border-radius:11px;padding:7px 12px;cursor:pointer;color:#334155;font-weight:600}',
      '#' + PANEL_ID + ' .msg{margin-top:9px;font-size:12px;font-weight:700}',
      '@media (max-width:640px){#' + PANEL_ID + '{left:10px;right:10px;bottom:64px;width:auto;max-height:86vh}#' + BTN_ID + '{left:10px;bottom:12px}#' + PANEL_ID + ' .grid{grid-template-columns:1fr}}',
      '#' + TOAST_WRAP_ID + '{position:fixed;top:14px;left:14px;z-index:10000;display:flex;flex-direction:column;gap:8px;width:min(94vw,360px)}',
      '#' + TOAST_WRAP_ID + ' .t{background:#0f172a;color:#fff;border-radius:11px;padding:10px 12px;box-shadow:0 12px 28px rgba(2,6,23,.48)}',
      '#' + TOAST_WRAP_ID + ' .t.warn{background:#7c2d12}',
      '#' + TOAST_WRAP_ID + ' .t.ok{background:#14532d}',
      '#' + TOAST_WRAP_ID + ' .t .ttl{font-weight:800;margin-bottom:3px}',
      '#' + TOAST_WRAP_ID + ' .t button{margin-top:6px;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;border-radius:6px;padding:4px 8px;cursor:pointer}'
    ].join('');
    document.head.appendChild(style);
  }

  function toast(title, text, kind) {
    let wrap = document.getElementById(TOAST_WRAP_ID);
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = TOAST_WRAP_ID;
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = 't ' + (kind || '');
    el.innerHTML = '<div class="ttl">' + title + '</div><div>' + text + '</div><button>Cerrar</button>';
    el.querySelector('button').addEventListener('click', function () { el.remove(); });
    wrap.appendChild(el);
    setTimeout(function () { if (el && el.parentNode) el.remove(); }, 12000);
  }


  function getCurrentUser() {
    try {
      var raw = localStorage.getItem('auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }
  async function fetchPatients() {
    return api('/patients?select=id,first_name,last_name,document_number&order=created_at.desc&limit=300');
  }

  async function fetchPatientEntries(patientId, diagnosis) {
    let q = '/patient_health_history?patient_id=eq.' + encodeURIComponent(patientId) + '&is_active=is.true&order=created_at.desc&limit=50';
    if (diagnosis) q += '&diagnosis=eq.' + encodeURIComponent(diagnosis);
    return api(q);
  }

  async function insertEntry(payload) {
    return api('/patient_health_history', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify([payload]),
    });
  }

  function buildPanel() {
    if (document.getElementById(PANEL_ID)) return document.getElementById(PANEL_ID);

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.display = 'none';
    panel.innerHTML = [
      '<div class="head"><div><div class="title">Clinico+ Premium</div><div class="sub">Flujo clinico elegante, claro e intuitivo</div></div><button class="ghost" data-close="1">Cerrar</button></div>',
      '<div class="body">',
      '<label>Paciente</label><select id="cex-patient"><option value="">Seleccionar paciente...</option></select>',
      '<div class="tabs">',
      '<button class="tab active" data-tab="perfil">Perfil / Antecedentes</button>',
      '<button class="tab" data-tab="rec">Recomendaciones</button>',
      '<button class="tab" data-tab="formula">Formula medica</button>',
      '<button class="tab" data-tab="consent">Consentimientos</button>',
      '<button class="tab" data-tab="cierre">Cierre manual</button>',
      '</div>',
      '<div id="cex-tab-perfil">',
      '<div class="grid">',
      '<div><label>Responsable</label><input id="cex-resp" placeholder="Nombre responsable" /></div>',
      '<div><label>Contacto responsable</label><input id="cex-resp-phone" placeholder="Telefono" /></div>',
      '</div>',
      '<div class="grid">',
      '<div><label>Acompanantes</label><input id="cex-acomp" placeholder="Nombres" /></div>',
      '<div><label>Doctor asignado</label><input id="cex-doc" placeholder="Doctor" /></div>',
      '</div>',
      '<label>Motivo de consulta</label><textarea id="cex-motivo" placeholder="Motivo principal"></textarea>',
      '<label>Antecedentes</label><textarea id="cex-ant" placeholder="Antecedentes importantes"></textarea>',
      '<label>Alergias</label><textarea id="cex-alerg" placeholder="Alergias conocidas"></textarea>',
      '<label>Otros elementos importantes</label><textarea id="cex-otros" placeholder="Riesgos, cuidados especiales, etc."></textarea>',
      '<label>Foto (captura movil)</label><input id="cex-foto" type="file" accept="image/*" capture="environment" />',
      '<div class="actions"><button class="save" data-save="perfil">Guardar perfil clinico</button></div>',
      '</div>',
      '<div id="cex-tab-rec" style="display:none">',
      '<label>Recomendacion especial</label><textarea id="cex-rec-text" placeholder="Indicaciones especiales para este paciente"></textarea>',
      '<label>Prioridad</label><select id="cex-rec-pri"><option value="normal">Normal</option><option value="importante">Importante</option><option value="urgente">Urgente</option></select>',
      '<div class="actions"><button class="save" data-save="rec">Guardar recomendacion</button></div>',
      '</div>',
      '<div id="cex-tab-formula" style="display:none">',
      '<label>Medicamento</label><input id="cex-med" placeholder="Ej: Amoxicilina 500mg" />',
      '<div class="grid"><div><label>Dosis</label><input id="cex-dosis" placeholder="1 tableta" /></div><div><label>Frecuencia</label><input id="cex-frec" placeholder="Cada 8 horas" /></div></div>',
      '<div class="grid"><div><label>Duracion</label><input id="cex-dur" placeholder="7 dias" /></div><div><label>Doctor</label><input id="cex-med-doc" placeholder="Doctor tratante" /></div></div>',
      '<label>Indicaciones</label><textarea id="cex-indic" placeholder="Indicaciones adicionales"></textarea>',
      '<div class="actions"><button class="save" data-save="formula">Guardar formula</button></div>',
      '</div>',
      '<div id="cex-tab-consent" style="display:none">',
      '<label>Procedimiento</label><input id="cex-proc" placeholder="Nombre del procedimiento" />',
      '<label>Texto consentimiento</label><textarea id="cex-consent-text" placeholder="Detalle del consentimiento informado"></textarea>',
      '<div class="grid"><div><label>Firmante</label><input id="cex-firm" placeholder="Paciente / responsable" /></div><div><label>Aceptado</label><select id="cex-acept"><option value="si">Si</option><option value="no">No</option></select></div></div>',
      '<div class="actions"><button class="save" data-save="consent">Guardar consentimiento</button></div>',
      '</div>',
      '<div id="cex-tab-cierre" style="display:none">',
      '<label>Diagnostico final</label><textarea id="cex-cierre-diag" placeholder="Diagnostico al finalizar la cita"></textarea>',
      '<label>Procedimiento(s) realizado(s)</label><textarea id="cex-cierre-proc" placeholder="Detalle de procedimientos odontologicos"></textarea>',
      '<label>Evolucion y hallazgos</label><textarea id="cex-cierre-evo" placeholder="Evolucion clinica observada"></textarea>',
      '<label>Formula / medicacion final</label><textarea id="cex-cierre-form" placeholder="Medicamentos e indicaciones finales"></textarea>',
      '<label>Recomendaciones finales</label><textarea id="cex-cierre-rec" placeholder="Cuidados, controles, alertas"></textarea>',
      '<div class="grid"><div><label>Proximo control</label><input id="cex-cierre-control" type="date" /></div><div><label>Cerrar historia</label><select id="cex-cierre-close"><option value="no">No</option><option value="si">Si</option></select></div></div>',
      '<div class="actions"><button class="save" data-save="cierre">Guardar cierre de cita</button></div>',
      '</div>',
      '<div class="msg" id="cex-msg"></div>',
      '</div>'
    ].join('');

    document.body.appendChild(panel);

    panel.querySelector('[data-close="1"]').addEventListener('click', function () {
      panel.style.display = 'none';
    });

    panel.querySelectorAll('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        panel.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        const tab = t.getAttribute('data-tab');
        ['perfil', 'rec', 'formula', 'consent', 'cierre'].forEach(function (k) {
          const sec = panel.querySelector('#cex-tab-' + k);
          if (sec) sec.style.display = (k === tab ? '' : 'none');
        });
      });
    });

    panel.querySelectorAll('[data-save]').forEach(function (b) {
      b.addEventListener('click', handleSave);
    });

    return panel;
  }

  async function readImageAsDataUrl(input) {
    return new Promise(function (resolve) {
      const f = input && input.files && input.files[0];
      if (!f) return resolve('');
      const r = new FileReader();
      r.onload = function () { resolve(String(r.result || '')); };
      r.onerror = function () { resolve(''); };
      r.readAsDataURL(f);
    });
  }

  async function handleSave(ev) {
    const panel = document.getElementById(PANEL_ID);
    const msg = panel.querySelector('#cex-msg');
    const patientId = panel.querySelector('#cex-patient').value;
    const type = ev.currentTarget.getAttribute('data-save');

    if (!patientId) {
      msg.textContent = 'Selecciona un paciente para guardar.';
      msg.style.color = '#b91c1c';
      return;
    }

    try {
      msg.textContent = 'Guardando...';
      msg.style.color = '#334155';

      if (type === 'perfil') {
        const photo = await readImageAsDataUrl(panel.querySelector('#cex-foto'));
        const payload = {
          patient_id: patientId,
          diagnosis: 'PERFIL_EXTENDIDO',
          treatment: null,
          tooth_number: null,
          notes: JSON.stringify({
            responsable: panel.querySelector('#cex-resp').value || '',
            responsable_contacto: panel.querySelector('#cex-resp-phone').value || '',
            acompanantes: panel.querySelector('#cex-acomp').value || '',
            doctor_asignado: panel.querySelector('#cex-doc').value || '',
            motivo_consulta: panel.querySelector('#cex-motivo').value || '',
            antecedentes: panel.querySelector('#cex-ant').value || '',
            alergias: panel.querySelector('#cex-alerg').value || '',
            otros: panel.querySelector('#cex-otros').value || '',
          }),
          attachments: photo ? { tipo: 'foto_paciente', data_url: photo } : null,
          is_active: true,
        };
        await insertEntry(payload);
      }

      if (type === 'rec') {
        await insertEntry({
          patient_id: patientId,
          diagnosis: 'RECOMENDACION_ESPECIAL',
          treatment: panel.querySelector('#cex-rec-pri').value || 'normal',
          notes: panel.querySelector('#cex-rec-text').value || '',
          attachments: { fuente: 'modulo_clinico_plus' },
          is_active: true,
        });
      }

      if (type === 'formula') {
        await insertEntry({
          patient_id: patientId,
          diagnosis: 'FORMULA_MEDICA',
          treatment: panel.querySelector('#cex-med').value || '',
          notes: JSON.stringify({
            dosis: panel.querySelector('#cex-dosis').value || '',
            frecuencia: panel.querySelector('#cex-frec').value || '',
            duracion: panel.querySelector('#cex-dur').value || '',
            doctor: panel.querySelector('#cex-med-doc').value || '',
            indicaciones: panel.querySelector('#cex-indic').value || '',
          }),
          attachments: { fuente: 'modulo_clinico_plus' },
          is_active: true,
        });
      }

      if (type === 'consent') {
        await insertEntry({
          patient_id: patientId,
          diagnosis: 'CONSENTIMIENTO_INFORMADO',
          treatment: panel.querySelector('#cex-proc').value || '',
          notes: panel.querySelector('#cex-consent-text').value || '',
          attachments: {
            aceptado: panel.querySelector('#cex-acept').value === 'si',
            firmante: panel.querySelector('#cex-firm').value || '',
            fecha: new Date().toISOString(),
            fuente: 'modulo_clinico_plus',
          },
          is_active: true,
        });
      }

      if (type === 'cierre') {
        var u = getCurrentUser() || {};
        var diagnostico = panel.querySelector('#cex-cierre-diag').value || '';
        var procedimientos = panel.querySelector('#cex-cierre-proc').value || '';
        var evolucion = panel.querySelector('#cex-cierre-evo').value || '';
        var formulaFinal = panel.querySelector('#cex-cierre-form').value || '';
        var recomendacionesFinales = panel.querySelector('#cex-cierre-rec').value || '';
        var proximoControl = panel.querySelector('#cex-cierre-control').value || '';
        var cerrarHistoria = panel.querySelector('#cex-cierre-close').value === 'si';

        var notaCierre = [
          'Cierre manual de cita',
          diagnostico ? ('Diagnostico final: ' + diagnostico) : '',
          procedimientos ? ('Procedimientos realizados: ' + procedimientos) : '',
          evolucion ? ('Evolucion: ' + evolucion) : '',
          formulaFinal ? ('Formula/medicacion final: ' + formulaFinal) : '',
          recomendacionesFinales ? ('Recomendaciones finales: ' + recomendacionesFinales) : '',
          proximoControl ? ('Proximo control: ' + proximoControl) : '',
          'Historia cerrada: ' + (cerrarHistoria ? 'SI' : 'NO')
        ].filter(Boolean).join('\n');

        if (cerrarHistoria) {
          await api('/patient_health_history?patient_id=eq.' + encodeURIComponent(patientId) + '&is_active=is.true', {
            method: 'PATCH',
            headers: { Prefer: 'return=minimal' },
            body: JSON.stringify({
              is_active: false,
              archived_at: new Date().toISOString(),
              archived_by: u.id || null
            })
          });
        }

        await insertEntry({
          patient_id: patientId,
          diagnosis: 'CIERRE_CITA_MANUAL',
          treatment: cerrarHistoria ? 'CIERRE_HISTORIA' : 'CIERRE_PARCIAL',
          tooth_number: null,
          notes: notaCierre,
          attachments: {
            diagnostico_final: diagnostico,
            procedimientos: procedimientos,
            evolucion: evolucion,
            formula_final: formulaFinal,
            recomendaciones_finales: recomendacionesFinales,
            proximo_control: proximoControl || null,
            historia_cerrada: cerrarHistoria,
            source: 'modulo_clinico_plus',
            at: new Date().toISOString()
          },
          is_active: true,
          created_by: u.id || null
        });
      }

      msg.textContent = 'Registro guardado correctamente.';
      msg.style.color = '#166534';
      toast('Clinident', 'Informacion guardada para el paciente.', 'ok');
    } catch (err) {
      msg.textContent = 'Error: ' + (err && err.message ? err.message : 'No se pudo guardar.');
      msg.style.color = '#b91c1c';
    }
  }

  async function loadPatientsIntoSelect() {
    const panel = buildPanel();
    const sel = panel.querySelector('#cex-patient');
    if (sel.dataset.loaded === '1') return;

    try {
      const patients = await fetchPatients();
      sel.innerHTML = '<option value="">Seleccionar paciente...</option>';
      (patients || []).forEach(function (p) {
        const op = document.createElement('option');
        op.value = p.id;
        op.textContent = [p.first_name || '', p.last_name || '', p.document_number ? ('(' + p.document_number + ')') : ''].join(' ').trim();
        sel.appendChild(op);
      });
      sel.dataset.loaded = '1';
    } catch (err) {
      toast('Clinident', 'No se pudieron cargar pacientes: ' + err.message, 'warn');
    }
  }

  async function showLoginAlerts() {
    if (alertsShown) return;
    if (sessionStorage.getItem(ALERT_FLAG) === '1') return;

    try {
      const items = await api('/inventory_items?select=name,quantity,min_stock,expiration_date,is_active&is_active=is.true&limit=400');
      const today = new Date();
      const thirty = new Date();
      thirty.setDate(today.getDate() + 30);

      const lowStock = (items || []).filter(function (x) {
        return Number(x.quantity || 0) <= Number(x.min_stock || 0);
      });
      const expiring = (items || []).filter(function (x) {
        if (!x.expiration_date) return false;
        const d = new Date(x.expiration_date + 'T00:00:00');
        return d >= today && d <= thirty;
      });

      if (lowStock.length > 0) {
        toast('Alerta inventario', lowStock.length + ' item(s) con stock bajo/minimo.', 'warn');
      }
      if (expiring.length > 0) {
        const names = expiring.slice(0, 3).map(function (x) { return x.name; }).join(', ');
        toast('Proximo a vencer', expiring.length + ' item(s). ' + names, 'warn');
      }

      const recs = await api('/patient_health_history?select=patient_id,notes,created_at,diagnosis,treatment&diagnosis=eq.RECOMENDACION_ESPECIAL&is_active=is.true&order=created_at.desc&limit=5');
      if ((recs || []).length > 0) {
        toast('Recomendaciones especiales', 'Hay ' + recs.length + ' recomendacion(es) clinicas recientes para revisar.', 'ok');
      }

      sessionStorage.setItem(ALERT_FLAG, '1');
      alertsShown = true;
    } catch (_) {
      // silent
    }
  }

  function ensureButtonAndPanel() {
    const path = (location.pathname || '').toLowerCase();
    const hide = path.indexOf('/auth') >= 0;

    let btn = document.getElementById(BTN_ID);
    if (!btn) {
      btn = document.createElement('button');
      btn.id = BTN_ID;
      btn.textContent = 'Clinico+';
      btn.addEventListener('click', async function () {
        const panel = buildPanel();
        await loadPatientsIntoSelect();
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });
      document.body.appendChild(btn);
    }

    const panel = buildPanel();
    if (hide) {
      btn.style.display = 'none';
      panel.style.display = 'none';
    } else {
      btn.style.display = 'block';
    }
  }

  function patchNavigationWatcher() {
    const rawPush = history.pushState;
    const rawReplace = history.replaceState;

    history.pushState = function () {
      rawPush.apply(this, arguments);
      setTimeout(function () {
        ensureButtonAndPanel();
        showLoginAlerts();
      }, 50);
    };

    history.replaceState = function () {
      rawReplace.apply(this, arguments);
      setTimeout(function () {
        ensureButtonAndPanel();
        showLoginAlerts();
      }, 50);
    };

    window.addEventListener('popstate', function () {
      setTimeout(function () {
        ensureButtonAndPanel();
        showLoginAlerts();
      }, 50);
    });
  }

  
  function ensureLoadBadge() {
    var id = 'clinident-ext-loaded';
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:9997;background:#065f46;color:#fff;padding:5px 8px;border-radius:8px;font:600 11px/1 system-ui,sans-serif;opacity:.92';
      el.textContent = 'Clinico+ activo';
      document.body.appendChild(el);
      setTimeout(function () { if (el && el.parentNode) el.remove(); }, 7000);
    }
  }
  function start() {
    injectStyles();
    try {
      var b = document.getElementById('clinident-ext-vbadge');
      if (!b) {
        b = document.createElement('div');
        b.id = 'clinident-ext-vbadge';
        b.style.cssText = 'position:fixed;left:10px;top:10px;z-index:10001;background:#111827;color:#fff;padding:6px 10px;border-radius:8px;font:700 11px/1 system-ui;';
        b.textContent = 'Premium v8 cargado';
        document.body.appendChild(b);
        setTimeout(function(){ if (b && b.parentNode) b.remove(); }, 8000);
      }
    } catch (_) {}
    ensureLoadBadge();
    ensureButtonAndPanel();
    showLoginAlerts();
    patchNavigationWatcher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();







