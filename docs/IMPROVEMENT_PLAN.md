# Verbeterplan (actief): GenAI + SEO/Analytics

Dit document beschrijft het **huidige** verbeterplan voor TrimSalon.

> ℹ️ **Archief-notitie (2025-12-24):** Het eerdere plan over Google Calendar sync / tablet mode / time logging / KPI dashboarding is voorlopig **niet meer relevant** en is uit dit document verwijderd.

## Doelstellingen

1.  **GenAI toevoegen** via Firebase Genkit (slim, veilig, zonder “AI-spaghetti”).
2.  **SEO verbeteren** (technisch + content hints) zonder de app “stuk te maken”.
3.  **Analytics** toevoegen op een privacyvriendelijke manier, bij voorkeur **zonder cookie-banner**.

## Fase 1: Firebase Genkit (GenAI) integratie

### 1.1 Use-cases (klein beginnen)

- **Tekst-assistent** voor:
  - afspraaknotities samenvatten naar “klantvriendelijke” tekst
  - concept e-mails (herinnering / nazorg / factuur begeleidende tekst)
  - korte management-samenvattingen (weekoverzicht)

### 1.2 Architectuur (aanrader)

- **Server-side only** (Cloud Functions) voor prompts + model calls.
- Frontend praat met een **Callable Function** of HTTPS endpoint.
- Geen model-API keys in de browser.

### 1.3 Data & security afspraken

- **Minimale context**: stuur alleen wat nodig is (geen volledige klantkaart als het niet hoeft).
- **PII/gevoelige data**: expliciet beoordelen per use-case.
- **Rate limiting** / abuse prevention (per user).
- **Audit logging**: log wat er is aangeroepen (zonder onnodige persoonsgegevens).

### 1.4 Configuratie

- Secrets via omgeving/secret manager (geen hardcoded keys).
- Duidelijke toggles per feature (feature flag / settings).

## Fase 2: SEO optimalisatie (Angular)

### 2.1 Technische SEO basis

- **Titles/Meta descriptions** per route.
- **Canonical URLs** waar relevant.
- **Robots** en sitemap strategie (afhankelijk van publiek vs. “app achter login”).

### 2.2 Prerender/SSR (alleen als nodig)

- Als er **publieke landing pages** zijn: overweeg prerender/SSR zodat crawlers de content echt zien.
- Als alles achter login zit: focus vooral op **performance**, **structured data** (indien publiek), en correcte metadata.

## Fase 3: Analytics (privacyvriendelijk)

### 3.1 Meetplan

- Welke events zijn nuttig?
  - login success
  - appointment created/updated
  - invoice created/sent
  - errors (frontend + backend)

### 3.2 Implementatie-keuzes

- **Cookieless / no-identifiers** waar mogelijk.
- Overweeg self-hosted analytics (bijv. Matomo) of puur server-side metrics.

### 3.3 Privacy & consent uitgangspunten

- Geen tracking cookies / local storage identifiers.
- Alleen geaggregeerde statistieken, geen cross-site tracking.
- Transparant in privacyverklaring.

## Definition of Done (voor dit plan)

- GenAI: 1–2 nuttige flows live, veilig en afgeschermd.
- SEO: metadata op publieke routes correct, en meetbare verbetering (indexing/preview).
- Analytics: events zichtbaar in dashboard, met privacy-by-design.
