# TrimSalon - Backlog

> ℹ️ **Let op (2025-12-24):** De focus is verschoven naar **Firebase Genkit (GenAI)** en **SEO/Analytics**. Items die daar niet aan bijdragen staan onder **Archief / parkeren**.

## ✅ Fase 1: Critical Fixes (DONE)

- [x] Fix alle `*ngIf` → `@if` compiler errors (6 templates)
- [x] Fix root redirect van /signin naar /appointments
- [x] Implementeer `afterValidityEnsured` in 4 forms
- [x] Fix FormBase bugs (isSaving logic, beforeunload async issue)
- [x] Fix template buttons save() → submit()
- [x] Fix expenses (onClick) → (click)
- [x] Fix breadcrumb home link → /appointments

---

## ✅ Fase 2: Forms Perfectie (DONE)

### 2.1 Invoice Form Refactor ✅

- [x] Refactor InvoiceFormComponent om FormBaseComponent te extenden
- [x] Typed FormGroup toevoegen
- [x] Consistentie met andere forms
- [x] takeUntilDestroyed voor subscriptions

### 2.2 Expense Form Refactor ✅

- [x] Refactor met proper typed forms
- [x] Remove duplicate injects (route, router)
- [x] Consistentie met andere forms

### 2.3 FormBaseComponent Improvements ✅

- [x] Router toegevoegd aan base class
- [x] Alle forms gebruiken nu base class router en activatedRoute
- [x] Removed duplicate injects uit 4 form components

### 2.4 Validatie Messages

- [x] Herbruikbare ValidationMessageComponent gemaakt
- [x] Toevoegen aan forms:
  - [x] appointment-form (N/A - uses custom inline feedback)
  - [x] client-form ✅
  - [x] service-form (N/A - uses custom inline feedback)
  - [x] package-form (N/A - uses custom inline feedback)
  - [x] expense-form ✅
  - [x] invoice-form ✅

### 2.5 Subscription Cleanup ✅

- [x] Invoice-form: takeUntilDestroyed()
- [x] appointment-form: takeUntilDestroyed()
- [x] client-form: takeUntilDestroyed()
- [x] service-form: takeUntilDestroyed()
- [x] package-form: takeUntilDestroyed()

### 2.6 Button Styling Consistency

- [ ] Alle desktop tables: gebruik property binding `[text]="true"` ipv styleClass
- [ ] Consistent tooltips: gebruik `pTooltip="..."` (geen property binding)

---

## ✅ Fase 3: Navigation & Layout (DONE)

### 3.1 Desktop Layout ✅

- [x] Fix top-nav: nu full-width met left: 0 (boven sub-nav)
- [x] Sub-nav start nu onder top-nav (top: 70px)
- [x] Breadcrumb krijgt padding-top voor space onder top-nav

### 3.2 Z-Index Cleanup ✅

- [x] Z-index hierarchy gefixed:
  - top-nav: 1100 (highest)
  - sub-nav: 1050 (below top-nav)
  - paginator: 900 (below sub-nav)
  - sticky-footer: 900 (same as paginator)
- [x] Geen overlap issues meer

### 3.3 Wallet Route Cleanup ✅

- [x] Lege wallet folder bestaat niet meer
- [x] Sub-nav expenses icon correct (/expenses)

---

## ✅ Fase 4: Mobile Polish (DONE)

### 4.1 Dialog Fullscreen ✅

- [x] CSS fix voor maximized dialogs
- [x] AppDialogService handles mobile (fullscreen, maximize)
- [x] CompleteAppointmentDialog has mobile classes

### 4.2 Touch/UX ✅

- [x] AppDialogService configuratie voor mobile
- [x] safe-area-inset-bottom handling in global styles

### 4.3 Form Mobile UX ✅

- [x] Sticky footer actions - handled by form-base and CSS
- [x] Forms have responsive styling

---

## 🔧 Fase 5: Subscription Cleanup (PRIORITY: MEDIUM)

### 5.1 Email Configuration

- [ ] Firebase Remote Config of Environment variables:
  - EMAIL_HOST
  - EMAIL_PORT
  - EMAIL_USER
  - EMAIL_PASS
- [ ] Of: SendGrid/Mailgun integratie overwegen

### 5.2 Appointment Reminders

- [ ] Cloud Function: `sendAppointmentReminderEmail` (bestaat al)
- [ ] Trigger configureren:
  - [ ] Optie A: Scheduled function (bijv. dag voor afspraak)
  - [ ] Optie B: Firestore trigger bij nieuwe afspraak
- [ ] Email template verfijnen

### 5.3 Invoice Email

- [ ] Nieuwe Cloud Function: `sendInvoiceEmail`
- [ ] PDF generatie en bijvoegen
- [ ] Template met factuurdetails

### 5.4 Frontend Integration

- [ ] Button "Herinnering versturen" bij afspraak
- [ ] Button "Factuur versturen" bij invoice
- [ ] Toast feedback na versturen

---

## 🧪 Fase 6: Testing (PRIORITY: MEDIUM)

### 6.1 Unit Tests Fixen ✅

- [x] Bestaande tests updaten na refactors
- [x] 87/87 tests passing
- [x] DialogService mocks toegevoegd
- [x] ActivatedRoute mocks verbeterd
- [ ] Coverage verhogen voor forms
- [ ] Coverage verhogen voor services

### 6.2 E2E Tests

- [ ] Playwright/Cypress setup
- [ ] Kritieke user flows:
  - [ ] Login flow
  - [ ] Appointment CRUD
  - [ ] Client CRUD

---

## 🚀 Fase 7: Performance & Bundle Size (DONE)

### 7.1 Bundle Optimization ✅

- [x] Lazy loading voor reports module (461 KB naar lazy chunk)
- [x] Lazy loading voor expenses module (9 KB + 5 KB form)
- [x] Lazy loading voor invoices module (13 KB + 8 KB form)
- [x] Initial bundle: 2.88 MB → 2.38 MB (**500 KB besparing!**)
- [ ] Nog steeds boven budget (1.80 MB) - overwegen om PrimeNG te optimaliseren

### 7.2 CommonJS Dependencies

- [ ] canvg dependencies zijn CommonJS - alternatief zoeken?

---

## 📝 Technische Schuld

- [ ] `any` types vervangen door specifieke types
- [ ] Unused imports/variables opruimen
- [x] Console.log statements conditioneel gemaakt (alleen in dev mode via isDevMode())
- [ ] Error handling verbeteren (global error handler)

---

## 🔐 Security Review

- [x] Firebase security rules gecreëerd (firestore.rules, storage.rules)
- [x] Geen XSS kwetsbaarheden gevonden (geen innerHTML gebruik)
- [ ] Input sanitization checken
- [ ] CORS configuratie verifiëren

---

## ⭐ Focus (nu): GenAI (Genkit) + SEO/Analytics

### GenAI (Firebase Genkit)

- [ ] Genkit integratie in `functions/` (1 simpele flow, server-side)
- [ ] Feature flag / settings toggle voor GenAI features
- [ ] Input/PII minimalisatie + rate limiting / abuse prevention

### SEO (Angular)

- [x] Indexering geblokkeerd (noindex meta + robots.txt) voor WIP publicatie
- [ ] Route-level titles + meta descriptions (publieke routes)
- [ ] Robots/sitemap strategie bepalen (publiek vs achter login)
- [ ] Overweeg prerender/SSR alleen als er publieke landing pages zijn

### Analytics (privacyvriendelijk)

- [ ] Meetplan: welke events/metrics zijn echt nuttig
- [ ] Implementatiekeuze: cookieless/no-identifiers (liefst zonder banner)
- [ ] Privacy policy/verklaring aanvullen met analytics uitleg

---

## 🗄️ Archief / parkeren (niet actief)

- Verbeterplan Google Calendar sync / two-way sync
- Tablet mode & time logging
- KPI dashboarding (€60/u target)

---

_Laatst bijgewerkt: 2025-01-29_
