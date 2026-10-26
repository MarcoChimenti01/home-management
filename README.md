# home-management

Applicazione per la gestione dei compiti e delle spese di casa. Ogni componente familiare ha un accesso singolo e un'app mobile dedicata (funziona anche nel browser, utile in sviluppo).

## Stato del progetto

| Area | Stato |
|------|-------|
| Monorepo, Supabase, schema DB con RLS | ✅ fatto |
| Registrazione, accesso, gruppi (più gruppi per utente, codice invito) | ✅ fatto |
| Calendario, compiti e reminder (notifiche locali) | ✅ fatto, da provare con dati reali |
| Cassa comune (budget, spese, riepilogo mensile e categorie) | ✅ fatto |
| Push verso altri componenti (Edge Function + pg_cron) | ⏳ da fare |
| Tipi TypeScript generati da Supabase | ⏳ da fare |
| Build di prova (EAS), TestFlight / Play interno | ⏳ da fare |

## Stack

- **Mobile:** React Native + Expo SDK 58 (TypeScript), Expo Router, React 19
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Edge Functions, pg_cron). Nessun backend custom.
- **Notifiche:** `expo-notifications` (locali per i reminder personali, push per quelli inviati ad altri)
- **Grafici:** `react-native-gifted-charts`
- **Stato/dati:** TanStack Query + `supabase-js`
- **Interfaccia:** stile Bootstrap 5 ricreato con componenti React Native, uguale su mobile e web (vedi *Stile e layout*).
- **Validazione:** zod
- **Runtime:** Node **22** (richiesto dall'SDK 58), gestito con `fnm` (vedi `.nvmrc`)

## Funzionalità (v1)

1. **Accesso e gruppi:** ogni componente si registra con nome, email e password. Può far parte di **più gruppi** (es. "Casa Chimenti", "Casa al mare"): dalla tab **Gruppi** vede l'elenco, cambia il gruppo attivo, ne crea di nuovi, entra con un **codice invito** o esce da un gruppo. Calendario e cassa mostrano i dati del gruppo attivo, che l'app ricorda tra un avvio e l'altro.
2. **Calendario** con attività giornaliere e **reminder per singola persona**, via notifica:
   - vista mensile con indicatore sui giorni con attività;
   - aggiunta di attività con titolo, orario facoltativo, assegnatario e promemoria (all'ora, 10 min, 1 ora, 1 giorno prima);
   - completamento ed eliminazione delle attività.
3. **Navigazione:** menu laterale con Calendario, Cassa e Gruppi, gruppo attivo in evidenza ed Esci. Fisso su schermi larghi (≥ 768 px), a scomparsa col pulsante ☰ su telefono. In alto un **breadcrumb** (`Home › Gruppo › Pagina`) con link cliccabili.
4. **Economia di casa**:
   - la cassa è comune: nessuna divisione o rimborso tra persone;
   - ogni componente può aggiungere il proprio budget mensile;
   - si registrano le spese con descrizione, data e categoria;
   - riepilogo mensile di budget, spese, saldo e percentuale utilizzata;
   - andamento delle spese per categoria e storico dei movimenti;
   - navigazione tra i mesi e cancellazione dei propri movimenti.

## Stile e layout (Bootstrap)

Bootstrap è una libreria CSS solo per il web, quindi non si usa direttamente: lo **stile Bootstrap 5** è ricreato con componenti React Native in `apps/mobile/src/ui/`, così web e telefono sono identici.

| Componente | Equivalente Bootstrap |
|------------|-----------------------|
| `theme.ts` | palette (`primary` #0d6efd, `success`, `danger`…), raggi, spaziature, breakpoint (576/768/992/1200) |
| `Button` | `.btn`, `.btn-{variante}`, `.btn-outline-*`, `.btn-sm/.btn-lg`, `.w-100` |
| `Input` | `.form-label` + `.form-control` (+ testo di aiuto ed errore) |
| `Card`, `CardHeader`, `CardBody` | `.card`, `.card-header`, `.card-body` |
| `Badge` | `.badge` |
| `ListGroup`, `ListGroupItem` | `.list-group`, `.list-group-item` |
| `Breadcrumb` | `.breadcrumb` |
| `Container`, `Row`, `Col` | griglia a 12 colonne con `sm/md/lg/xl` |
| `Pills` | gruppo di bottoni a scelta singola |

Layout generale (`components/AppShell.tsx`): navbar scura in alto, menu laterale a pillole (fisso da 768 px in su, "offcanvas" con ☰ sotto), breadcrumb sopra il contenuto. Le notifiche a comparsa usano i colori di `.alert-danger` / `.alert-success`. Per nuove schermate importa da `@/ui`.

## Struttura repo

```
home-management/
├── apps/
│   └── mobile/
│       ├── app/                # schermate (Expo Router)
│       │   ├── (auth)/         # login, registrazione
│       │   ├── (onboarding)/   # primo gruppo (solo se non se ne ha nessuno)
│       │   └── (tabs)/         # Calendario, Cassa, Gruppi
│       └── src/
│           ├── ui/             # componenti in stile Bootstrap (Button, Card, Grid…)
│           ├── components/     # AppShell (navbar + menu + breadcrumb), AuthScreen, AddTaskModal, MembersPanel, ToastHost
│           └── lib/            # supabase, sessione, gruppi, compiti, notifiche, date
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

Tutte le tabelle sono protette da RLS: si vede solo ciò che appartiene ai propri gruppi.

### Permessi
Ogni membro ha un ruolo **per gruppo** (`household_members.role`):

| Ruolo | Vede i dati | Crea/modifica/elimina | Gestisce i membri |
|-------|:-----------:|:---------------------:|:-----------------:|
| `admin` (chi crea il gruppo) | ✅ | ✅ | ✅ |
| `member` (chi entra col codice) | ✅ | ✅ | ❌ |
| `viewer` (solo lettura) | ✅ | ❌ | ❌ |

I permessi sono applicati dal database (RLS), non solo dall'app. L'amministratore li cambia dalla tab **Gruppi → Membri e permessi**, e può rimuovere un membro. Cambio ruolo, rimozione e uscita passano da funzioni SQL (`set_member_role`, `remove_member`, `leave_household`) che impediscono di lasciare un gruppo senza amministratore. Chi entra con un codice parte come `member`. La creazione di una famiglia e l'ingresso con codice passano dalle funzioni SQL `create_household` e `join_household`.

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

1. **Schema:** in *SQL Editor* esegui, **in ordine**, i file di `supabase/migrations/`:
   1. `20261026000000_init.sql` (tabelle, viste, RLS base)
   2. `20261027000000_roles.sql` (ruoli e permessi per gruppo)
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

1. Push per i reminder verso altri componenti.
2. Tipi generati da Supabase e test delle policy RLS.
3. Cassa: nascondere i pulsanti di modifica a chi ha il ruolo "solo lettura" (il database già lo impedisce).
4. Build con EAS e beta su TestFlight / Play interno.
