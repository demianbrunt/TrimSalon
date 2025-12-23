# TrimSalon Agenda/Calendar Weergave en Google Agenda Synchronisatie

## Overzicht

De TrimSalon applicatie heeft nu een uitgebreide agenda/calendar weergave met Google Agenda synchronisatie functionaliteit. Deze gids legt uit hoe je deze features gebruikt.

## Features

### 1. Agenda Weergave Modi

De applicatie biedt nu twee hoofdweergave modi voor afspraken:

#### Lijst Weergave (Bestaand)

- Tabelweergave voor desktop
- Kaart weergave voor mobiel
- Zoek- en filterfunctionaliteit

#### Agenda Weergave (Nieuw)

De agenda weergave biedt vier verschillende views:

- **Dag weergave**: Toont alle afspraken voor één dag
- **Week weergave**: Toont afspraken voor een hele week (standaard)
- **Maand weergave**: Maandelijks overzicht van alle afspraken
- **Lijst weergave**: Lijst van afspraken voor de geselecteerde periode

### 2. Mobiele Optimalisatie

- Op mobiele apparaten wordt automatisch de lijst weergave als standaard gebruikt
- View selector beschikbaar om snel te schakelen tussen dag, week, maand en lijst
- Responsive design past zich aan aan schermgrootte
- Touch-friendly interface voor mobiele interactie

### 3. Kalender Functies

#### Kleuren Coding

- **Blauw**: Geplande afspraken (nog niet afgerond)
- **Groen**: Afgeronde afspraken

#### Interactie

- **Klik op afspraak**: Opent het bewerkingsformulier
- **Klik op datum**: Opent nieuw afspraak formulier met vooraf ingevulde datum

#### Werktijden

- Standaard weergave: 08:00 - 20:00
- Pas aan indien nodig in de component instellingen

### 4. Google Agenda Synchronisatie

#### Instellingen Openen

1. Navigeer naar de Afspraken pagina
2. Schakel naar "Agenda" weergave
3. Klik op "Sync instellingen" knop rechts bovenaan

#### Sync Features

##### Automatische Synchronisatie

- **Auto-sync**: Schakel in om automatische synchronisatie te activeren
- **Sync interval**: Stel interval in (5-60 minuten)
- **Standaard**: 15 minuten

##### Agenda Selectie

- **Werk agenda**: Synchroniseer met je werk Google Agenda (groen gemarkeerd)
- **Privé agenda**: Synchroniseer met je privé Google Agenda (groen gemarkeerd)

##### Sync Acties

- **Nu synchroniseren**: Start handmatige sync
- **Agenda legen**: Verwijdert alle gesynchroniseerde items uit Google Agenda
- **Stop sync**: Stopt automatische synchronisatie

#### Sync Status

De sync status wordt weergegeven in het instellingen dialoog:

- ✅ Groen: Sync actief en succesvol
- ⏳ Draaiend: Bezig met synchroniseren
- ❌ Rood: Sync uitgeschakeld of error

Laatste sync tijd wordt ook getoond.

## Google Authenticatie Setup

### Vereisten

Voor Google Agenda synchronisatie heb je nodig:

1. Google Account
2. Google Cloud Project met Calendar API ingeschakeld
3. OAuth 2.0 credentials (Client ID en Secret)

### Stappen

#### 1. Google Cloud Console Setup

1. Ga naar [Google Cloud Console](https://console.cloud.google.com)
2. Maak een nieuw project of selecteer bestaand project
3. Activeer Google Calendar API:
   - Ga naar "APIs & Services" > "Library"
   - Zoek "Google Calendar API"
   - Klik "Enable"

#### 2. OAuth 2.0 Credentials

1. Ga naar "APIs & Services" > "Credentials"
2. Klik "Create Credentials" > "OAuth client ID"
3. Kies "Web application"
4. Voeg toe:
   - Authorized JavaScript origins: `http://localhost:4200` (dev), je productie URL
   - Authorized redirect URIs: dezelfde origins als hierboven (bijv. `http://localhost:4200`, `https://trimsalon-9b823.web.app`, `https://trimsalon-9b823.firebaseapp.com`)
5. Download credentials

#### 3. Firebase Functions Setup

1. Stel Firebase Functions secrets in:
   ```bash
   firebase functions:secrets:set GOOGLE_CLIENT_ID
   firebase functions:secrets:set GOOGLE_CLIENT_SECRET
   ```
2. Deploy functions:
   ```bash
   firebase deploy --only functions
   ```

#### 4. App Configuratie

1. Update `src/app/app.config.model.ts` met je Google Client ID
2. De scope is al geconfigureerd: `https://www.googleapis.com/auth/calendar`

#### 5. Eerste Keer Authenticatie

1. Klik op "Authoriseer Google Agenda" in sync instellingen
2. Log in met je Google account
3. Geef toestemming voor kalender toegang
4. De app slaat je credentials veilig op in Firestore

## Gebruik

### Dagelijks Gebruik

1. **Afspraken bekijken**:
   - Schakel tussen lijst en agenda weergave
   - Kies je voorkeursweergave (dag/week/maand/lijst)
   - Klik op afspraken om details te zien of te bewerken

2. **Afspraken toevoegen**:
   - Klik op een lege datum/tijd in de agenda
   - Of gebruik de "+ Nieuw" knop
   - Vul afspraak details in en sla op
   - Afspraak wordt automatisch gesynchroniseerd (als ingeschakeld)

3. **Synchronisatie beheren**:
   - Controleer sync status regelmatig
   - Pas interval aan naar je behoefte
   - Gebruik handmatige sync voor directe updates

### Best Practices

#### Synchronisatie

- Gebruik auto-sync voor continue updates
- Stel interval in op basis van je gebruik:
  - Drukke dagen: 5-10 minuten
  - Normale dagen: 15-30 minuten
  - Rustige periodes: 30-60 minuten

#### Privacy

- Kies zorgvuldig welke agenda's te synchroniseren
- Werk en privé agenda's zijn duidelijk gescheiden
- Afspraak details zijn alleen zichtbaar voor geauthoriseerde gebruikers

#### Performance

- Langere intervallen = minder API calls = betere performance
- Gebruik handmatige sync voor urgente updates
- Monitor sync errors in de status display

## Troubleshooting

### Let op bij het testen van callable functions

`exchangeAuthCode` is een **callable** function. Als je deze rechtstreeks aanroept via een gewone HTTP POST op de Cloud Functions URL, krijg je typisch fouten zoals `INVALID_ARGUMENT` / `Invalid request, unable to process.`.

Test daarom altijd via de app (AngularFire `httpsCallable`) of via de emulator UI.

### Sync werkt niet

1. **Controleer authenticatie**:
   - Klik "Authoriseer Google Agenda"
   - Log opnieuw in als nodig
2. **Check credentials**:
   - Verifieer Firebase Functions secrets zijn correct ingesteld
   - Controleer OAuth consent screen configuratie

3. **API Quota**:
   - Google Calendar API heeft rate limits
   - Verhoog interval bij quota errors

### Afspraken verschijnen niet

1. **Check sync status**:
   - Open sync instellingen
   - Bekijk error messages
2. **Handmatige sync**:
   - Klik "Nu synchroniseren"
   - Wacht op bevestiging

3. **Kalender permissions**:
   - Verifieer dat je write permissions hebt
   - Check Google Calendar settings

### Dubbele afspraken

1. **Agenda legen**:
   - Open sync instellingen
   - Klik "Agenda legen"
   - Start nieuwe sync

2. **Sync uitschakelen**:
   - Tijdelijk stop auto-sync
   - Verwijder duplicaten handmatig
   - Herstart sync

## Technische Details

### Architectuur

- **Frontend**: Angular 20+ met FullCalendar
- **Backend**: Firebase Functions met Google Calendar API
- **Auth**: Google OAuth 2.0
- **Storage**: Firestore voor tokens en settings

### Sync Logica

1. Haalt lokale afspraken op uit Firestore
2. Haalt Google Calendar events op
3. Vergelijkt en synchroniseert:
   - Nieuwe afspraken → toevoegen aan Calendar
   - Gewijzigde afspraken → updaten in Calendar
   - Verwijderde afspraken → verwijderen uit Calendar

### Data Model

```typescript
interface Appointment {
  id: string;
  client: Client;
  dog: Dog;
  startTime: Date;
  endTime: Date;
  services: Service[];
  packages: Package[];
  completed: boolean;
  // ... andere velden
}
```

### Beveiliging

- OAuth 2.0 tokens veilig opgeslagen in Firestore
- Tokens automatisch vernieuwd bij expiratie
- User-scoped data (alleen eigen afspraken zichtbaar)

## Support

Voor vragen of problemen:

1. Check deze documentatie
2. Bekijk browser console voor errors
3. Controleer Firebase Functions logs
4. Raadpleeg Google Calendar API documentatie

## Toekomstige Verbeteringen

Mogelijke uitbreidingen:

- [ ] Herinneringen via Google Calendar
- [ ] Meerdere kalenderen ondersteuning
- [ ] Conflict detectie bij dubbele bookings
- [ ] Export naar ICS/iCal format
- [ ] Kleur customization per afspraak type
- [ ] Recurring appointments support
- [ ] Calendar sharing met medewerkers
