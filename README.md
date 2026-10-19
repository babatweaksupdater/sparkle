# Baba Tweak — automatische Updates

Dieses Repository enthält den aktuellen App-Build. Bei jedem Push auf `main` baut GitHub Actions automatisch einen Windows-Installer, legt einen Versions-Tag an und veröffentlicht die Update-Dateien. Benutzer erhalten veröffentlichte Updates über `electron-updater`.

## Einmalige Einrichtung

1. Das GitHub-Repository muss **öffentlich** sein, damit der eingebaute Updater Releases abrufen kann.
2. Jede Änderung, die nach `main` gepusht wird, startet den Build und Release automatisch. Der Workflow erhöht die Patch-Version und erstellt den passenden Tag.
3. Änderungen müssen zuerst in das GitHub-Repository gepusht werden.

## Lokale Entwicklung

Installiere Node.js, dann im Projektordner `npm install`. Ein lokaler Build lässt sich mit `npx electron-builder --win nsis --publish never` erzeugen. Veröffentlichungen erstellt der GitHub-Workflow.

## Supabase

Die Edge-Functions und Migrationen liegen in `supabase/`. Lokale Link-Daten und Secrets gehören nicht ins Repository. Setze Supabase-Secrets ausschließlich im Supabase-Dashboard oder per CLI und veröffentliche Funktionen/Migrationen getrennt von den App-Releases.

> Niemals Service-Role-Keys, Admin-Passwörter oder geheime Signierschlüssel in den Client oder dieses öffentliche Repository committen. Alles, was in einer Desktop-App ausgeliefert wird, kann technisch von Nutzern extrahiert werden.
