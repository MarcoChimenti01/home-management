# home-management

Applicazione per la gestione dei compiti e delle spese di casa. Ogni componente familiare ha un accesso singolo e un'app mobile dedicata (funziona anche nel browser, utile in sviluppo).

## Stato del progetto

| Area | Stato |
|------|-------|
| Monorepo, Supabase, schema DB con RLS | ✅ fatto |
| Registrazione, accesso, famiglia con codice invito | ✅ fatto |
| Calendario, compiti e reminder (notifiche locali) | ✅ fatto, da provare con dati reali |
| Cassa comune (versamenti, spese, grafico mensile) | ⏳ da fare (la tab è un segnaposto) |
| Push verso altri componenti (Edge Function + pg_cron) | ⏳ da fare |
| Tipi TypeScript generati da Supabase | ⏳ da fare |
| Build di prova (EAS), TestFlight / Play interno | ⏳ da fare |

## Stack

- **Mobile:** React Native + Expo SDK 58 (TypeScript), Expo Router, React 19
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Edge Functions, pg_cron). Nessun backend custom.
- **Notifiche:** `expo-notifications` (locali per i reminder personali, push per quelli inviati ad altri)
- **Grafici:** `react-native-gifted-charts`
- **Stato/dati:** TanStack Query + `supabase-js`
- **Validazione:** zod
- **Runtime:** Node **22** (richiesto dall'SDK 58), gestito con `fnm` (vedi `.nvmrc`)

## Funzionalità (v1)

1. **Accesso:** ogni componente si registra con nome, email e password; poi crea una famiglia o entra con un **codice invito**.
2. **Calendario** con attività giornaliere e **reminder per singola persona**, via notifica:
   - vista mensile con indicatore sui giorni con attività;
   - aggiunta di attività con titolo, orario facoltativo, assegnatario e promemoria (all'ora, 10 min, 1 ora, 1 giorno prima);
   - completamento ed eliminazione delle attività.
3. **Economia di casa** *(da implementare)*:
   - la cassa è comune: nessuna divisione o rimborso tra persone;
   - ogni mese ogni componente versa una quota nella cassa;
   - si aggiungono le voci di spesa, che escono dalla cassa;
   - grafico delle spese mensili con navigazione ai mesi precedenti;
   - riepilogo del mese: versamenti, spese e saldo della cassa.

## Struttura repo

```
home-management/
├── apps/
│   └── mobile/
│       ├── app/                # schermate (Expo Router)
│       │   ├── (auth)/         # login, registrazione
│       │   ├── (onboarding)/   # crea/entra in una famiglia
│       │   └── (tabs)/         # Calendario, Cassa
│       └── src/
│           ├── components/     # AuthScreen, AddTaskModal
│           └── lib/            # supabase, sessione, famiglia, compiti, notifiche, date
├── supabase/
│   ├── migrations/             # schema SQL + RLS
│   ├── config.toml
│   └── seed.sql
├── packages/
│   └── shared/                 # schemi zod, tipi (da generare da Supabase)
├── start.ps1                   # avvio rapido (web + mobile)
└── README.md
```

## Modello dati

- `profiles` (utente, nome, push token)
- `households`, `household_members` (ruolo, codice d'invito)
- `tasks` (titolo, data, ora, assegnatario, completato)
- `reminders` (task, utente, orario)
- `contributions` (utente, mese, importo versato)
- `expenses` (importo, categoria, data, descrizione)
- `categories`
- viste `monthly_summary` e `monthly_expenses_by_category` per la cassa

Tutte le tabelle sono protette da RLS: si vede solo ciò che appartiene alla propria famiglia. La creazione di una famiglia e l'ingresso con codice passano dalle funzioni SQL `create_household` e `join_household`.

## Avvio

### Prerequisiti
- **Node 22**: `winget install Schniz.fnm`, poi `fnm install 22`
- **pnpm**: `npm install -g pnpm@9`
- File `apps/mobile/.env` (non è nel repo) con:
  ```
  EXPO_PUBLIC_SUPABASE_URL=https://<progetto>.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
  ```
  Esiste un esempio in `apps/mobile/.env.example`. Usa **solo** la chiave *publishable*: la chiave *secret* non deve mai finire nell'app né nel repo.

### Comandi
Dalla radice del progetto:

```powershell
.\start.ps1            # web nel browser + QR per il telefono (stessa rete Wi-Fi)
.\start.ps1 -Tunnel    # telefono via internet (serve il login Expo)
.\start.ps1 -Clear     # svuota la cache di Metro
```

Se PowerShell blocca lo script, o se preferisci il comando classico: `pnpm start` (equivale a `pnpm dev`) oppure `pnpm dev:tunnel`.

Lo script attiva Node 22, controlla che esista il `.env`, installa le dipendenze se mancano e avvia un solo server Expo: il web è su `http://localhost:8081` (per la vista telefono: F12, Ctrl+Shift+M) e il telefono si collega scansionando il QR con **Expo Go**.

Altri comandi: `pnpm typecheck` (controllo dei tipi di tutto il monorepo).

### Provare sul telefono
- Telefono e PC sulla **stessa Wi-Fi** (non rete ospiti, senza VPN).
- Se il PC è collegato all'hotspot dello stesso telefono, la connessione locale spesso non funziona: usa `-Tunnel`.
- Il tunnel richiede un account Expo gratuito. Crea un token su <https://expo.dev/settings/access-tokens> e nel terminale: `$env:EXPO_TOKEN = "<token>"`.
- Nel **browser** le notifiche non funzionano: per provare i reminder serve il telefono.

## Configurazione di Supabase (progetto cloud)

1. **Schema:** in *SQL Editor* esegui il contenuto di `supabase/migrations/20261026000000_init.sql`.
2. **Email:** in *Authentication → Sign In / Providers → Email*:
   - **Confirm email attivo**: la registrazione invia un'email con il link di conferma;
   - spento in sviluppo, se vuoi evitare il limite di invii (`over_email_send_rate_limit`).
3. **URL:** in *Authentication → URL Configuration*:
   - **Site URL:** `http://localhost:8081`
   - **Redirect URLs:** `http://localhost:8081/**`, `exp://**`, `homemanagement://**`
4. **Invio email a tutti i familiari:** il servizio email integrato recapita solo agli indirizzi del team Supabase e con un limite molto basso. Per i familiari serve un **SMTP personalizzato** (*Authentication → SMTP Settings*). Opzione gratuita: un Gmail dedicato all'app con una "password per le app" (`smtp.gmail.com`, porta `465`).

## Note tecniche

- Per la v1 i reminder sono solo **notifiche** (niente sveglie/allarmi nativi).
- I reminder vengono salvati nel DB. Ogni dispositivo, all'avvio e dopo ogni modifica, programma come notifiche locali i propri reminder futuri: chi riceve un'attività assegnata da altri ottiene la notifica quando apre l'app. Per notifiche immediate verso altri servono le push (Edge Function + pg_cron + Expo Push), non ancora implementate.
- Il link di conferma email porta alla pagina di accesso (`/login`). Finché l'app non ha un sito pubblico o una build con deep link, il link funziona solo sul dispositivo di sviluppo.
- Sul web la sessione è salvata in `localStorage`; su telefono in SecureStore.
- Il client Supabase non usa ancora i tipi generati: si ottengono con `supabase gen types` dopo `supabase login`.

## Problemi noti

- **"Could not connect to the server" sul telefono:** rete locale/hotspot, vedi *Provare sul telefono*.
- **L'app si chiude in Expo Go:** Expo Go supporta solo gli SDK recenti; il progetto è già sull'SDK 58.
- **Errori di Expo con Node 20:** serve Node 22 o superiore.
- **Messaggi di errore e conferma:** non usano gli avvisi del browser ma notifiche a comparsa (toast) in alto. Si chiamano con `showError(...)` e `showInfo(...)` da `src/lib/alert.ts`; il componente `ToastHost` nel layout principale le mostra.

## Prossimi passi

1. Cassa comune: tabelle già pronte, schermate di versamenti e spese, grafico mensile con mesi precedenti, riepilogo.
2. Push per i reminder verso altri componenti.
3. Tipi generati da Supabase e test delle policy RLS.
4. Rifinitura grafica (data leggibile, Calendario centrato su schermi larghi), stati vuoti, errori.
5. Build con EAS e beta su TestFlight / Play interno.
