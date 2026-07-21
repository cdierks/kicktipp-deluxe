# Datenbank

## Laufzeit und Verbindung

Kicktipp Deluxe 5.0.0 verwendet Prisma 7 mit dem MariaDB-Adapter und eine
MySQL-kompatible Datenbank. `DATABASE_URL` muss eine vollständige
`mysql://`-URL mit Host, Benutzer und Datenbankname sein; ohne Port gilt `3306`.

Für die dokumentierte Produktion:

```text
Server: localhost
Datenbank: kicktipp
```

Die Anwendung validiert die URL beim Start. Öffentliche Produktionshosts
benötigen außerdem eine HTTPS-`NEXTAUTH_URL`; lokale, Loopback- und private
Netzwerkziele dürfen für eine bewusste Standalone-Installation HTTP verwenden.
Auth- und Cron-Secrets müssen mindestens 32 Zeichen lang sein.

## Migrationen in Produktion

Der Standard-Deploy führt Migrationen nur mit `run.sh --migrate` aus. Dabei
kommt nicht ein globales `npx` und nicht die Runtime des alten Releases zum
Einsatz, sondern die im neuen Release über Lockfile gepinnte Runtime:

```text
<release>/.migration/node_modules/.bin/prisma migrate deploy \
  --config <release>/.migration/prisma.config.ts
```

`link-runtime.sh` prüft vor dem Umschalten, dass diese Runtime vorhanden ist
und Prisma exakt Version 7.8.0 meldet.

Vor jeder Produktionsmigration:

1. valides App- und DB-Backup erstellen;
2. Migration gegen eine Kopie des Produktionsstands testen;
3. Expand/Contract-Kompatibilität mit altem und neuem Release bestätigen;
4. SQL-Restore-Plan und verantwortliche Person festlegen;
5. erst dann `bash scripts/deploy/run.sh --migrate` ausführen.

Der automatische App-Rollback nimmt keine Datenbankmigration zurück.
Destruktive Änderungen wie Drop, Rename oder irreversible Datenkonvertierung
müssen deshalb in getrennten, kontrollierten Schritten erfolgen.

## Lokale Schemaentwicklung

```bash
npm exec prisma -- migrate dev --name beschreibung
npm run typecheck
npm run test
```

`migrate dev` ist kein Produktionskommando. Für die lokale, bereits installierte
Toolchain stehen außerdem bereit:

```bash
npm run db:migrate
npm run db:studio
npm run db:seed
```

## Seed-Verhalten

Vor `npm run db:seed` müssen `SEED_ADMIN_EMAIL` und `SEED_ADMIN_PASSWORD`
explizit gesetzt sein. Das Seed-Skript besitzt keine Standard-Zugangsdaten und
weist Beispielwerte zurück. Das Passwort muss mindestens 12 Zeichen haben und
darf höchstens 72 UTF-8-Bytes umfassen; es wird nicht protokolliert.

Der Seed pflegt idempotent:

- den initialen Admin, sofern die konfigurierte E-Mail noch nicht existiert;
- die Standard-Farbpalette;
- die jahreszeitlich passende Bundesliga-Saison, ohne eine bestehende aktive
  Saison zu überschreiben;
- die Einstellung `registrationEnabled=true`.

## Betriebsrelevante Invarianten

- `User`: eindeutige E-Mail und Nickname; mindestens ein Admin muss erhalten
  bleiben.
- `Season`: eindeutiges Jahr; fachlich höchstens eine aktive Saison.
- `Matchday`: eindeutige Kombination aus Saison und Spieltagsnummer; fachlich
  höchstens ein aktiver Spieltag.
- `Match`: global eindeutige OpenLigaDB-ID.
- `Tip`: eindeutige Kombination aus Benutzer und Spiel; Punkte sind bis zur
  Wertung `null`.
- `AppSetting`: eindeutiger Schlüssel; `registrationEnabled` ist exakt `true`
  oder `false`.

Die Saisonaktivierung und die Spieltagsaktivierung sind getrennte
Betriebszustände. Nach Importen, Migrationen oder manuellen Eingriffen beide
explizit prüfen.

## Direkte Datenbearbeitung

Prisma Studio ist für lokale Inspektion verfügbar. In Produktion sind
reproduzierbare Migrationen, abgesicherte Admin-Funktionen oder dokumentierte
SQL-Eingriffe vorzuziehen. Vor jeder direkten Änderung Backup, Transaktion,
Rollback-Plan und anschließende Fachprüfung festlegen.
