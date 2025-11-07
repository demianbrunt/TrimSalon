# TrimSalon - Product Roadmap & Feature Plan

> **Laatst bijgewerkt:** 7 november 2025  
> **Status:** In ontwikkeling  
> **Versie:** 1.0.0  
> **Platform:** Firebase (Hosting, Firestore, Functions, Authentication)  
> **Focus:** Backoffice applicatie → Later uitbreiden met publieke voorkant

---

## 📋 Inhoudsopgave

1. [Product Visie](#-product-visie)
2. [Huidige Functionaliteit](#-huidige-functionaliteit-geïmplementeerd)
3. [In Ontwikkeling](#-in-ontwikkeling)
4. [Geplande Features - Backoffice](#-geplande-features---backoffice)
5. [Toekomstige Publieke Voorkant](#-toekomstige-publieke-voorkant)
6. [Firebase Infrastructuur](#-firebase-infrastructuur)
7. [UX/UI Verbeteringen](#-uxui-verbeteringen)

---

## 🎯 Product Visie

### Fase 1: Backoffice (Huidige Focus)

Een complete backoffice applicatie voor trimsalon beheer met:

- Klanten- en afsprakenbeheer
- Werkzaamheden en pakketten configuratie
- Financieel overzicht en rapportages
- Planning en agenda beheer

### Fase 2: Publieke Voorkant (Toekomst)

Een klantgerichte website waar bezoekers:

- Online afspraken kunnen maken
- Diensten en prijzen kunnen bekijken
- Contact kunnen opnemen
- Reviews kunnen lezen

→ _SEO, performance optimalisatie en publieke marketing komen in Fase 2_

---

## ✅ Huidige Functionaliteit (Geïmplementeerd)

### 🔐 Authenticatie & Beveiliging

- [x] Google Sign-In integratie
- [x] Auth Guard voor beveiligde routes
- [x] Sign out functionaliteit
- [x] Forbidden (403) pagina
- [x] Not Found (404) pagina

### 👥 Klantenbeheer

- [x] Klanten overzicht met zoek/filter
- [x] Klant toevoegen
- [x] Klant bewerken
- [x] Klant verwijderen (soft delete)
- [x] Meerdere honden per klant
- [x] Hond toevoegen aan klant
- [x] Hond verwijderen
- [x] Ras selectie met breed/size informatie
- [x] Email & telefoon validatie
- [x] Responsive design (mobile/desktop)

### 🐕 Hondenbeheer

- [x] Honden gekoppeld aan klanten
- [x] Ras database met grootte categorie (small/medium/large)
- [x] Meerdere honden per klant mogelijk
- [x] Hondengrootte beïnvloedt tijdsinschatting

### 🛠️ Werkzaamheden (Services)

- [x] Services overzicht
- [x] Service toevoegen
- [x] Service bewerken
- [x] Service verwijderen (soft delete)
- [x] Twee pricing modellen:
  - [x] Vaste prijs (fixed price)
  - [x] Tijd gebaseerd (time-based)
- [x] Prijzen per hondengrootte/ras
- [x] Historische prijzen met datum ranges

### 📦 Pakketten

- [x] Pakketten overzicht
- [x] Pakket toevoegen
- [x] Pakket bewerken
- [x] Pakket verwijderen (soft delete)
- [x] Multiple services per pakket
- [x] Pricing per pakket
- [x] Historische prijzen

### 📅 Afspraken Beheer

- [x] **NIEUW!** Volledig vernieuwde afspraak form met:
  - [x] Intelligente tijdsduur berekening op basis van:
    - [x] Hondengrootte (klein: 30min, middel: 45min, groot: 60min)
    - [x] Geselecteerde pakketten (+15min per service)
    - [x] Extra services (+15min per service)
  - [x] Aparte datum en tijd selectie
  - [x] Automatische eindtijd berekening
  - [x] Real-time geschatte duur indicator
  - [x] Visuele feedback en helpers
  - [x] Stapsgewijze opbouw met secties
  - [x] Labels boven velden (geen float labels meer)
- [x] Afspraken overzicht
- [x] Afspraak aanmaken
- [x] Afspraak bewerken
- [x] Afspraak verwijderen
- [x] Klant & hond selectie
- [x] Multiple services en packages per afspraak
- [x] Notities veld
- [x] Tijd registratie (start/eind tijd)
- [x] Display van services en packages in overzicht

### 🎨 UI/UX

- [x] PrimeNG component library
- [x] PrimeFlex voor responsive layout
- [x] Dark/Light theme support
- [x] Mobile-first responsive design
- [x] Breadcrumb navigatie
- [x] Toast notificaties (success/error)
- [x] Form validatie met visuele feedback
- [x] Can-deactivate guard (unsaved changes warning)
- [x] Consistent form styling
- [x] Icon set (PrimeIcons)

### 🏗️ Architectuur & Firebase

- [x] Angular 20.1.0 (standalone components)
- [x] TypeScript strict mode
- [x] Base components voor herbruikbaarheid
- [x] Service layer architectuur
- [x] Reactive Forms
- [x] RxJS voor data streaming
- [x] ESLint + Prettier configuratie
- [x] Husky pre-commit hooks
- [x] **Firebase Hosting** - Deployed applicatie
- [x] **Firebase Firestore** - Database met real-time sync
- [x] **Firebase Authentication** - Google Sign-In
- [x] **Firebase Functions** - Backend logic (calendar integratie)

---

## 🔄 In Ontwikkeling

### 📊 Rapportages Module

- [ ] Basis rapportage pagina opzet
- [ ] Omzet overzicht per periode
- [ ] Top klanten (meest bezocht)
- [ ] Populairste services
- [ ] Bezettingsgraad kalender
- [ ] Export naar PDF/Excel

### 💰 Financieel Beheer

- [ ] Factuur generatie
- [ ] Betaalstatus tracking
- [ ] Omzet dashboard
- [ ] Kostprijs berekening

---

## 🎯 Geplande Features - Backoffice

### Prioriteit: Hoog 🔴

#### 🎙️ Grooming History & Voice Notes (PRIORITEIT #1)

**Doel: Profiel per hond opbouwen met spraakgestuurde notities**

- [ ] **Grooming History Module**
  - [ ] Trimbeurt backlog per hond
  - [ ] Tijdregistratie per sessie (werkelijke vs geschatte tijd)
  - [ ] Notities per trimbeurt
  - [ ] Bijzonderheden/gedrag van de hond
  - [ ] Gebruikte producten/technieken
  - [ ] Voor/na foto's koppelen
- [ ] **Spraakgestuurd Invoeren (Web Speech API)**
  - [ ] Voice-to-text voor notities (dyslexie-vriendelijk)
  - [ ] Microfoon knop in formulier
  - [ ] Real-time transcriptie
  - [ ] Bewerkbare tekst na spraak
  - [ ] Browser compatibiliteit check
  - [ ] Fallback naar handmatig typen

- [ ] **Intelligente Tijdschatting v2.0**
  - [ ] Learning algorithm op basis van history
  - [ ] Gemiddelde tijd per hond berekenen
  - [ ] Trends herkennen (bv. langer naarmate seizoen)
  - [ ] Betere schatting bij afspraak maken
  - [ ] Dashboard met accuracy metrics

- [ ] **Hond Profiel Dashboard**
  - [ ] Volledige geschiedenis overzicht
  - [ ] Laatste 5 trimbeurten samenvatting
  - [ ] Gedragspatronen visualiseren
  - [ ] Voorkeuren en allergieën prominent
  - [ ] Timeline view van alle sessies

#### 📅 Agenda/Kalender Module

- [ ] Kalender weergave (dag/week/maand)
- [ ] Drag & drop afspraken
- [ ] Kleurcodering per service type
- [ ] Dubbele boekingen preventie
- [ ] Beschikbaarheid/werkuren instellen
- [ ] Google Calendar sync (via Firebase Functions)
- [ ] Print agenda voor de dag
- [ ] Tijdslot configuratie

#### � Financieel & Facturatie

- [ ] Factuur generatie (PDF)
- [ ] Betaalstatus tracking
- [ ] Omzet dashboard
- [ ] Openstaande bedragen overzicht
- [ ] Betaalgeschiedenis per klant
- [ ] Expense tracking (kosten)
- [ ] BTW berekening

#### 📊 Rapportages & Analytics

- [ ] Omzet overzicht per periode
- [ ] Top klanten (meest bezocht)
- [ ] Populairste services
- [ ] Bezettingsgraad analyse
- [ ] No-show statistieken
- [ ] Gemiddelde transactiewaarde
- [ ] Export naar Excel/PDF
- [ ] Grafische dashboards
- [ ] **Tijdschatting accuracy tracking**
- [ ] **Gemiddelde grooming tijd per hondenras**

#### 🔔 Notificaties Systeem

**Let op: Focus eerst op backoffice, klantnotificaties komen later**

- [ ] **Interne notificaties** (voor personeel)
  - [ ] Dashboard met nieuwe afspraken
  - [ ] Reminder voor vandaag's afspraken
  - [ ] Meldingen bij wijzigingen
- [ ] **Klant notificaties** (LAGE PRIORITEIT - Fase 2)
  - [ ] Email herinneringen voor klanten
  - [ ] Bevestigings emails na boeking
  - [ ] Dag voor afspraak reminder
  - [ ] Email templates beheer

### Prioriteit: Middel 🟡

#### � Media Beheer

- [ ] Foto's uploaden per hond (Firebase Storage)
- [ ] Voor/na foto's galerij
- [ ] Vaccinatie documenten upload
- [ ] Media galerij per klant
- [ ] Automatische foto compressie
- [ ] Thumbnail generatie

#### 👨‍� Personeel & Planning

- [ ] Medewerkers toevoegen
- [ ] Agenda per medewerker
- [ ] Beschikbaarheid instellen
- [ ] Werkuren registratie
- [ ] Commissie berekening
- [ ] Prestatie overzicht

#### 🎁 Marketing & Promoties

- [ ] Kortingscodes systeem
- [ ] Verjaardagsacties automatisch
- [ ] Email marketing templates
- [ ] Klant segmentatie
- [ ] Loyaliteitsprogramma basis

#### � Zoeken & Filteren

- [ ] Full-text search in Firestore
- [ ] Geavanceerde filters per module
- [ ] Opgeslagen zoekacties
- [ ] Bulk acties (meerdere items tegelijk)
- [ ] Snelle klant lookup

### Prioriteit: Laag 🟢

#### 📝 Templates & Standaardisatie

- [ ] Email templates library
- [ ] Factuur templates
- [ ] Notitie templates
- [ ] Standaard packages configuratie
- [ ] Automatische teksten

#### � Voorraad Beheer (Optioneel)

- [ ] Producten inventaris
- [ ] Shampoos, tools tracking
- [ ] Voorraad waarschuwingen
- [ ] Inkoop registratie
- [ ] Kosten toewijzing aan afspraken

#### 📱 Mobile Optimalisatie

- [ ] Touch gestures verbeteren
- [ ] Swipe acties voor snelle edits
- [ ] Offline mode (met sync)
- [ ] Bottom navigation voor mobile
- [ ] Pull to refresh

---

## 🌐 Toekomstige Publieke Voorkant

> **Fase 2** - Deze features komen later, na de backoffice is afgerond

### Klantgerichte Website

#### 🌟 Basis Publieke Site

- [ ] Homepage met bedrijfsinfo
- [ ] Diensten overzicht pagina
- [ ] Prijslijst (dynamisch uit Firestore)
- [ ] Over ons / Team pagina
- [ ] Contact pagina
- [ ] Portfolio / Voor & Na foto's
- [ ] Klanten reviews / Testimonials
- [ ] Google Maps integratie

#### 📅 Online Booking Systeem

- [ ] Publieke afspraak maken flow
- [ ] Beschikbare tijdslots tonen
- [ ] Klant account aanmaken
- [ ] Hond registratie bij eerste boeking
- [ ] Booking bevestiging email
- [ ] Kalender integratie
- [ ] Annulering/wijziging door klant

#### 👤 Klanten Portal

- [ ] Eigen login voor klanten
- [ ] Afspraken geschiedenis inzien
- [ ] Komende afspraken beheren
- [ ] Profiel & honden beheren
- [ ] Facturen downloaden
- [ ] Loyaliteitspunten inzien

#### 🚀 SEO & Marketing

- [ ] SEO optimalisatie (meta tags, schema.org)
- [ ] Google Analytics
- [ ] Google My Business integratie
- [ ] Facebook Pixel
- [ ] Social media sharing
- [ ] Blog/nieuws sectie
- [ ] Newsletter inschrijving

#### ⚡ Performance & UX

- [ ] Lazy loading images
- [ ] Service Worker voor offline
- [ ] Progressive Web App (PWA)
- [ ] Lighthouse score 90+
- [ ] Core Web Vitals optimalisatie
- [ ] Bundle size optimalisatie

---

## 🔥 Firebase Infrastructuur

### Huidige Setup ✅

- [x] Firebase Hosting - Deployed op Firebase
- [x] Firestore Database - Real-time data sync
- [x] Firebase Authentication - Google Sign-In
- [x] Firebase Functions - Calendar API integratie
- [x] Security Rules - Database toegangscontrole

### Geplande Firebase Features

#### 🔐 Security & Compliance

- [ ] Firestore Security Rules uitbreiden
- [ ] Firebase App Check (bot protection)
- [ ] GDPR compliance implementatie
- [ ] Data export functionaliteit
- [ ] Backup strategie (Firestore export)
- [ ] Rate limiting via Functions

#### 📧 Firebase Extensions

- [ ] **Trigger Email** - Automatische emails
- [ ] **Resize Images** - Foto optimalisatie
- [ ] **Delete User Data** - GDPR compliance
- [ ] **Export Collections to BigQuery** - Analytics
- [ ] **Firestore Counter** - Performance tellers

#### 🛠️ Firebase Functions Uitbreiden

- [ ] Scheduled functions (cron jobs)
  - [ ] Dagelijkse reminder emails
  - [ ] Maandelijkse rapporten
  - [ ] Cleanup oude data
- [ ] HTTP endpoints voor:
  - [ ] Factuur generatie (PDF)
  - [ ] Email versturen
  - [ ] External API integraties
- [ ] Firestore triggers:
  - [ ] Auto-notify bij nieuwe afspraak
  - [ ] Status updates syncen
  - [ ] Audit logging

#### 📊 Firebase Analytics & Monitoring

- [ ] Firebase Analytics setup
- [ ] Custom events tracking
- [ ] User engagement metrics
- [ ] Crashlytics (error reporting)
- [ ] Performance Monitoring
- [ ] Remote Config voor feature flags

#### 💾 Storage & Backup

- [ ] Firebase Storage voor media
- [ ] Automated Firestore backups
- [ ] Cloud Storage lifecycle policies
- [ ] Image thumbnails generatie
- [ ] Document versioning

---

## 🎨 UX/UI Verbeteringen

### Design & Branding

- [ ] Custom branding opties (logo, kleuren)
- [ ] Consistent component styling guide
- [ ] Design tokens voor theming
- [ ] Animation library (smooth transitions)
- [ ] Icon set uitbreiden waar nodig

### Backoffice User Experience

- [ ] Onboarding flow voor nieuwe gebruikers
- [ ] Keyboard shortcuts voor power users
- [ ] Undo/Redo functionaliteit
- [ ] Drag & drop file uploads
- [ ] Print-friendly views (agenda, facturen)
- [ ] Export data functionaliteit
- [ ] Quick actions menu
- [ ] Inline editing waar mogelijk

### Accessibility (Basis)

- [ ] Keyboard navigatie verbeteren
- [ ] Focus indicators duidelijk maken
- [ ] Alt teksten voor images
- [ ] Error messages duidelijk communiceren

### Mobile Experience (Backoffice)

- [ ] Responsive tables optimaliseren
- [ ] Touch-friendly buttons
- [ ] Simplified mobile navigation
- [ ] Mobile-specific forms

---

## � Innovatieve Ideeën (Lange Termijn)

### AI & Automatisering

- [ ] **AI Scheduling Assistant**: Optimale planning suggesties
- [ ] **Smart Pricing**: Dynamische prijzen op basis van drukte
- [ ] **Churn Prediction**: Klanten die mogelijk niet terugkomen
- [ ] **Automated Follow-ups**: Tevredenheidsonderzoek na afspraak
- [ ] **Demand Forecasting**: Voorspellen drukke periodes

### Uitbreidingen

- [ ] **Multi-location Support**: Meerdere vestigingen beheren
- [ ] **Franchise Mode**: Voor keten van trimsalons
- [ ] **Wachtlijst Management**: Automatisch invullen bij annulering
- [ ] **QR Code Check-in**: Contactloos inchecken
- [ ] **WhatsApp integratie**: Berichten versturen

### Externe Integraties

- [ ] Exact Online / QuickBooks (boekhouding)
- [ ] Mailchimp (nieuwsbrieven)
- [ ] Instagram (social media posts)
- [ ] Google My Business (reviews sync)

---

## 🗓️ Release Planning

### Version 1.1 (Q1 2026) - Kalender & Planning

**Focus: Professionele agenda voor dagelijkse gebruik**

- ✅ Kalender weergave (dag/week/maand)
- ✅ Drag & drop afspraken
- ✅ Google Calendar sync
- ✅ Dubbele boekingen preventie
- ✅ Print functionaliteit

### Version 1.2 (Q2 2026) - Financieel & Rapportages

**Focus: Inzicht in bedrijfsresultaten**

- ✅ Factuur generatie
- ✅ Betaalstatus tracking
- ✅ Omzet dashboards
- ✅ Export functionaliteit
- ✅ Rapportages per periode

### Version 1.3 (Q3 2026) - Media & Communicatie

**Focus: Klantcommunicatie en portfolio**

- ✅ Foto upload systeem
- ✅ Email notificaties
- ✅ Templates beheer
- ✅ Voor/na foto galerij

### Version 1.4 (Q4 2026) - Personeel & Optimalisatie

**Focus: Team management en efficiency**

- ✅ Medewerkers module
- ✅ Werkuren registratie
- ✅ Commissie berekening
- ✅ Performance optimalisaties

### Version 2.0 (2027) - Publieke Voorkant

**Focus: Online booking en klantportaal**

- 🌐 Publieke website lancering
- 📅 Online afspraak maken
- 👤 Klanten portal
- 🚀 SEO & marketing setup
- ⚡ Performance optimalisatie

---

## 📝 Notities & Beslissingen

### Architectuur Keuzes

1. **Firebase als Platform**: Schaalbaar, managed, geen server onderhoud
   - Firestore voor real-time data
   - Cloud Functions voor backend logic
   - Storage voor media files
   - Hosting voor deployment

2. **Backoffice First Approach**: Focus op interne tools
   - Klantportaal komt later (v2.0)
   - SEO en marketing in fase 2
   - Performance optimalisatie pas bij publieke site

3. **No Testing Strategy**: Focus op snelle ontwikkeling
   - Handmatige QA
   - Real-world usage als test
   - Bug fixing on-the-fly

### Design Beslissingen

1. **Tijdsduur Berekening**: Eenvoudige formule op basis van hondengrootte
   - Kleine hond: 30min basis
   - Middelgrote hond: 45min basis
   - Grote hond: 60min basis
   - +15min per extra service
   - Later: ML model voor nauwkeurigere voorspellingen

2. **Labels boven velden**: Geen float labels meer
   - Beter voor UX en consistentie
   - Werkt beter met placeholders
   - Toegankelijker

3. **Mobile-First Design**: PrimeFlex responsive grid
   - Werkt op phone, tablet, desktop
   - Touch-friendly controls
   - Adaptive layouts

### Firebase Limieten (Gratis Tier)

- ⚠️ Firestore: 50K reads, 20K writes per dag
- ⚠️ Functions: 125K invocations per maand
- ⚠️ Storage: 5GB opslag
- ⚠️ Hosting: 10GB bandwidth per maand

→ Bij groei upgrade naar **Blaze Plan** (pay-as-you-go)

---

## 🤝 Feature Request Process

Nieuwe features toevoegen:

1. ✅ Check of het past bij huidige fase (backoffice vs publiek)
2. ✅ Bepaal prioriteit (🔴 Hoog / 🟡 Middel / 🟢 Laag)
3. ✅ Voeg toe aan roadmap in juiste sectie
4. ✅ Label met versie nummer indien gepland
5. ✅ Update dit document via Git commit

---

**🔥 Gemaakt met Firebase & ❤️ voor TrimSalon**
