# Entwicklungsumgebung aufsetzen

Diese Anleitung beschreibt Schritt für Schritt, wie du die Entwicklungsumgebung für "Lands of Glory" einrichtest und das Projekt zum Laufen bringst.

## Voraussetzungen

### 1. Node.js und npm installieren

Das Projekt benötigt Node.js (Version 18 oder höher empfohlen).

**Linux/macOS:**
```bash
# Mit Node Version Manager (nvm) - empfohlen
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc  # oder ~/.zshrc
nvm install 20
nvm use 20

# Überprüfen
node --version  # Sollte v20.x.x anzeigen
npm --version   # Sollte 10.x.x anzeigen
```

**Windows:**
- Lade Node.js von [nodejs.org](https://nodejs.org/) herunter (LTS-Version)
- Installer ausführen
- In PowerShell oder CMD:
```cmd
node --version
npm --version
```

**Alternative (alle Plattformen) - Mit npm direkt:**
```bash
# npm wird mit Node.js automatisch installiert
# Falls npm veraltet ist:
npm install -g npm@latest
```

### 2. Git installieren (falls nicht vorhanden)

**Linux:**
```bash
sudo apt-get install git        # Debian/Ubuntu
sudo yum install git            # CentOS/RHEL
sudo pacman -S git              # Arch Linux
```

**macOS:**
```bash
# Git wird mit Xcode Command Line Tools installiert
xcode-select --install

# Oder mit Homebrew:
brew install git
```

**Windows:**
- Lade Git von [git-scm.com](https://git-scm.com/download/win) herunter
- Installer ausführen

## Projekt einrichten

### 1. Repository klonen

```bash
# In das gewünschte Verzeichnis wechseln
cd /pfad/zu/deinen/projekten

# Repository klonen
git clone https://github.com/maieuticus/lands-of-glory.git

# In das Projektverzeichnis wechseln
cd lands-of-glory
```

### 2. Abhängigkeiten installieren

```bash
# Alle Abhängigkeiten für Workspaces installieren
npm install

# Oder verkürzt:
npm i
```

**Was passiert hier:**
- Installiert alle Pakete für Root-Projekt
- Installiert Abhängigkeiten für `packages/game-core`
- Installiert Abhängigkeiten für `apps/prototype`

### 3. Projekt bauen

```bash
# TypeScript kompilieren und Build erstellen
npm run build
```

**Ausgabe sollte ähnlich sein:**
```
> @lands-of-glory/game-core@1.0.0 build
> tsc

> lands-of-glory-prototype@1.0.0 build
> tsc && vite build
```

## Entwicklungsserver starten

### Lokaler Dev-Server

```bash
npm run dev
```

**Ausgabe:**
```
> lands-of-glory-prototype@1.0.0 dev
> vite

  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
  ➜  press h + enter to show help
```

**Öffne im Browser:** http://localhost:3000

### Steuerung im Spiel

| Taste | Aktion |
|-------|--------|
| `D` | Debug-Modus ein/aus |
| `E` | Zug beenden |
| `ESC` | Auswahl aufheben |
| `Linke Maustaste` | Commander auswählen / bewegen / angreifen |
| `Rechte Maustaste + Ziehen` | Kamera bewegen (Panning) |
| `Mausrad` | Zoomen |
| `Drag & Drop` | Figuren bewegen |

## Tests ausführen

### Alle Tests

```bash
npm test
```

### Struktur-Tests (ohne npm install nötig)

```bash
npm run test:structure
```

### Tests im Watch-Modus (während der Entwicklung)

```bash
npm run test:watch
```

### Code-Qualität prüfen

```bash
# Linting
npm run lint

# Type-Checking
npm run type-check
```

## Fehlerbehebung

### Problem: `npm install` schlägt fehl

**Lösung:**
```bash
# Cache leeren und neu installieren
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Problem: `npm run build` schlägt fehl

**Lösung:**
```bash
# Alles zurücksetzen und neu aufbauen
rm -rf node_modules package-lock.json
rm -rf packages/game-core/dist
rm -rf packages/game-core/node_modules
rm -rf apps/prototype/dist
rm -rf apps/prototype/node_modules
npm install
npm run build
```

### Problem: Port 3000 ist bereits belegt

**Lösung:**
```bash
# Finde den Prozess, der Port 3000 verwendet
# Linux/macOS:
lsof -i :3000
kill -9 <PID>

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Oder starte auf anderem Port:
npm run dev -- --port 3001
```

### Problem: TypeScript-Fehler

**Lösung:**
```bash
# TypeScript-Compiler direkt aufrufen
cd packages/game-core
npx tsc --noEmit

# Im Prototype:
cd apps/prototype
npx tsc --noEmit
```

### Problem: Berechtigungsfehler (Linux/macOS)

**Lösung:**
```bash
# Nutze niemals sudo mit npm!
# Stattdessen: Ändere die npm-Standardverzeichnisse
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

## Projektstruktur verstehen

```
lands-of-glory/
├── apps/
│   └── prototype/          # PixiJS Browser-Anwendung
│       ├── src/            # TypeScript-Quellcode
│       ├── index.html      # Einstiegspunkt
│       └── package.json    # App-spezifische Abhängigkeiten
├── packages/
│   └── game-core/          # Spiellogik & Regeln
│       ├── src/            # TypeScript-Quellcode
│       ├── tests/          # Unit-Tests
│       └── package.json    # Paket-Konfiguration
├── specs/                  # Fachliche Spezifikationen
├── docs/                   # Architektur-Dokumentation
├── package.json            # Root-Konfiguration (Workspaces)
└── SETUP.md               # Diese Datei
```

## Entwicklungs-Workflow

1. **Code ändern** in `packages/game-core/src/` oder `apps/prototype/src/`
2. **Tests laufen lassen:** `npm test`
3. **Dev-Server läuft im Hintergrund:** `npm run dev`
4. **Im Browser prüfen:** http://localhost:3000
5. **Änderungen sind sofort sichtbar** (Hot Module Replacement)

## Produktions-Build erstellen

```bash
# Optimierten Build für Produktion erstellen
npm run build

# Ausgabe befindet sich in:
# - apps/prototype/dist/
```

## Nützliche Links

- **Repository:** https://github.com/maieuticus/lands-of-glory
- **Node.js:** https://nodejs.org/
- **PixiJS:** https://pixijs.com/
- **Vite:** https://vitejs.dev/

## Support

Bei Problemen:
1. Prüfe, ob alle Voraussetzungen erfüllt sind
2. Siehe Abschnitt "Fehlerbehebung"
3. Erstelle ein Issue im Repository
