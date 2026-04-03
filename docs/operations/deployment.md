# Deployment

## Ziel des Deployments

Ein Deployment ersetzt den aktuell laufenden App-Stand durch ein neues Release, ohne die produktive `.env` zu verlieren und ohne die Datenbank separat zu migrieren oder zu zerstückeln.

## Aktuell dokumentierter Produktivhost

- User: `kicktipp`
- Host: `regulus.uberspace.de`
- Domain: `https://kicktipp.schultypografie.de`
- App-Pfad: `/home/kicktipp/kicktipp-deluxe`
- Release-Basis: `/home/kicktipp/releases`
- Laufzeitprozess: `supervisord`
- interner App-Port: `3000`

## Release-Struktur

Der aktive App-Pfad ist ein Symlink auf ein Release-Verzeichnis.

Beispiel:

```text
/home/kicktipp/kicktipp-deluxe -> /home/kicktipp/releases/kicktipp-20260403-003441
```

Dieses Modell erlaubt:

- atomisches Umschalten auf einen neuen Stand
- Rollback per Symlink-Wechsel
- klare Trennung zwischen altem und neuem Release

## Bevorzugter Deploy-Pfad

Auf dem aktuellen Host ist der robuste Weg:

1. Quellstand ohne `node_modules`, `.next` und `.env` hochladen
2. `.env` im Release ergänzen
3. lokalen Produktionsbuild erzeugen
4. nur die benötigten `.next`-Artefakte hochladen
5. Release auf vorhandene produktive `node_modules` zeigen lassen
6. `supervisord` auf das neue Release umschalten

Grund dafür:

- `npm ci` oder `next build` auf dem Host kann wegen RAM-Grenzen mit `Killed` enden
- ein zweites komplettes `node_modules` kann die Disk-Quota unnötig belasten

## Serverzustand vor dem Deploy prüfen

```bash
ssh kicktipp@regulus.uberspace.de

supervisorctl status
uberspace web backend list
node -v
npm -v
mysql --version
cat ~/etc/services.d/kicktipp.ini
cd ~/kicktipp-deluxe
git status --short
```

Ohne grünen Ausgangszustand kein Deploy.

## Release hochladen

Lokal im Repository:

```bash
ts=$(date +%Y%m%d-%H%M%S)
tar \
  --exclude=.git \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.env \
  --exclude=tsconfig.tsbuildinfo \
  -czf - . \
| ssh kicktipp@regulus.uberspace.de "set -e; rel=\$HOME/releases/kicktipp-$ts; mkdir -p \$rel; tar -xzf - -C \$rel; cp \$HOME/kicktipp-deluxe/.env \$rel/.env; echo \$rel"
```

Das Ergebnis ist ein neues Release-Verzeichnis unter `~/releases`.

## Lokalen Produktionsbuild hochladen

Zuerst lokal:

```bash
npm run build
```

Danach nur produktionsrelevante `.next`-Artefakte hochladen:

```bash
tar \
  --exclude='.next/dev' \
  --exclude='.next/cache' \
  --exclude='.next/standalone' \
  --exclude='.next/build' \
  --exclude='.next/node_modules' \
  -czf - .next \
| ssh kicktipp@regulus.uberspace.de "rel=\$HOME/releases/kicktipp-<timestamp>; rm -rf \$rel/.next; tar -xzf - -C \$rel"
```

## Release mit produktiven Abhängigkeiten verbinden

Auf dem Server:

```bash
ssh kicktipp@regulus.uberspace.de

rel=/home/kicktipp/releases/kicktipp-<timestamp>
current=$(readlink -f ~/kicktipp-deluxe)

rm -rf "$rel/node_modules"
ln -s "$current/node_modules" "$rel/node_modules"
```

Wichtig:

- für den Laufzeitbetrieb ist dieser Symlink geeignet
- für einen Turbopack-Server-Build ist er nicht geeignet
- ein Server-Build mit ausgelagertem `node_modules` kann an einer ungültigen Symlink-Auflösung scheitern

## Migrationen

Wenn sich das Datenbankschema geändert hat, nach dem Build und vor dem Umschalten:

```bash
cd /home/kicktipp/releases/kicktipp-<timestamp>
npm run db:migrate
```

Das Kommando führt `prisma migrate deploy` aus und ist für Produktionsmigrationen vorgesehen.

## Aktives Release umschalten

```bash
ssh kicktipp@regulus.uberspace.de

rel=/home/kicktipp/releases/kicktipp-<timestamp>
ts=$(date +%Y%m%d-%H%M%S)

supervisorctl stop kicktipp
mv ~/kicktipp-deluxe ~/kicktipp-deluxe-predeploy-$ts
ln -s "$rel" ~/kicktipp-deluxe
supervisorctl start kicktipp
sleep 5
supervisorctl status kicktipp
```

Erwartet ist ein `RUNNING`-Status.

## Server-Build nur als Ausnahme

Nur wenn ausreichend RAM und Disk-Quota vorhanden sind:

```bash
ssh kicktipp@regulus.uberspace.de

rel=/home/kicktipp/releases/kicktipp-<timestamp>

rm -rf "$rel/node_modules"
cp -a ~/kicktipp-deluxe/node_modules "$rel/"

cd "$rel"
npm run build
npm run db:migrate
```

Wenn `npm ci` oder `npm run build` mit `Killed` endet, ist das kein logischer App-Fehler, sondern typischerweise ein Host-Limit.

## Abschluss

Nach jedem Deployment direkt die Checks aus [Verifikationscheckliste](./verification-checklist.md) durchlaufen.
