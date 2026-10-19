(() => {
  'use strict';

  const SUPABASE_URL = 'https://okzkqhzjrxjjgrjxsjqg.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_OO1QBvHPUjW8aoTftH2Fow_ewt0Zx2S';
  const ADMIN_EMAIL = 'justinbecker157@gmail.com';
  const APP_VERSION = '2.24.0';
  let lastAnalyticsAttempt = 0;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes babaGateGlow{0%,100%{opacity:.26;transform:scale(.9)}50%{opacity:.62;transform:scale(1.08)}}
    @keyframes babaGateIn{from{opacity:0;transform:translateY(14px) scale(.98);filter:blur(7px)}to{opacity:1;transform:translateY(0) scale(1);filter:blur(0)}}
    #baba-secret-admin-gate{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;overflow:hidden;background:radial-gradient(ellipse at 50% 45%,#101010 0%,#050505 48%,#000 100%);color:#fff;font:14px/1.5 Segoe UI,Arial,sans-serif}
    #baba-secret-admin-gate .gate-card{position:relative;width:min(430px,calc(100vw - 36px));box-sizing:border-box;padding:36px 34px;text-align:center;background:linear-gradient(145deg,#111,#070707);border:1px solid #343434;border-radius:20px;box-shadow:0 28px 100px #000,0 0 50px #fff08;animation:babaGateIn .55s cubic-bezier(.2,.75,.25,1) both}
    #baba-secret-admin-gate .gate-glow{position:absolute;z-index:-1;inset:-55px;border-radius:50%;background:radial-gradient(circle,#fff16,transparent 68%);filter:blur(24px);animation:babaGateGlow 4s ease-in-out infinite}
    #baba-secret-admin-gate h1{font-size:22px;letter-spacing:.12em;margin:0 0 8px;text-transform:uppercase}
    #baba-secret-admin-gate p{color:#969696;margin:0 0 24px;font-size:12px;letter-spacing:.04em}
    #baba-secret-admin-gate input{width:100%;box-sizing:border-box;padding:14px 15px;margin:0 0 12px;border:1px solid #383838;border-radius:10px;background:#050505;color:#fff;outline:none;font:14px Segoe UI,Arial,sans-serif;letter-spacing:.12em;text-align:center;transition:border-color .2s,box-shadow .2s}
    #baba-secret-admin-gate input:focus{border-color:#aaa;box-shadow:0 0 0 3px #fff12}
    #baba-secret-admin-gate button{width:100%;padding:13px;border:1px solid #eee;border-radius:10px;background:#eee;color:#080808;font-weight:700;letter-spacing:.1em;transition:transform .2s,background .2s}
    #baba-secret-admin-gate button:hover{background:#fff;transform:translateY(-1px)}
    #baba-secret-admin-gate .gate-error{min-height:20px;margin-top:12px;color:#aaa;font-size:12px}
    #baba-admin .key-manager{margin-top:24px;padding-top:20px;border-top:1px solid #303030}#baba-admin .key-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0}#baba-admin select{padding:9px 11px;background:#080808;color:#eee;border:1px solid #383838;border-radius:8px}#baba-admin .key-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:11px 2px;border-bottom:1px solid #252525}#baba-admin .key-row small{display:block;color:#999;font-size:11px}#baba-admin .key-code{padding:12px;border:1px solid #3b3b3b;background:#080808;border-radius:8px;word-break:break-all;font:12px Consolas,monospace;color:#fff;margin:10px 0}
    @keyframes babaTwinkle{from{opacity:.08;transform:scale(.6)}to{opacity:.75;transform:scale(1.5)}}
    @keyframes babaMistDrift{from{transform:translate3d(-12vw,8vh,0) scale(.9)}to{transform:translate3d(16vw,-8vh,0) scale(1.15)}}
    @keyframes babaParticleFloat{from{transform:translate3d(-18px,14px,0)}to{transform:translate3d(22px,-28px,0)}}
    @keyframes babaScanMove{to{transform:translateY(18px)}}
    @keyframes babaPulse{0%,100%{opacity:.25;scale:.86}50%{opacity:.7;scale:1.08}}
    @keyframes babaOrbit{to{transform:translate(-50%,-50%) rotate(335deg)}}
    @keyframes babaRing{0%{transform:translate(-50%,-50%) scale(.35);opacity:0}20%{opacity:.5}100%{transform:translate(-50%,-50%) scale(5.5);opacity:0}}
    @keyframes babaRainFall{0%{transform:translateY(-10vh);opacity:0}12%{opacity:1}88%{opacity:.8}100%{transform:translateY(120vh);opacity:0}}
    @keyframes babaSnowFall{to{transform:translate3d(30px,110vh,0) rotate(360deg)}}
    @keyframes babaMatrixFall{to{transform:translateY(120vh)}}
    @keyframes babaGridPulse{0%,100%{opacity:.25}50%{opacity:.65}}
    @keyframes babaWaveMove{to{transform:translate3d(8%,4%,0) scale(1.08)}}
    #baba-admin-button,#baba-consent button,#baba-admin button{font:600 12px/1.2 Segoe UI,Arial,sans-serif;cursor:pointer}
    #baba-admin-button{position:fixed;top:10px;left:calc(50% + 90px);z-index:2147483645;padding:7px 13px;border:1px solid #454545;border-radius:999px;background:#111;color:#f5f5f5;letter-spacing:.04em}
    #baba-consent{position:fixed;z-index:2147483646;left:50%;bottom:24px;transform:translateX(-50%);width:min(500px,calc(100vw - 32px));box-sizing:border-box;padding:20px;background:#111;color:#eee;border:1px solid #343434;border-radius:14px;box-shadow:0 20px 70px #000d;font:13px/1.5 Segoe UI,Arial,sans-serif}
    #baba-consent h3,#baba-admin h2{margin:0 0 8px;color:#fff}#baba-consent p{margin:0 0 16px;color:#aaa}
    #baba-consent .actions{display:flex;justify-content:flex-end;gap:8px}#baba-consent button,#baba-admin button{padding:9px 13px;border-radius:8px;border:1px solid #555;background:#171717;color:#eee}#baba-consent button.primary,#baba-admin button.primary{background:var(--baba-effect-color);color:#111;border-color:#eee}
    #baba-admin{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#050505f2;color:#eee;font:14px/1.5 Segoe UI,Arial,sans-serif}
    #baba-admin .panel{width:min(980px,calc(100vw - 32px));max-height:calc(100vh - 40px);overflow:auto;box-sizing:border-box;padding:28px;background:#101010;border:1px solid #333;border-radius:18px;box-shadow:0 24px 90px #000}
    #baba-admin .top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px}#baba-admin .top h2{font-size:22px}
    #baba-admin input{display:block;box-sizing:border-box;width:100%;margin:10px 0;padding:12px 13px;border:1px solid #383838;border-radius:8px;background:#080808;color:#fff;outline:none}
    #baba-admin .stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:18px 0}#baba-admin .stat{padding:16px;border:1px solid #303030;border-radius:10px;background:#151515}#baba-admin .stat strong{display:block;font-size:24px;color:#fff}#baba-admin .stat span,#baba-admin .muted{color:#999;font-size:12px}
    #baba-admin .rows{border-top:1px solid #303030;margin-top:12px}#baba-admin .row{display:flex;justify-content:space-between;padding:9px 2px;border-bottom:1px solid #252525}#baba-admin .error{min-height:20px;color:#ff9292;font-size:12px;margin-top:10px}    #baba-admin .admin-tabs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-bottom:14px;border-bottom:1px solid #303030}
    #baba-admin .admin-tabs button.active{background:#eee;color:#111;border-color:#eee}
    #baba-admin .admin-view{padding-top:18px}
    #baba-admin .section-heading{display:flex;align-items:end;justify-content:space-between;gap:12px;margin:6px 0 12px}
    #baba-admin .section-heading h3{margin:0;color:#fff;font-size:16px}
    #baba-admin .overview-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
    #baba-admin .overview-card{padding:16px;border:1px solid #303030;border-radius:12px;background:#141414}
    #baba-admin .key-toolbar label{display:grid;gap:5px;color:#999;font-size:11px}
    #baba-admin .key-toolbar input{width:min(260px,100%);margin:0;padding:9px 11px}#baba-admin .key-toolbar input[type=number]{width:96px}
    #baba-admin .key-toolbar select{min-width:115px}
    #baba-admin .key-row{padding:13px 4px}
    #baba-admin .key-row .key-status{display:inline-flex;margin-left:8px;padding:2px 8px;border:1px solid #444;border-radius:999px;color:#bbb;font-size:10px}
    #baba-admin .key-row .key-status.active{border-color:#526b57;color:#b9e8c2}
    #baba-admin .key-row .key-status.revoked{border-color:#765252;color:#f0b2b2}
    #baba-admin .key-row .key-status.unused{border-color:#625b40;color:#e5d59d}
    #baba-admin .admin-note{margin-top:16px;padding:12px 14px;border:1px solid #303030;border-radius:10px;background:#141414;color:#999;font-size:12px}
    @media(max-width:520px){#baba-admin .stats{grid-template-columns:1fr}#baba-admin .overview-grid{grid-template-columns:1fr}#baba-admin .panel{padding:18px}}
  `;
  document.head.appendChild(style);

  const apiHeaders = { apikey: SUPABASE_PUBLISHABLE_KEY, 'content-type': 'application/json' };
  const getInstallId = () => {
    let id = localStorage.getItem('baba_install_id');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('baba_install_id', id); }
    return id;
  };
  const activated = () => localStorage.getItem('baba_tweak_activated') === '1';

  async function sendAnalytics() {
    if (!activated() || localStorage.getItem('baba_analytics_consent') !== 'yes') return;
    if (Date.now() - lastAnalyticsAttempt < 5 * 60 * 1000) return;
    const last = Number(localStorage.getItem('baba_analytics_sent') || '0');
    if (Date.now() - last < 24 * 60 * 60 * 1000) return;
    lastAnalyticsAttempt = Date.now();
    const plan = localStorage.getItem('baba_tweak_plan') || 'Unknown';
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/track-install`, {
        method: 'POST', headers: apiHeaders,
        body: JSON.stringify({ installId: getInstallId(), plan, appVersion: APP_VERSION }),
      });
      if (response.ok) localStorage.setItem('baba_analytics_sent', String(Date.now()));
    } catch { /* analytics must not block app use */ }
  }

  function showConsent() {
    if (!activated() || localStorage.getItem('baba_analytics_consent') || document.getElementById('baba-consent')) return;
    const box = document.createElement('section');
    box.id = 'baba-consent';
    box.innerHTML = '<h3>Anonymous usage count</h3><p>Allow Baba Tweak to count this installation and its plan, app version, and country. For the country lookup, the connection IP is sent to ipapi.co; Baba Tweak does not store the IP in its statistics database. This is optional.</p><div class="actions"><button data-choice="no">Decline</button><button class="primary" data-choice="yes">Allow</button></div>';
    box.addEventListener('click', (event) => {
      const choice = event.target.closest('button')?.dataset.choice;
      if (!choice) return;
      localStorage.setItem('baba_analytics_consent', choice);
      box.remove();
      if (choice === 'yes') void sendAnalytics();
    });
    document.body.appendChild(box);
  }

  async function loadStats(accessToken) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-stats`, {
      method: 'POST',
      headers: { ...apiHeaders, authorization: `Bearer ${accessToken}` },
      body: '{}',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Admin-Statistiken konnten nicht geladen werden.');
    return data;
  }

  async function adminKeyRequest(accessToken, body) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-keys`, { method:'POST', headers:{...apiHeaders, authorization:`Bearer ${accessToken}`}, body:JSON.stringify(body) });
    const data = await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error || 'Schlüsselverwaltung nicht verfügbar. Backend-Migration und Funktion müssen bereitgestellt werden.');
    return data;
  }

  async function renderLicenseManager(container, accessToken) {
    const panel = document.createElement('section');
    panel.className = 'key-manager';
    panel.innerHTML = '<div class="section-heading"><div><h3>Schlüsselverwaltung</h3><p class="muted">Erstelle Lizenz-Keys, suche Aktivierungen und widerrufe einzelne Keys.</p></div><button data-refresh-keys>Aktualisieren</button></div><div class="key-toolbar"><label>Key-Laufzeit<select aria-label="Lizenzlaufzeit" data-create-plan><option value="Day">Day</option><option value="Month">Month</option><option value="Lifetime">Lifetime</option></select></label><label>Anzahl (1–50)<input type="number" min="1" max="50" step="1" value="1" data-create-count aria-label="Anzahl Keys"></label><button class="primary" data-create>Keys generieren</button><label>Status filtern<select aria-label="Status filtern" data-status-filter><option value="all">Alle Status</option><option value="active">Aktiviert</option><option value="unused">Unbenutzt</option><option value="revoked">Widerrufen</option></select></label><label>Keys durchsuchen<input type="search" data-key-search placeholder="Plan, ID oder Land …"></label><span class="muted" data-status></span></div><div data-new-key></div><div class="rows" data-key-list></div>';
    container.appendChild(panel);
    const status = panel.querySelector('[data-status]');
    const list = panel.querySelector('[data-key-list]');
    const newKey = panel.querySelector('[data-new-key]');
    let keys = [];
    const renderRows = () => {
      const query = panel.querySelector('[data-key-search]').value.trim().toLowerCase();
      const filter = panel.querySelector('[data-status-filter]').value;
      const visible = keys.filter((key) => {
        const revoked = Boolean(key.revoked);
        const active = Boolean(key.claimedInstallId);
        const matchesStatus = filter === 'all' || (filter === 'revoked' && revoked) || (filter === 'active' && !revoked && active) || (filter === 'unused' && !revoked && !active);
        const searchable = [key.plan, key.hint, key.claimedInstallId, key.country].join(' ').toLowerCase();
        return matchesStatus && searchable.includes(query);
      });
      list.replaceChildren();
      for (const key of visible) {
        const row = document.createElement('div'); row.className = 'key-row';
        const info = document.createElement('div');
        const title = document.createElement('strong'); title.textContent = `${key.plan} · …${key.hint || '????'}`;
        const badge = document.createElement('span'); badge.className = `key-status ${key.revoked ? 'revoked' : key.claimedInstallId ? 'active' : 'unused'}`; badge.textContent = key.revoked ? 'Widerrufen' : key.claimedInstallId ? 'Aktiviert' : 'Unbenutzt'; title.appendChild(badge);
        const detail = document.createElement('small'); detail.textContent = key.claimedInstallId ? `Install-ID ${key.claimedInstallId} · ${key.country || 'Land unbekannt'} · ${key.claimedAt ? new Date(key.claimedAt).toLocaleString() : ''}` : 'Noch nicht aktiviert';
        info.append(title, detail); row.appendChild(info);
        if (!key.revoked) {
          const revoke = document.createElement('button'); revoke.textContent = 'Widerrufen';
          revoke.addEventListener('click', async () => { revoke.disabled = true; try { await adminKeyRequest(accessToken, { action: 'revoke', id: key.id }); await refresh(); } catch (error) { status.textContent = error.message; revoke.disabled = false; } }); row.appendChild(revoke);
        }
        list.appendChild(row);
      }
      if (!visible.length) list.textContent = keys.length ? 'Keine Keys passen zu diesem Filter.' : 'Noch keine generierten Keys.';
    };
    const refresh = async () => {
      status.textContent = 'Lade Keys …';
      try {
        const data = await adminKeyRequest(accessToken, { action: 'list' }); keys = data.keys || [];
        const active = keys.filter((key) => !key.revoked && key.claimedInstallId).length;
        const unused = keys.filter((key) => !key.revoked && !key.claimedInstallId).length;
        const revoked = keys.filter((key) => key.revoked).length;
        status.textContent = `${keys.length} Keys · ${active} aktiviert · ${unused} unbenutzt · ${revoked} widerrufen`; renderRows();
      } catch (error) { status.textContent = error.message; list.textContent = ''; }
    };
    panel.querySelector('[data-refresh-keys]').addEventListener('click', refresh);
    panel.querySelector('[data-key-search]').addEventListener('input', renderRows);
    panel.querySelector('[data-status-filter]').addEventListener('change', renderRows);
    panel.querySelector('[data-create]').addEventListener('click', async (event) => {
      const button = event.currentTarget;
      const countInput = panel.querySelector('[data-create-count]');
      const requested = Number.parseInt(countInput.value, 10);
      const quantity = Math.min(50, Math.max(1, Number.isFinite(requested) ? requested : 1));
      countInput.value = String(quantity);
      button.disabled = true;
      const created = [];
      const plan = panel.querySelector('[data-create-plan]').value;
      try {
        for (let index = 0; index < quantity; index += 1) {
          status.textContent = `Erstelle Keys (${index + 1}/${quantity}) …`;
          const data = await adminKeyRequest(accessToken, { action: 'create', plan });
          if (!data.key) throw new Error('Der Server hat keinen Key zurückgegeben.');
          created.push(data.key);
        }
      } catch (error) {
        status.textContent = `${created.length}/${quantity} Keys erstellt. ${error.message}`;
      } finally {
        if (created.length) {
          newKey.replaceChildren();
          const code = document.createElement('div'); code.className = 'key-code'; code.textContent = created.join('\n');
          const copy = document.createElement('button'); copy.textContent = 'Alle Keys kopieren';
          copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(created.join('\n')); status.textContent = `${created.length} Keys kopiert.`; } catch { status.textContent = 'Kopieren nicht möglich – Keys markieren.'; } });
          newKey.append(code, copy);
        }
        await refresh();
        if (created.length) status.textContent = `${created.length} ${created.length === 1 ? 'Key' : 'Keys'} erstellt${created.length < quantity ? ` (von ${quantity} angefordert)` : ''}.`;
        button.disabled = false;
      }
    });    await refresh();
  }  async function signIn(email, password) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST', headers: apiHeaders, body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) throw new Error(data.msg || data.message || 'Login fehlgeschlagen. Prüfe Supabase Auth.');
    if (String(data.user?.email || '').toLowerCase() !== ADMIN_EMAIL) throw new Error('Dieses Konto ist nicht als Admin freigeschaltet.');
    return data.access_token;
  }

  let lastSecretF11 = 0;
  async function openSecretAdminGate() {
    if (document.getElementById('baba-secret-admin-gate')) return;
    const gate = document.createElement('div'); gate.id = 'baba-secret-admin-gate';
    gate.innerHTML = '<form class="gate-card"><div class="gate-glow"></div><div style="width:54px;height:54px;margin:0 auto 20px;border:1px solid #ffffff2b;border-radius:18px;display:grid;place-items:center;background:linear-gradient(145deg,#292929,#090909);box-shadow:0 8px 30px #000"><span style="font-size:22px">⌘</span></div><h1>Admin Access</h1><p>TYPE PASSWORD TO ACCESS TO THE ADMIN PANEL</p><input type="password" autocomplete="current-password" placeholder="ENTER PASSWORD" aria-label="Admin-Passwort" autofocus><button type="submit">UNLOCK PANEL</button><div class="gate-error" role="alert"></div><button type="button" data-close style="margin-top:10px;background:transparent;color:#999;border-color:#333">CANCEL</button></form>';
    document.body.appendChild(gate);
    const form=gate.querySelector('form'), input=form.querySelector('input'), error=form.querySelector('[role="alert"]'); let attempts=0;
    gate.querySelector('[data-close]').addEventListener('click',()=>gate.remove());
    gate.addEventListener('keydown',event=>{if(event.key==='Escape')gate.remove()});
    form.addEventListener('submit',async event=>{event.preventDefault();const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input.value));const hash=Array.from(new Uint8Array(digest),value=>value.toString(16).padStart(2,'0')).join('');if(hash==='5dc9bb3fbfcffc8e35e976646de919d8712109c7aea3c854a4d47bbdfca61a43'){gate.remove();openAdmin();return}attempts++;input.value='';error.textContent=attempts>=5?'Zu viele Versuche. Schließe das Fenster und versuche es später erneut.':'Passwort falsch.';if(attempts>=5)form.querySelector('button[type="submit"]').disabled=true;input.focus()});
    input.focus();
  }
  window.addEventListener('keydown',event=>{if(event.key!=='F11'||event.repeat)return;event.preventDefault();const now=Date.now();if(now-lastSecretF11<850){lastSecretF11=0;void openSecretAdminGate()}else lastSecretF11=now});
  function openAdmin() {
    if (document.getElementById('baba-admin')) return;
    const overlay = document.createElement('div');
    overlay.id = 'baba-admin';
    overlay.innerHTML = `<section class="panel"><div class="top"><div><h2>Baba Tweak Admin</h2><div class="muted">Nur für ${ADMIN_EMAIL}</div></div><button data-action="close" aria-label="Schließen">Close</button></div><form><input name="email" type="email" autocomplete="username" value="${ADMIN_EMAIL}" required><input name="password" type="password" autocomplete="current-password" placeholder="Supabase Admin Passwort" required><button class="primary" type="submit">Login</button><div class="error" role="alert"></div></form><div class="content"></div></section>`;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-action="close"]').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (event) => { if (event.target === overlay) overlay.remove(); });
    overlay.querySelector('form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const error = form.querySelector('[role="alert"]');
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      error.textContent = 'Anmeldung läuft …';
      try {
        const token = await signIn(form.elements.email.value.trim(), form.elements.password.value);
        form.elements.password.value = '';
        const stats = await loadStats(token);
        form.remove();
        const content = overlay.querySelector('.content');
        content.innerHTML = `<div class="admin-tabs"><button class="active" data-admin-tab="overview">Übersicht</button><button data-admin-tab="keys">Schlüsselverwaltung</button><button data-refresh-stats style="margin-left:auto">Statistiken aktualisieren</button></div><section class="admin-view" data-admin-view="overview"></section><section class="admin-view" data-admin-view="keys" hidden></section><div class="admin-note">Die Statistik enthält nur Installationen mit Einwilligung. Länder werden nur angezeigt, wenn Nutzer einer freiwilligen Statistik zugestimmt haben.</div>`;
        const overview = content.querySelector('[data-admin-view="overview"]');
        const renderOverview = (data) => {
          const countries = (data.countries || []).map(item => `<div class="row"><span>${escapeText(item.country || 'Unbekannt')}</span><strong>${Number(item.users) || 0}</strong></div>`).join('') || '<div class="muted">Noch keine Länder verfügbar.</div>';
          const plans = (data.plans || []).map(item => `<div class="row"><span>${escapeText(item.plan || 'Unbekannt')}</span><strong>${Number(item.users) || 0}</strong></div>`).join('') || '<div class="muted">Noch keine Plan-Daten.</div>';
          overview.innerHTML = `<div class="section-heading"><div><h3>Nutzerübersicht</h3><div class="muted">Aktuelle Installationen und Lizenzverteilung</div></div></div><div class="stats"><div class="stat"><strong>${Number(data.total) || 0}</strong><span>Installationen mit Einwilligung</span></div><div class="stat"><strong>${(data.countries || []).length}</strong><span>Länder mit Nutzern</span></div><div class="stat"><strong>${(data.plans || []).length}</strong><span>Aktive Plan-Arten</span></div></div><div class="overview-grid"><div class="overview-card"><h3>Nutzer nach Land</h3><div class="rows">${countries}</div></div><div class="overview-card"><h3>Nutzer nach Plan</h3><div class="rows">${plans}</div></div></div>`;
        };
        renderOverview(stats);
        const tabs = [...content.querySelectorAll('[data-admin-tab]')]; const views = [...content.querySelectorAll('[data-admin-view]')];
        for (const tab of tabs) tab.addEventListener('click', () => { for (const item of tabs) item.classList.toggle('active', item === tab); for (const view of views) view.hidden = view.dataset.adminView !== tab.dataset.adminTab; });
        content.querySelector('[data-refresh-stats]').addEventListener('click', async (event) => { const button = event.currentTarget; button.disabled = true; button.textContent = 'Wird aktualisiert …'; try { renderOverview(await loadStats(token)); } catch (refreshError) { overview.insertAdjacentHTML('afterbegin', `<p class="error">${escapeText(refreshError.message)}</p>`); } finally { button.disabled = false; button.textContent = 'Statistiken aktualisieren'; } });
        void renderLicenseManager(content.querySelector('[data-admin-view="keys"]'), token);
      } catch (err) {
        error.textContent = err.message || 'Login fehlgeschlagen.';
        submit.disabled = false;
      }
    });
  }

  function escapeText(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  let lastAppliedBackgroundEffect = '';
  function renderBackgroundEffect(layer, mode) {
    const effectColor = localStorage.getItem('babaEffectColor') || '#d8d8d8';
    const effectKey = mode + ':' + effectColor;
    if (!layer || layer.dataset.babaEffect === effectKey) return;
    layer.dataset.babaEffect = effectKey;
    layer.replaceChildren();
    layer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;';
    const parsedColor = effectColor.match(/^#([0-9a-f]{6})$/i);
    const colorParts = parsedColor ? parsedColor[1].match(/../g).map(value => parseInt(value,16)) : [216,216,216];
    layer.style.setProperty('--baba-effect-color', effectColor);
    layer.style.setProperty('--baba-effect-rgb', colorParts.join(','));
    if (mode === 'off') return;
    if (mode === 'rain') {
      for (let i=0;i<68;i++) { const drop=document.createElement('i'), h=26+Math.random()*86; drop.style.cssText='position:absolute;left:'+(Math.random()*100)+'%;top:-'+h+'px;width:1px;height:'+h+'px;background:linear-gradient(180deg,transparent,rgba(var(--baba-effect-rgb),.22));animation:babaRainFall '+(2.8+Math.random()*4.7)+'s linear '+(-Math.random()*7)+'s infinite'; layer.appendChild(drop); }
    } else if (mode === 'snow') {
      for (let i=0;i<54;i++) { const flake=document.createElement('i'); flake.textContent=['❄','✦','·'][i%3]; flake.style.cssText='position:absolute;left:'+(Math.random()*100)+'%;top:-30px;color:rgba(var(--baba-effect-rgb),.5);font-style:normal;font-size:'+(8+Math.random()*12)+'px;animation:babaSnowFall '+(7+Math.random()*11)+'s linear '+(-Math.random()*15)+'s infinite'; layer.appendChild(flake); }
    } else if (mode === 'matrix') {
      for (let i=0;i<34;i++) { const col=document.createElement('i'); col.textContent=Array.from({length:8+Math.floor(Math.random()*14)},()=>Math.random()<.5?'0':'1').join('\n'); col.style.cssText='position:absolute;left:'+(i*3+Math.random()*2)+'%;top:-220px;white-space:pre;color:rgba(var(--baba-effect-rgb),.24);font:11px/1.45 Consolas,monospace;animation:babaMatrixFall '+(5+Math.random()*9)+'s linear '+(-Math.random()*12)+'s infinite'; layer.appendChild(col); }
    } else if (mode === 'grid') {
      const grid=document.createElement('div'); grid.style.cssText='position:absolute;inset:-30%;background-image:linear-gradient(rgba(var(--baba-effect-rgb),.09) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--baba-effect-rgb),.09) 1px,transparent 1px);background-size:42px 42px;transform:perspective(420px) rotateX(58deg) scale(1.6);transform-origin:center bottom;animation:babaGridPulse 5s ease-in-out infinite'; layer.appendChild(grid);
    } else if (mode === 'stars') {
      for (let i=0;i<90;i++) { const star=document.createElement('i'); star.style.cssText='position:absolute;left:'+(Math.random()*100)+'%;top:'+(Math.random()*100)+'%;width:'+(1+Math.random()*2)+'px;height:'+(1+Math.random()*2)+'px;border-radius:50%;background:var(--baba-effect-color);opacity:.15;animation:babaTwinkle '+(1.5+Math.random()*4)+'s ease-in-out '+(-Math.random()*4)+'s infinite alternate'; layer.appendChild(star); }
    } else if (mode === 'fog' || mode === 'aurora') {
      for (let i=0;i<4;i++) { const mist=document.createElement('div'); mist.style.cssText='position:absolute;left:'+(i*24-12)+'%;top:'+(10+Math.random()*60)+'%;width:65vw;height:32vh;border-radius:50%;filter:blur(55px);background:radial-gradient(ellipse,rgba(var(--baba-effect-rgb),'+(mode==='fog'?'.10':'.075')+'),transparent 70%);animation:babaMistDrift '+(14+i*3)+'s ease-in-out '+(-i*4)+'s infinite alternate'; layer.appendChild(mist); }
    } else if (mode === 'particles') {
      for (let i=0;i<48;i++) { const dot=document.createElement('i'); const size=2+Math.random()*4; dot.style.cssText='position:absolute;left:'+(Math.random()*100)+'%;top:'+(Math.random()*100)+'%;width:'+size+'px;height:'+size+'px;border:1px solid rgba(var(--baba-effect-rgb),.28);border-radius:50%;animation:babaParticleFloat '+(7+Math.random()*12)+'s ease-in-out '+(-Math.random()*14)+'s infinite alternate'; layer.appendChild(dot); }
    } else if (mode === 'scanlines') {
      const lines=document.createElement('div'); lines.style.cssText='position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 3px,rgba(var(--baba-effect-rgb),.035) 4px,transparent 5px);animation:babaScanMove 8s linear infinite'; layer.appendChild(lines);
    } else if (mode === 'pulse') {
      const pulse=document.createElement('div'); pulse.style.cssText='position:absolute;left:50%;top:50%;width:min(48vw,520px);aspect-ratio:1;border:1px solid rgba(var(--baba-effect-rgb),.2);border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 50px rgba(var(--baba-effect-rgb),.03),inset 0 0 50px rgba(var(--baba-effect-rgb),.03);animation:babaPulse 5s ease-in-out infinite'; layer.appendChild(pulse);
    } else if (mode === 'orbit') {
      const orbit=document.createElement('div'); orbit.style.cssText='position:absolute;left:50%;top:50%;width:340px;height:130px;border:1px solid rgba(var(--baba-effect-rgb),.18);border-radius:50%;transform:translate(-50%,-50%) rotate(-25deg);animation:babaOrbit 18s linear infinite'; const core=document.createElement('i'); core.style.cssText='position:absolute;left:50%;top:-4px;width:7px;height:7px;border-radius:50%;background:var(--baba-effect-color);box-shadow:0 0 16px var(--baba-effect-color)'; orbit.appendChild(core); layer.appendChild(orbit);
    } else if (mode === 'rings') {
      for(let i=0;i<5;i++){const ring=document.createElement('div');ring.style.cssText='position:absolute;left:50%;top:50%;width:120px;height:120px;border:1px solid rgba(var(--baba-effect-rgb),.19);border-radius:50%;transform:translate(-50%,-50%);animation:babaRing 5s ease-out '+(i-5)+'s infinite';layer.appendChild(ring);}    } else if (mode === 'waves') {
      const wave=document.createElement('div'); wave.style.cssText='position:absolute;inset:-30%;background:radial-gradient(ellipse at 20% 55%,rgba(var(--baba-effect-rgb),.07),transparent 45%),radial-gradient(ellipse at 75% 45%,rgba(var(--baba-effect-rgb),.05),transparent 48%);background-size:140% 140%;animation:babaWaveMove 12s ease-in-out infinite alternate'; layer.appendChild(wave);
    }
  }
  function applyBackgroundEffect() {
    const mode = localStorage.getItem('babaBackgroundEffect') || 'rain';

    lastAppliedBackgroundEffect = mode;
    const globalLayer=document.getElementById('baba-global-rain');
    if(globalLayer){ renderBackgroundEffect(globalLayer,mode); globalLayer.style.position='fixed'; globalLayer.style.inset='0'; globalLayer.style.zIndex='2147483640'; globalLayer.style.opacity=mode==='off'?'0':'.42'; }
    const splash=document.getElementById('baba-welcome-splash');
    if(splash){ const layer=Array.from(splash.children).find(node=>node!==splash.firstElementChild&&node.style?.position==='absolute'&&node.style?.inset==='0px'); if(layer)renderBackgroundEffect(layer,mode); }
  }
  function sync() {
const root = document.documentElement;
    const accent = localStorage.getItem('babaAccentColor') || '#d8d8d8';
    const surface = localStorage.getItem('babaSurfaceColor') || '#090909';
    const effectColor = localStorage.getItem('babaEffectColor') || '#d8d8d8';
    root.style.setProperty('--color-primary', accent); root.style.setProperty('--color-accent', accent); root.style.setProperty('--color-bg', surface); root.style.setProperty('--baba-effect-color', effectColor);
    const match = effectColor.match(/^#([0-9a-f]{6})$/i); root.style.setProperty('--baba-effect-rgb', match ? match[1].match(/../g).map(value => parseInt(value,16)).join(',') : '216,216,216');
    applyBackgroundEffect();
    const isOwner = localStorage.getItem('baba_tweak_owner') === '1';
    let button = document.getElementById('baba-admin-button');
    if (isOwner && !button) {
      button = document.createElement('button');
      button.id = 'baba-admin-button';
      button.textContent = 'Admin';
      button.addEventListener('click', openSecretAdminGate);
      document.body.appendChild(button);
    } else if (!isOwner && button) button.remove();
    if (activated()) {
      showConsent();
      void sendAnalytics();
    }
  }

  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('storage', sync);
  window.addEventListener('baba-background-effect', applyBackgroundEffect);
  setInterval(sync, 2500);
  sync();
})();









