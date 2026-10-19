# Baba Tweak — automatische Updates

Dieses Repository enthält den aktuellen App-Build und baut bei jedem Git-Tag `v*` einen Windows-Installer sowie die Update-Metadaten. Benutzer erhalten die veröffentlichten Updates über `electron-updater`; sie müssen den Installer nicht für jedes Update erneut herunterladen.

## Einmalige Einrichtung

1. Erstelle auf GitHub ein **öffentliches** Repository namens `baba-tweak` (oder einen anderen Namen). Öffentliche Releases sind für den in der App eingebauten Updater erreichbar.
2. Lade diesen Projektordner in das Repository hoch.
3. Veröffentliche Updates mit einem neuen Tag, zum Beispiel `v2.24.1`. GitHub Actions baut und veröffentlicht den Installer und Update-Dateien automatisch.
4. Für jede Änderung, erhöhe die Version durch einen neuen Tag (`v2.24.2`, `v2.25.0` usw.). Änderungen müssen zuerst in das GitHub-Repository gepusht werden.

## Lokale Entwicklung

Installiere Node.js, dann im Projektordner `npm install`. Ein lokaler Build lässt sich mit `npx electron-builder --win nsis --publish never` erzeugen. Veröffentlichungen erstellt ausschließlich der GitHub-Tag-Workflow.

## Supabase

Die Edge-Functions und Migrationen liegen in `supabase/`. Lokale Link-Daten und Secrets gehören nicht ins Repository. Setze Supabase-Secrets ausschließlich im Supabase-Dashboard oder per CLI und veröffentliche Funktionen/Migrationen getrennt von den App-Releases.

> Niemals Service-Role-Keys, Admin-Passwörter oder geheime Signierschlüssel in den Client oder dieses öffentliche Repository committen. Alles, was in einer Desktop-App ausgeliefert wird, kann technisch von Nutzern extrahiert werden.
