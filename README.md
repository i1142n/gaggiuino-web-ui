# GAGGIUINO custom WebUI
---


# Nutzung
---
Voraussetzung: Node.js 22.18 oder neuer (führt die TypeScript-Dateien des Servers direkt aus).

```sh
npm install
```

| Befehl | Was passiert |
|---|---|
| `npm run dev` | Entwicklung: Server auf Port 3000, Vite auf http://localhost:5173 (leitet `/api` an den Server weiter) |
| `npm run build` | Typecheck, dann Build der Oberfläche nach `dist/web` |
| `npm start` | Server liefert `dist/web` aus, Port aus `PORT` (Standard 80), z. B. `PORT=3100 npm start` |
| `npm run fake` | Fake-Gaggiuino auf `127.0.0.1`, Port aus `FAKE_PORT` (Standard 8080) |

Simulierter Brühvorgang am Fake (Dauer optional, Standard 60 s):

```sh
curl -X POST 'http://127.0.0.1:8080/fake/brew?seconds=10'
```

Gaggiuino-Adresse auf den Fake setzen (gespeichert in `data/app.sqlite`):

```sh
node --input-type=module -e "import { setSetting } from './server/settings.ts'; setSetting('gaggiuinoAddress', '127.0.0.1:8080')"
```

Zurück zur Maschine: derselbe Befehl mit `'192.168.8.103'`.
