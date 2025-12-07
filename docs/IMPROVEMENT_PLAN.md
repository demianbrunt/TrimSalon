# Verbeterplan TrimSalon App

Dit document beschrijft het technische plan om de TrimSalon applicatie te professionaliseren, robuuster te maken en datagedreven werken mogelijk te maken.

## Fase 1: Google Calendar Sync Optimalisatie (Robuustheid & Presentatie)

**Doel:** De huidige sync betrouwbaar maken en professioneel presenteren.

### Stap 1.1: Slimmere `appointmentToCalendarEvent` Mapping

- **Technisch:** Aanpassing van `functions/src/calendar.ts`.
- **Kleur:** Implementatie van een standaard `BRAND_COLOR_ID` (bijv. 'Peacock' of 'Grape' uit de Google kleurenset) in plaats van hardcoded waarden. Optioneel onderscheid maken op basis van status (bijv. Grijs voor 'CANCELLED').
- **Deep Link:** Toevoegen van een directe URL in het `description` veld: `\n\nOpen in App: https://trimsalon-app.web.app/appointments/${appointmentId}`. Dit maakt "1-click" navigatie mogelijk.
- **Locatie:** Het `location` veld vullen met het adres van de salon.

### Stap 1.2: Foutafhandeling & Token Management

- **Technisch:** Verbetering van `try-catch` blokken in de Cloud Function.
- **Implementatie:**
  - **Auth Errors (401):** Schrijf status `{ googleSyncStatus: 'NEEDS_REAUTH' }` naar het user document in Firestore. Frontend toont waarschuwing.
  - **Rate Limits (429):** Specifieke error gooien zodat Cloud Functions de taak automatisch opnieuw probeert (retry policy).

### Stap 1.3: Idempotentie (Voorkomen van dubbele updates)

- **Technisch:** Firestore triggers kunnen soms meerdere keren afgaan.
- **Implementatie:** Vergelijk `change.before.data()` met `change.after.data()`. Als alleen irrelevante velden zijn gewijzigd, breek de functie af om onnodige API calls te voorkomen.

---

## Fase 2: Two-Way Sync (De "Heilige Graal")

**Doel:** Wijzigingen in Google Agenda (tijd/datum) terugschieten naar de TrimSalon app.

### Stap 2.1: Webhook Setup (Google Channel)

- **Technisch:** Nieuw Cloud Function endpoint: `api/calendar-webhook`.
- **Actie:** Aanroepen van `calendar.events.watch` API.
- **Onderhoud:** Implementatie van een _Scheduled Function_ (Cronjob) om de "watch" periodiek te vernieuwen (verloopt na +/- 1 week).

### Stap 2.2: Delta Sync Verwerking

- **Technisch:** Webhook ontvangt alleen een signaal, geen data.
- **Implementatie:**
  1.  Webhook ontvangt signaal.
  2.  Ophalen `syncToken` uit database.
  3.  Aanroepen `calendar.events.list` met `syncToken` voor alleen gewijzigde events.
  4.  Itereren door events en Firestore updaten op basis van `extendedProperties.private.appointmentId`.

### Stap 2.3: Loop Prevention

- **Risico:** Oneindige update loop tussen App en Google.
- **Oplossing:** Bij update vanuit webhook, zet flag `source: 'google-sync'`. De uitgaande Cloud Function negeert updates met deze bron.

---

## Fase 3: Tablet Mode & Time Logging

**Doel:** Real-time data verzamelen op de werkvloer voor nauwkeurige analyses.

### Stap 3.1: Tablet UI Component

- **Technisch:** Nieuwe Angular route `/tablet-mode`.
- **Design:** Minimalistische interface, grote touch-knoppen, geen complexe navigatie.
- **State:** `BehaviorSubject` in een Service voor "Huidige Actieve Taak".

### Stap 3.2: Datastructuur voor Tijdregistratie

- **Model Wijziging:** Uitbreiding `Appointment` model:
  ```typescript
  timeLogs: {
      activity: 'WASHING' | 'DRYING' | 'CUTTING' | 'OTHER';
      startTime: Timestamp;
      endTime?: Timestamp;
      durationMinutes?: number;
  }[]
  ```
- **Logica:** Starten van nieuwe taak sluit automatisch de vorige taak af.

---

## Fase 4: Dashboarding & KPI's (€60/u Target)

**Doel:** Data omzetten in stuurinformatie.

### Stap 4.1: De "Echte" Uurloon Berekening

- **Technisch:** Cloud Function of Frontend berekening.
- **Formule:** `(Totale Omzet - Totale Uitgaven) / Totaal Gewerkte Uren (uit timeLogs)`.

### Stap 4.2: Visuele Feedback

- **Component:** Dashboard widget (Gauge/Meter).
- **Logica:**
  - < €50: Rood
  - €50 - €60: Oranje
  - > €60: Groen

---

## Advies Volgorde

1.  **Fase 1:** Directe waarde, professionelere uitstraling, minder fouten.
2.  **Fase 3:** Essentieel voor data-verzameling (zonder data geen dashboard).
3.  **Fase 4:** Inzichtelijk maken van de verzamelde data.
4.  **Fase 2:** Technisch complex, implementeren indien workflow dit vereist.

---

## Integratie & Design Guidelines (Zonder "Vermageling")

Om te zorgen dat de nieuwe functionaliteiten naadloos aansluiten bij de huidige app en de gebruikerservaring niet verstoren, hanteren we de volgende regels:

### 1. Design System & Kleuren (PrimeNG)

We wijken niet af van het bestaande thema. Alle nieuwe UI-elementen moeten gebruikmaken van de PrimeNG variabelen:

- **Primaire Kleur:** Gebruik `var(--primary-color)` voor hoofdacties en belangrijke accenten.
- **Achtergronden:** Gebruik `var(--surface-ground)`, `var(--surface-card)`, etc. voor consistentie.
- **Google Calendar Kleuren:** We mappen de Google kleuren naar onze eigen palette.
  - _Google 'Sage' (Groen)_ -> `var(--green-500)` (Succes/Bevestigd)
  - _Google 'Graphite' (Grijs)_ -> `var(--gray-500)` (Concept/Geannuleerd)
  - _Google 'Tomato' (Rood)_ -> `var(--red-500)` (Urgent/Fout)
  - _Standaard:_ `var(--primary-color)` (zodat het altijd matcht met de app).

### 2. Componenten Gebruik

We vinden het wiel niet opnieuw uit. Voor elke nieuwe feature gebruiken we bestaande PrimeNG componenten:

- **Tablet Mode:** Gebruik `p-button` met `size="large"` en `severity="info/success/warning"` voor de grote touch-knoppen.
- **Dashboard:** Gebruik `p-chart` voor grafieken en `p-meterGroup` of `p-knob` voor de KPI meters.
- **Layout:** Blijf `PrimeFlex` classes gebruiken (`flex`, `grid`, `p-3`, etc.) voor responsive design.

### 3. Veilige Integratie (Non-Destructive)

- **Tablet Mode:** Dit wordt een volledig losstaande route (`/tablet`). Hierdoor verandert er **niets** aan de bestaande desktop/mobiele weergave die jullie nu gewend zijn.
- **Sync Updates:** De aanpassingen in de Cloud Functions zijn "backend-only". De frontend merkt hier niets van, behalve dat de data in de agenda er netter uitziet.
- **Feature Flags:** Voor grote wijzigingen (zoals 2-way sync) bouwen we een "schakelaar" in de instellingen, zodat je het uit kunt zetten als het niet bevalt.
