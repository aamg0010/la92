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

  try {
    var PANEL_ID = 'odontograma-visual-panel';
    var TOGGLE_ID = 'odontograma-visual-toggle';

    var STORAGE_ACTIVE = 'clinident_odonto_active_session_v1';
    var STORAGE_HISTORY = 'clinident_odonto_history_v1';

    var STATE = {
      pinned: false,
      manualTooth: null,
      useAuto: true
    };

    var LAST_KEY = '';

    var PERMANENT_UPPER = ['18','17','16','15','14','13','12','11','21','22','23','24','25','26','27','28'];
    var PERMANENT_LOWER = ['48','47','46','45','44','43','42','41','31','32','33','34','35','36','37','38'];

    function safeJsonParse(s, fallback) {
      try { return JSON.parse(s); } catch (_) { return fallback; }
    }

    function getAuthUser() {
      var raw = localStorage.getItem('auth_user');
      return raw ? safeJsonParse(raw, null) : null;
    }

    function currentRole() {
      var u = getAuthUser();
      return ((u && u.role) || '').toString().toLowerCase();
    }

    function isDoctorRole() {
      var r = currentRole();
      return r === 'doctor' || r === 'odontologo' || r === 'odontologo/a' || r === 'odontologa';
    }

    function inDentalArea() {
      var p = (window.location.pathname || '').toLowerCase();
      return p.indexOf('/pacientes') >= 0 || p.indexOf('/agenda') >= 0 || p.indexOf('/dashboard') >= 0;
    }

    function parseToothCandidate(text) {
      if (!text) return null;
      var m = text.match(/Pieza\s*[:\-]?\s*(\d{2})/i);
      if (m && m[1]) return m[1];

      var all = text.match(/\b\d{2}\b/g) || [];
      for (var i = 0; i < all.length; i++) {
        var d = all[i];
        var q = parseInt(d.charAt(0), 10);
        var p = parseInt(d.charAt(1), 10);
        if ((q >= 1 && q <= 8) && ((q <= 4 && p >= 1 && p <= 8) || (q >= 5 && p >= 1 && p <= 5))) return d;
      }
      return null;
    }

    function detectAutoTooth() {
      var dialogs = Array.prototype.slice.call(document.querySelectorAll('[role="dialog"], [data-state="open"]'));
      for (var i = 0; i < dialogs.length; i++) {
        var tx = dialogs[i].textContent || '';
        if (/Historia Cl[ii]nica|Nuevo Registro|Registro Cl[ii]nico|pieza dental|diente/i.test(tx)) {
          var detected = parseToothCandidate(tx);
          if (detected) return detected;
          var controls = dialogs[i].querySelectorAll('[role="combobox"], button, input, [data-state]');
          for (var j = 0; j < controls.length; j++) {
            detected = parseToothCandidate((controls[j].textContent || controls[j].value || '').trim());
            if (detected) return detected;
          }
        }
      }
      var focused = document.activeElement;
      if (focused) return parseToothCandidate((focused.textContent || focused.value || '').trim());
      return null;
    }

    function activeTooth() {
      var auto = detectAutoTooth();
      if (STATE.useAuto && auto) return auto;
      if (STATE.manualTooth) return STATE.manualTooth;
      return auto;
    }

    function quadrantInfo(tooth) {
      var d = String(tooth || '');
      if (!/^\d{2}$/.test(d)) return null;
      var q = parseInt(d.charAt(0), 10);
      var isPrimary = q >= 5;
      var quadrantMap = {
        1: 'Superior derecho', 2: 'Superior izquierdo', 3: 'Inferior izquierdo', 4: 'Inferior derecho',
        5: 'Superior derecho (temporal)', 6: 'Superior izquierdo (temporal)', 7: 'Inferior izquierdo (temporal)', 8: 'Inferior derecho (temporal)'
      };
      return { tooth: d, q: q, isPrimary: isPrimary, quadrant: quadrantMap[q] || 'No definido' };
    }

    function nowMs() { return Date.now(); }

    function loadActiveSession() {
      var raw = localStorage.getItem(STORAGE_ACTIVE);
      return raw ? safeJsonParse(raw, null) : null;
    }

    function saveActiveSession(session) {
      if (!session) {
        localStorage.removeItem(STORAGE_ACTIVE);
        return;
      }
      localStorage.setItem(STORAGE_ACTIVE, JSON.stringify(session));
    }

    function loadHistory() {
      var raw = localStorage.getItem(STORAGE_HISTORY);
      var h = raw ? safeJsonParse(raw, []) : [];
      return Array.isArray(h) ? h : [];
    }

    function saveHistory(history) {
      localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history));
    }

    function maybeSessionUpdate(activeToothNow) {
      var s = loadActiveSession();
      if (!s || !s.running) return;

      var now = nowMs();
      var lastTick = s.lastTick || now;
      var delta = Math.max(0, now - lastTick);
      s.elapsedMs = (s.elapsedMs || 0) + delta;

      var tooth = activeToothNow || s.lastTooth || null;
      if (tooth) {
        s.toothMs = s.toothMs || {};
        s.toothMs[tooth] = (s.toothMs[tooth] || 0) + delta;
        if (!s.teeth) s.teeth = [];
        if (s.teeth.indexOf(tooth) === -1) s.teeth.push(tooth);
      }

      s.lastTooth = activeToothNow || s.lastTooth || null;
      s.lastTick = now;
      saveActiveSession(s);
    }

    function startSession(initialTooth) {
      var user = getAuthUser() || {};
      var now = nowMs();
      var s = {
        id: 'sess_' + now,
        running: true,
        startedAt: now,
        endedAt: null,
        elapsedMs: 0,
        toothMs: {},
        teeth: [],
        lastTooth: initialTooth || null,
        lastTick: now,
        doctorId: user.id || null,
        doctorEmail: user.email || null,
        route: window.location.pathname || '/'
      };
      saveActiveSession(s);
    }

    function stopSession() {
      var s = loadActiveSession();
      if (!s || !s.running) return;

      maybeSessionUpdate(activeTooth());
      s = loadActiveSession();
      s.running = false;
      s.endedAt = nowMs();

      var history = loadHistory();
      history.unshift(s);
      if (history.length > 400) history = history.slice(0, 400);
      saveHistory(history);
      saveActiveSession(null);
    }

    function fmtDuration(ms) {
      var sec = Math.floor((ms || 0) / 1000);
      var h = Math.floor(sec / 3600);
      var m = Math.floor((sec % 3600) / 60);
      var s = sec % 60;
      function p2(x) { return String(x).padStart(2, '0'); }
      return p2(h) + ':' + p2(m) + ':' + p2(s);
    }

    function summarize(history) {
      var totalMs = 0;
      var byTooth = {};
      for (var i = 0; i < history.length; i++) {
        totalMs += history[i].elapsedMs || 0;
        var tms = history[i].toothMs || {};
        var keys = Object.keys(tms);
        for (var j = 0; j < keys.length; j++) {
          var t = keys[j];
          byTooth[t] = (byTooth[t] || 0) + (tms[t] || 0);
        }
      }
      var topTooth = '-';
      var topMs = 0;
      var toothKeys = Object.keys(byTooth);
      for (var k = 0; k < toothKeys.length; k++) {
        if (byTooth[toothKeys[k]] > topMs) {
          topMs = byTooth[toothKeys[k]];
          topTooth = toothKeys[k];
        }
      }
      return {
        sessions: history.length,
        totalMs: totalMs,
        avgMs: history.length ? Math.round(totalMs / history.length) : 0,
        topTooth: topTooth,
        topToothMs: topMs
      };
    }

    function ensureToggle() {
      var toggle = document.getElementById(TOGGLE_ID);
      if (toggle) return toggle;

      toggle = document.createElement('button');
      toggle.id = TOGGLE_ID;
      toggle.type = 'button';
      toggle.innerHTML = 'Odontograma';
      toggle.style.position = 'fixed';
      toggle.style.right = '16px';
      toggle.style.bottom = '16px';
      toggle.style.zIndex = '9999';
      toggle.style.padding = '8px 12px';
      toggle.style.borderRadius = '999px';
      toggle.style.border = '1px solid #0ea5e9';
      toggle.style.background = '#082f49';
      toggle.style.color = '#e0f2fe';
      toggle.style.font = '600 12px/1.2 system-ui, sans-serif';
      toggle.style.cursor = 'pointer';
      toggle.onclick = function () {
        STATE.pinned = !STATE.pinned;
        var panel = ensurePanel();
        panel.style.display = STATE.pinned ? 'block' : 'none';
        toggle.innerHTML = STATE.pinned ? 'Ocultar' : 'Odontograma';
        tick(true);
      };
      document.body.appendChild(toggle);
      return toggle;
    }

    function ensurePanel() {
      var panel = document.getElementById(PANEL_ID);
      if (panel) return panel;

      panel = document.createElement('div');
      panel.id = PANEL_ID;
      panel.style.position = 'fixed';
      panel.style.right = '16px';
      panel.style.bottom = '60px';
      panel.style.zIndex = '9998';
      panel.style.width = '400px';
      panel.style.maxHeight = '76vh';
      panel.style.overflow = 'auto';
      panel.style.background = '#0f172a';
      panel.style.color = '#e2e8f0';
      panel.style.border = '1px solid #334155';
      panel.style.borderRadius = '12px';
      panel.style.padding = '12px';
      panel.style.boxShadow = '0 12px 28px rgba(0,0,0,.35)';
      panel.style.fontFamily = 'system-ui, sans-serif';
      panel.style.display = 'none';
      document.body.appendChild(panel);
      return panel;
    }

    function rowButtons(teeth, selected) {
      var html = '<div style="display:grid;grid-template-columns:repeat(16,1fr);gap:4px;">';
      for (var i = 0; i < teeth.length; i++) {
        var t = teeth[i];
        var active = t === selected;
        html += '<button data-tooth="' + t + '" style="height:26px;border-radius:6px;border:1px solid ' + (active ? '#06b6d4' : '#334155') + ';background:' + (active ? 'rgba(6,182,212,.2)' : '#111827') + ';color:' + (active ? '#67e8f9' : '#cbd5e1') + ';font-size:11px;cursor:pointer;">' + t + '</button>';
      }
      html += '</div>';
      return html;
    }

    function bindPanelActions(panel) {
      var toothButtons = panel.querySelectorAll('button[data-tooth]');
      for (var i = 0; i < toothButtons.length; i++) {
        toothButtons[i].onclick = function (ev) {
          STATE.manualTooth = ev.currentTarget.getAttribute('data-tooth');
          STATE.useAuto = false;
          tick(true);
        };
      }

      var autoBtn = panel.querySelector('#odonto-auto-mode');
      if (autoBtn) {
        autoBtn.onclick = function () {
          STATE.useAuto = true;
          tick(true);
        };
      }

      var startBtn = panel.querySelector('#odonto-start-session');
      if (startBtn) {
        startBtn.onclick = function () {
          if (!loadActiveSession()) startSession(activeTooth());
          tick(true);
        };
      }

      var stopBtn = panel.querySelector('#odonto-stop-session');
      if (stopBtn) {
        stopBtn.onclick = function () {
          stopSession();
          tick(true);
        };
      }

      var clearBtn = panel.querySelector('#odonto-clear-history');
      if (clearBtn) {
        clearBtn.onclick = function () {
          if (window.confirm('Borrar historial estadistico local?')) {
            saveHistory([]);
            tick(true);
          }
        };
      }
    }

    function sessionBoxes(activeSession, stats) {
      var running = !!(activeSession && activeSession.running);
      var runtime = running ? fmtDuration(activeSession.elapsedMs || 0) : '00:00:00';
      var topTooth = stats.topTooth === '-' ? '-' : (stats.topTooth + ' (' + fmtDuration(stats.topToothMs) + ')');

      var html = '';
      html += '<div style="margin:10px 0;padding:10px;border:1px solid #334155;border-radius:10px;background:#111827;">';
      html += '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">Cita activa (rol medico)</div>';
      html += '<div style="font-size:12px;margin-bottom:6px;">Estado: <strong>' + (running ? 'En curso' : 'Detenida') + '</strong></div>';
      html += '<div style="font-size:12px;margin-bottom:8px;">Tiempo real: <strong>' + runtime + '</strong></div>';
      html += '<div style="display:flex;gap:8px;">';
      html += '<button id="odonto-start-session" style="flex:1;border:1px solid #166534;background:#052e16;color:#86efac;border-radius:8px;padding:6px 8px;font-size:12px;cursor:pointer;">Iniciar cita</button>';
      html += '<button id="odonto-stop-session" style="flex:1;border:1px solid #7f1d1d;background:#450a0a;color:#fca5a5;border-radius:8px;padding:6px 8px;font-size:12px;cursor:pointer;">Finalizar cita</button>';
      html += '</div>';
      html += '</div>';

      html += '<div style="margin:10px 0;padding:10px;border:1px solid #334155;border-radius:10px;background:#0b1220;">';
      html += '<div style="font-size:12px;font-weight:700;margin-bottom:6px;">Productividad</div>';
      html += '<div style="font-size:12px;line-height:1.5;">';
      html += 'Sesiones: <strong>' + stats.sessions + '</strong><br>';
      html += 'Tiempo total: <strong>' + fmtDuration(stats.totalMs) + '</strong><br>';
      html += 'Promedio/sesion: <strong>' + fmtDuration(stats.avgMs) + '</strong><br>';
      html += 'Pieza mas trabajada: <strong>' + topTooth + '</strong>';
      html += '</div>';
      html += '<button id="odonto-clear-history" style="margin-top:8px;border:1px solid #374151;background:#111827;color:#cbd5e1;border-radius:8px;padding:5px 8px;font-size:11px;cursor:pointer;">Limpiar historial local</button>';
      html += '</div>';

      return html;
    }

    function renderPanel(tooth, force) {
      ensureToggle();
      var panel = ensurePanel();

      if (!inDentalArea() || !STATE.pinned) {
        panel.style.display = 'none';
        return;
      }
      panel.style.display = 'block';

      var info = quadrantInfo(tooth);
      var activeSession = loadActiveSession();
      var history = loadHistory();
      var stats = summarize(history);

      var key = [
        window.location.pathname,
        STATE.pinned,
        STATE.useAuto,
        STATE.manualTooth || '',
        info ? info.tooth : '',
        activeSession ? (activeSession.running + '|' + Math.floor((activeSession.elapsedMs || 0) / 1000)) : 'none',
        history.length,
        currentRole()
      ].join('|');

      if (!force && key === LAST_KEY) return;
      LAST_KEY = key;

      var header = '';
      header += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
      header += '<div style="font-weight:700;font-size:14px;">Odontograma interactivo</div>';
      header += '<button id="odonto-auto-mode" style="border:1px solid #334155;background:#111827;color:#cbd5e1;border-radius:8px;padding:4px 8px;font-size:11px;cursor:pointer;">Modo auto</button>';
      header += '</div>';

      var status = '';
      if (!info) {
        status = '<div style="font-size:12px;opacity:.9;margin-bottom:10px;">Selecciona una pieza en el mapa o en el formulario clinico.</div>';
      } else {
        status = '<div style="font-size:12px;opacity:.95;margin-bottom:10px;">Pieza activa: <strong>' + info.tooth + '</strong> | Zona: ' + info.quadrant + ' | Tipo: ' + (info.isPrimary ? 'Temporal' : 'Permanente') + '</div>';
      }

      var legend = '';
      legend += '<div style="font-size:11px;opacity:.75;margin-bottom:8px;">Arcada superior</div>';
      legend += rowButtons(PERMANENT_UPPER, info ? info.tooth : null);
      legend += '<div style="font-size:11px;opacity:.75;margin:10px 0 8px;">Arcada inferior</div>';
      legend += rowButtons(PERMANENT_LOWER, info ? info.tooth : null);

      var roleMsg = '';
      if (!isDoctorRole()) {
        roleMsg = '<div style="margin-top:10px;padding:8px;border:1px dashed #334155;border-radius:8px;font-size:11px;opacity:.85;">El cronometro y reportes se habilitan al iniciar sesion con rol medico.</div>';
      }

      var body = header + status + legend;
      if (isDoctorRole()) body += sessionBoxes(activeSession, stats);
      body += roleMsg;
      body += '<div style="margin-top:10px;font-size:11px;opacity:.75;line-height:1.4;">Al seleccionar dientes durante la cita, se acumula tiempo por pieza para analitica de productividad.</div>';

      panel.innerHTML = body;
      bindPanelActions(panel);
    }

    function tick(force) {
      var t = activeTooth();
      maybeSessionUpdate(t);
      renderPanel(t, !!force);
    }

    setInterval(function () { tick(false); }, 1000);
    window.addEventListener('popstate', function () { tick(true); });
    window.addEventListener('hashchange', function () { tick(true); });
    tick(true);
  } catch (err) {
    console.error('odontograma script error', err);
  }
})();