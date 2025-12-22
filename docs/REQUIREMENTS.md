# TrimSalon – Requirements (werkversie)

Dit document beschrijft **wat** de TrimSalon applicatie moet doen (product requirements). Het is bedoeld om samen te kunnen aanpassen (“muteren”) voordat we verdere grote uitbreidingen bouwen.

## Doel & scope

### Productdoel

Een eenvoudige, mobiele-first salonapp om:

- afspraken (incl. hond/klant) te plannen en af te handelen;
- omzet/uitgaven te registreren;
- inzicht te geven in prestaties (o.a. uurloon/KPI’s);
- optioneel te synchroniseren met Google Agenda.

### In scope (huidig + doorontwikkeling)

- Auth + sessie
- Afspraken (CRUD, kalender + lijst)
- Klanten & honden
- Diensten & pakketten
- Afspraak afronden (werkelijk uitgevoerd werk, werkelijke eindtijd, **werkelijke prijs**)
- Facturen (basis) en versturen (toekomst)
- Uitgaven
- Rapportages/KPI’s
- Google Calendar sync (1-way stabiel + 2-way optioneel)

### Out of scope (voor nu)

- Online betalingen / kassakoppelingen
- Complex voorraadbeheer
- Multi-user rollenmodel voor personeel (tenzij expliciet gewenst)

## Gebruikers & rollen

### Rollen

- **Eigenaar/Beheerder**: volledige toegang.
- **(Optioneel) Medewerker**: afspraken bekijken/afronden, beperkte administratie.

### Kernpersona’s

- **Trimster**: snel plannen, tijdens werk minimaal klikken, achteraf afronden.
- **Administratie**: factuur/overzicht en controle op omzet/uitgaven.

## Kernbegrippen (domein)

- **Afspraak**: start/eindtijd, klant, hond, (geplande) diensten/pakketten, notities, status.
- **Werkelijke uitvoering**: werkelijk uitgevoerde diensten/pakketten + werkelijke eindtijd.
- **Werkelijke prijs (actualPrice)**: handmatige eindprijs override (bijv. korting, extra werk, afronding).

## Functionele requirements

### 1) Authenticatie

- Gebruiker kan inloggen/uitloggen.
- Niet-ingelogde gebruiker kan geen data zien/wijzigen.
- (Optioneel) sessie-verlenging / token refresh via Firebase.

### 2) Afspraken – aanmaken/bewerken

- Afspraken kunnen worden aangemaakt/bewerkt/verwijderd.
- Afspraak bevat minimaal:
  - starttijd
  - klant
  - hond
  - (geplande) diensten en/of pakketten
- Extra velden:
  - notities
  - geschatte prijs (afgeleid)
  - **werkelijke prijs** (optioneel, override)
- Validaties:
  - verplichte velden tonen foutmelding
  - start/eind logisch (eind na start)

### 3) Afspraken – lijst & kalender

- Lijstweergave met filtering (minimaal datumrange) en snelle acties.
- Kalenderweergave met day/week/month (FullCalendar).
- Vanuit lijst/kalender kan gebruiker naar details/bewerken.

### 4) Afspraak afronden

- Gebruiker kan een afspraak afronden met:
  - werkelijke eindtijd
  - werkelijk uitgevoerde diensten/pakketten
  - notities (optioneel)
  - **werkelijke prijs** (vooraf ingevuld met `actualPrice` als die bestaat, anders met geschatte prijs)
- Na afronden:
  - status is “afgerond”
  - lijstweergave toont werkelijke prijs (indien gezet)
  - rapportages gebruiken werkelijke prijs waar beschikbaar

### 5) Klanten, honden & rassen

- CRUD voor klanten.
- Klant kan 0..n honden hebben.
- Hond heeft minimaal naam + ras (optioneel: grootte/kenmerken).
- Telefoonveld ondersteunt invoerhulp (mask/format) maar blijft als telefoonnummer bruikbaar.

### 6) Diensten & pakketten

- CRUD voor diensten (naam, omschrijving, prijs, duur of prijsmodel indien van toepassing).
- CRUD voor pakketten (bundel van diensten, prijs).
- In afspraak kan gebruiker diensten/pakketten selecteren.

### 7) Uitgaven

- CRUD voor uitgaven (datum, categorie, bedrag, omschrijving).

### 8) Facturen (basis)

- Factuur kan gekoppeld zijn aan afspraak/klant.
- PDF export (optioneel/latere fase) en e-mail versturen (backlog).

### 9) Rapportages & KPI’s

- Basisoverzichten:
  - omzet per periode
  - uitgaven per periode
  - marge/verschil
- KPI’s:
  - omzet per uur (minimaal op basis van (werkelijke) prijs / (werkelijke) duur)
  - target indicator (bijv. €60/u)
- Rekenkundige regels:
  - als `actualPrice` bestaat: gebruik die voor omzetberekeningen;
  - anders gebruik geschatte prijs.

### 10) Google Calendar sync

- Sync kan aan/uit.
- 1-way sync (app → Google) is minimaal betrouwbaar.
- 2-way sync (Google → app) is optioneel en moet loop-prevention hebben.
- Re-auth flow is gebruikersvriendelijk (melding + knop).

## Niet-functionele requirements

### UX

- Mobile-first, snelle bediening met duim.
- Formulieren ogen niet “druk”: progressive disclosure waar zinvol.
- Toetsenbord-navigatie moet werken.

### Toegankelijkheid

- Richtlijn: WCAG 2.2 AA (met toegankelijkheid in het ontwerp), handmatig testen blijft nodig.

### Performance

- Snelle interacties op mobiel.
- Geen onnodige re-renders in formulieren; zware berekeningen beperken.

### Security

- Least privilege Firebase rules.
- Geen secrets in frontend.
- Input validatie/sanitization waar nodig.

### Betrouwbaarheid

- Geen dataverlies bij netwerkproblemen (minimaal duidelijke foutmelding + retry).
- Logging/toasts informatief maar niet spammy.

## Data & opslag (hoog niveau)

Minimaal te ondersteunen entiteiten:

- users (settings o.a. sync)
- appointments (incl. actualPrice, actualEndTime, actualServices, actualPackages)
- clients
- dogs
- breeds
- services
- packages
- expenses
- invoices

## Open vragen (voor volgende iteratie)

- Moeten er meerdere salons/medewerkers ondersteund worden (multi-tenant)?
- Is “werkelijke prijs” altijd inclusief BTW, en is BTW-registratie nodig?
- Hoe wil je omgaan met kortingen/extra werk: als losse regels of alleen via actualPrice?
- Welke rapportages zijn must-have (week/maand/jaar, per klant, per ras, etc.)?

---

Status: **eerste versie**. Pas gerust secties/regels aan; daarna kan ik dit vertalen naar epics/stories en concrete implementatie-taken.
