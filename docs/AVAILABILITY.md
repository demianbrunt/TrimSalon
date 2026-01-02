# Beschikbaarheid (planning)

## Doel

Beschikbaarheid vastleggen als tijdvakken in de agenda, zodat:

- bezettingsgraad in rapportages realistischer wordt;
- (later) online boeken alleen binnen beschikbare slots kan.

## Data-model voorstel (Firestore)

- `availabilityRules` (recurring):
  - `id`
  - `timezone` (bijv. `Europe/Amsterdam`)
  - `dayOfWeek` (0-6)
  - `startTime` ("HH:mm")
  - `endTime` ("HH:mm")
  - `enabled`
- `availabilityOverrides` (exceptions):
  - `date` (YYYY-MM-DD)
  - `type`: `CLOSED` | `CUSTOM`
  - `slots?`: [{ startTime, endTime }]

## Rapportage

- `weeklyAvailableHoursTarget` blijft als eenvoudige fallback.
- Zodra slots bestaan: bereken beschikbare uren door slots binnen de gekozen periode op te tellen.

## Online boeken (later)

- expose endpoint/Cloud Function om vrije slots te berekenen:
  - input: periode + gewenste dienstduur
  - output: beschikbare starttijden, rekening houdend met bestaande afspraken en overrides.
