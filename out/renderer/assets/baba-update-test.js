(() => {
  let presses = 0;
  let resetTimer;

  const showUpdateTest = async () => {
    if (document.querySelector("#baba-update-test")) return;

    const style = document.createElement("style");
    style.id = "baba-update-test-style";
    style.textContent = `
      #baba-update-test{position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,.82);backdrop-filter:blur(12px);font-family:Inter,"Segoe UI",sans-serif;color:#f4f4f4}
      #baba-update-test *{box-sizing:border-box}
      #baba-update-test .baba-card{width:min(460px,100%);padding:30px;border:1px solid #343434;border-radius:18px;background:linear-gradient(145deg,#171717,#090909);box-shadow:0 28px 100px #000;text-align:center}
      #baba-update-test .baba-mark{width:48px;height:48px;margin:0 auto 18px;display:grid;place-items:center;border:1px solid #414141;border-radius:15px;background:#202020;font-size:23px}
      #baba-update-test h2{margin:0 0 8px;font-size:22px;letter-spacing:.01em}
      #baba-update-test p{margin:0;color:#a6a6a6;font-size:14px;line-height:1.6}
      #baba-update-test .baba-version{display:inline-flex;margin:18px 0 12px;padding:8px 13px;border:1px solid #383838;border-radius:999px;background:#111;font:600 12px ui-monospace,monospace;color:#eee}
      #baba-update-test .baba-status{min-height:42px;margin:2px 0 18px;color:#c5c5c5;font-size:13px}
      #baba-update-test button{width:100%;padding:12px 16px;border:1px solid #eee;border-radius:10px;background:#f0f0f0;color:#090909;font-size:14px;font-weight:700;cursor:pointer}
      #baba-update-test button:hover{background:#d8d8d8}
      #baba-update-test .baba-hint{margin-top:13px;color:#777;font-size:11px}
    `;
    document.head.appendChild(style);

    const modal = document.createElement("div");
    modal.id = "baba-update-test";
    modal.innerHTML = `<section class="baba-card" role="dialog" aria-modal="true" aria-labelledby="baba-update-title"><div class="baba-mark">↻</div><h2 id="baba-update-title">Update-Test</h2><p>Baba Tweak Update-Verbindung wird geprüft.</p><div class="baba-version">Installierte Version wird geladen …</div><div class="baba-status" aria-live="polite">Verbinde mit dem Update-Server …</div><button type="button">Schließen</button><div class="baba-hint">Mit Esc oder der Schaltfläche schließen</div></section>`;
    document.body.appendChild(modal);

    const close = () => {
      modal.remove();
      style.remove();
      window.removeEventListener("keydown", onEscape, true);
    };
    const onEscape = (event) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onEscape, true);
    modal.querySelector("button").addEventListener("click", close);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) close();
    });

    const version = modal.querySelector(".baba-version");
    const status = modal.querySelector(".baba-status");
    try {
      const currentVersion = await window.electron.ipcRenderer.invoke("updater:get-version");
      version.textContent = `Installierte Version · ${currentVersion}`;
      const result = await window.electron.ipcRenderer.invoke("updater:check");
      if (!result?.ok) {
        status.textContent = `Update-Prüfung fehlgeschlagen: ${result?.error || "Verbindung nicht verfügbar."}`;
        return;
      }
      const compareVersions = (left, right) => {
        const a = String(left).split(/[.+-]/).map((part) => Number(part) || 0);
        const b = String(right).split(/[.+-]/).map((part) => Number(part) || 0);
        for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
          const difference = (a[index] || 0) - (b[index] || 0);
          if (difference !== 0) return difference;
        }
        return 0;
      };
      if (result.updateInfo?.version && compareVersions(result.updateInfo.version, currentVersion) > 0) {
        status.textContent = `Update ${result.updateInfo.version} gefunden. Es wird automatisch heruntergeladen und beim Beenden installiert.`;
      } else {
        status.textContent = "Du hast die neueste Version. Die Update-Verbindung funktioniert.";
      }
    } catch {
      status.textContent = "Update-Prüfung fehlgeschlagen. Bitte prüfe deine Internetverbindung.";
    }
  };

  window.addEventListener("keydown", (event) => {
    if (event.key !== "F1" || event.repeat) return;
    event.preventDefault();
    event.stopPropagation();
    presses += 1;
    clearTimeout(resetTimer);
    if (presses >= 3) {
      presses = 0;
      showUpdateTest();
      return;
    }
    resetTimer = setTimeout(() => { presses = 0; }, 1500);
  }, true);
})();
