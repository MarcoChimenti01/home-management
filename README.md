# home-management

Applicazione per la gestione dei compiti e delle spese di casa. Ogni componente familiare ha un accesso singolo e un'app mobile dedicata.

## Stack

- **Mobile:** React Native + Expo (TypeScript), Expo Router
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Edge Functions, pg_cron). Nessun backend custom.
- **Notifiche:** `expo-notifications` (locali per i reminder personali, push per quelli inviati ad altri)
- **Grafici:** `react-native-gifted-charts`
- **Stato/dati:** TanStack Query + `supabase-js`
- **Validazione:** zod

## Funzionalità (v1)

1. **Login** per ogni componente, con famiglia e codice d'invito.
2. **Calendario** con attività giornaliere e **reminder per singola persona**, via notifica (o allarme).
3. **Economia di casa:**
   - la cassa è comune: nessuna divisione o rimborso tra persone;
   - ogni mese ogni componente versa una quota nella cassa;
   - si aggiungono le voci di spesa, che escono dalla cassa;
   - grafico delle spese mensili con navigazione ai mesi precedenti;
   - riepilogo del mese: versamenti, spese e saldo della cassa.
4. **Aggiunta e modifica** di spese e compiti.

## Struttura repo

```
home-management/
├── apps/
│   └── mobile/            # Expo app
├── supabase/
│   ├── migrations/        # schema SQL + RLS
│   ├── functions/         # Edge Functions (invio push reminder)
│   └── seed.sql
├── packages/
│   └── shared/            # tipi generati da Supabase, schemi zod
├── docs/
└── README.md
```

## Modello dati

- `profiles` (utente, nome, push token)
- `households`, `household_members` (ruolo, codice d'invito)
- `tasks` (titolo, data, assegnatario, stato, ricorrenza)
- `reminders` (task, utente, orario)
- `contributions` (utente, mese, importo versato)
- `expenses` (importo, categoria, data, pagante, descrizione)
- `categories`

Tutte le tabelle sono protette da RLS: si vede solo ciò che appartiene alla propria famiglia.

## Note tecniche

- Per la v1 i reminder sono solo **notifiche** (niente sveglie/allarmi nativi).
- I reminder per un'altra persona passano da pg_cron + Edge Function + Expo Push.

## Setup

```bash
pnpm install
npx supabase start          # Supabase locale (richiede Docker)
pnpm --filter mobile start  # avvia Expo
```

Variabili in `apps/mobile/.env`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
