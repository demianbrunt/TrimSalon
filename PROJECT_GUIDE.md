# 📘 TrimSalon Project Guide

> **Doel van dit document**: Als je 6 maanden niet aan dit project hebt gewerkt, lees dan dit document om snel weer op te starten.

## 🎯 Wat is TrimSalon?

Een **trimsa lon management applicatie** voor het beheren van:

- 👥 **Klanten** en hun honden
- 📅 **Afspraken** voor trim- en verzorgingsdiensten
- 💰 **Prijzen** op basis van hondenras en grootte
- 💵 **Facturen** en betalingen
- 📊 **Rapportages** over omzet en kosten
- 📆 **Google Calendar** integratie

## 🏗️ Technische Stack

### Frontend

- **Angular 20** - Modern web framework
- **PrimeNG** - UI component library
- **RxJS** - Reactive programming
- **TypeScript** - Type-safe JavaScript

### Backend/Database

- **Firebase** - Backend-as-a-Service
  - **Firestore** - NoSQL database
  - **Firebase Auth** - Google Sign-In authenticatie
  - **Firebase Functions** - Serverless functies voor Calendar API
  - **Firebase Hosting** - Productie hosting

### Development Tools

- **Karma + Jasmine** - Testing framework (60+ tests)
- **ESLint + Prettier** - Code quality & formatting
- **Husky** - Pre-commit hooks
- **GitHub Actions** - CI/CD pipeline

## 📁 Project Structuur

```
src/app/
├── core/                      # 🔧 Core functionaliteit
│   ├── components/            # Herbruikbare components
│   │   ├── base/              # BaseComponent - basis voor alle components
│   │   ├── form-base/         # FormBaseComponent - basis voor formulieren
│   │   └── list-base/         # ListBaseComponent - basis voor lijsten
│   ├── services/              # Business logic & API calls
│   │   ├── authentication.service.ts  # 🔐 Login & autorisatie
│   │   ├── base.service.ts            # 📦 CRUD operaties voor Firestore
│   │   ├── pricing.service.ts         # 💰 Prijs berekeningen
│   │   ├── calendar.service.ts        # 📅 Google Calendar integratie
│   │   └── ...                        # Andere services
│   ├── models/                # TypeScript interfaces
│   ├── guards/                # Route guards voor beveiliging
│   └── directives/            # Custom Angular directives
│
├── pages/                     # 📄 Pagina components
│   ├── appointments/          # Afspraken beheer
│   ├── clients/               # Klanten beheer
│   ├── services/              # Diensten beheer
│   ├── packages/              # Pakketten beheer
│   ├── invoices/              # Facturen beheer
│   ├── expenses/              # Kosten beheer
│   ├── reports/               # Rapportages
│   └── signin/                # Login pagina
│
└── test-helpers/              # 🧪 Test utilities
    ├── firebase-mocks.ts      # Mock Firestore/Auth voor tests
    ├── angular-mocks.ts       # Mock Angular services
    └── test-data-factory.ts   # Test data generators

firebase.json                  # Firebase configuratie
karma.conf.js                  # Test configuratie
.github/workflows/             # CI/CD configuratie
```

## 🔑 Belangrijke Concepten

### 1. BaseService Pattern

**Bestand**: `src/app/core/services/base.service.ts`

Alle database services extend `BaseService<T>`:

```typescript
export class ClientService extends BaseService<Client> {
  constructor() {
    super("clients"); // Firestore collection naam
  }
}
```

**Wat doet het**:

- ✅ CRUD operaties: `getData$()`, `getById()`, `add()`, `update()`, `delete()`
- ✅ Automatische Timestamp conversie (Firestore → JS Date)
- ✅ Verwijdert `undefined` fields (Firestore accepteert die niet)
- ✅ Observable-based voor reactive updates

**Gebruik**:

```typescript
// Ophalen
clientService.getData$().subscribe(clients => {...});

// Toevoegen
clientService.add(newClient).subscribe(result => {...});

// Updaten
clientService.update(client).subscribe(result => {...});

// Verwijderen (soft-delete bij clients!)
clientService.delete(id).subscribe(() => {...});
```

### 2. Authenticatie Flow

**Bestand**: `src/app/core/services/authentication.service.ts`

**Flow**:

1. Gebruiker klikt "Inloggen"
2. Google Sign-In popup/redirect
3. Check of email in `allowed-users` Firestore collection
4. Als toegestaan → doorsturen naar app
5. Als niet toegestaan → `/forbidden` pagina

**Belangrijke functies**:

- `signIn()` - Start Google login
- `signOut()` - Logout + clean up
- `isAuthenticated` - Signal voor auth status
- `isAllowed$` - Observable of user toegang heeft

**Session Management**:

- 24 uur inactiviteit → automatisch uitloggen
- Token refresh elke 50 minuten
- Activity tracking (mouse, keyboard, scroll)

**Dev Mode** (LET OP!):

```typescript
// In app.config.ts
devMode: false; // ALTIJD false in productie!
```

### 3. Pricing System

**Bestand**: `src/app/core/services/pricing.service.ts`

Twee pricing modellen:

**A. Size-based Pricing (NIEUW)** ✅

```typescript
interface SizePricing {
  pricing: { small: 20, medium: 30, large: 40 },  // Prijs per grootte
  duration: { small: 20, medium: 30, large: 40 }, // Duur in minuten
  breedOverrides?: [                               // Uitzonderingen per ras
    { breedId: 'x', priceAdjustment: +10 }        // +10 voor moeilijke rassen
  ]
}
```

**B. Legacy Fixed/Time-based** (DEPRECATED)

- Gebruik size-based voor nieuwe services!

**Berekeningen**:

```typescript
// Totale prijs berekenen
pricing.calculateTotalPrice(services, packages, breed);

// Uurtarief berekenen (doel: €60/uur)
pricing.calculateHourlyRate(totalPrice, totalMinutes);
```

### 4. Form Pattern

**Bestand**: `src/app/core/components/form-base/form-base.component.ts`

Alle formulieren extend `FormBaseComponent`:

**Features**:

- ✅ `formMode` - 'create' of 'edit'
- ✅ `item` - Het item dat bewerkt wordt
- ✅ `loadItem()` - Laadt item bij edit mode
- ✅ `saveItem()` - Opslaan (create of update)
- ✅ `canDeactivate()` - Waarschuwing bij unsaved changes

**Gebruik**:

```typescript
export class ClientFormComponent extends FormBaseComponent<Client> {
  protected override setService() {
    return this.clientService;
  }

  protected override loadItem() {
    // Custom load logic
  }
}
```

### 5. Calendar Integratie

**Bestand**: `src/app/core/services/calendar.service.ts`

**Wat het doet**:

- Koppelt afspraken aan Google Calendar
- Gebruikt Firebase Functions als proxy (backend)
- Maakt automatisch "TrimSalon" calendar

**Flow**:

1. User logt in → vraagt calendar toegang
2. Backend slaat OAuth tokens op
3. Frontend roept Firebase Functions aan
4. Functions praat met Google Calendar API

**Firebase Functions**:

- `exchangeAuthCode` - OAuth code → tokens
- `listCalendars` - Lijst calendars
- `createCalendar` - Maak TrimSalon calendar
- `createCalendarEvent` - Maak afspraak
- `updateCalendarEvent` - Update afspraak
- `deleteCalendarEvent` - Verwijder afspraak

## 🔐 Security & Permissions

### Firebase Rules

- **Authenticated users only** - Alleen ingelogde users
- **Allowed users check** - Email moet in `allowed-users` collection
- **Read/write rules** - Per collection ingesteld

### Auth Guard

**Bestand**: `src/app/core/guards/auth.guard.ts`

Beveiligt routes:

```typescript
{
  path: 'clients',
  component: ClientsComponent,
  canActivate: [authGuard]  // ← Vereist login
}
```

## 🧪 Testing

### Test Files

- `*.spec.ts` - Unit tests naast source files
- `test-helpers/` - Shared test utilities

### Running Tests

```bash
npm test              # Watch mode voor development
npm run test:ci       # CI mode (headless)
npm run test:coverage # Met coverage report
```

### Test Patterns

```typescript
describe("MyService", () => {
  let service: MyService;
  let mockFirestore: MockFirestore;

  beforeEach(() => {
    // Setup mocks
    mockFirestore = new MockFirestore();

    TestBed.configureTestingModule({
      providers: [MyService, { provide: Firestore, useValue: mockFirestore }],
    });

    service = TestBed.inject(MyService);
  });

  it("should do something", () => {
    // Test logic
  });
});
```

## 📊 Data Models

### Belangrijkste Models

**Client** - Klant

```typescript
interface Client {
  id?: string;
  name: string;
  email: string;
  phone: string;
  dogs: Dog[]; // Embedded honden
  isAnonymized?: boolean; // Voor soft-delete
}
```

**Dog** - Hond (embedded in Client)

```typescript
interface Dog {
  id: string;
  name: string;
  breed: Breed; // Verwijzing naar Breed
  notes?: string;
}
```

**Appointment** - Afspraak

```typescript
interface Appointment {
  id?: string;
  client: Client; // Denormalized voor performance
  dog: Dog;
  services?: Service[];
  packages?: Package[];
  startTime: Date;
  endTime: Date;
  estimatedPrice: number;
  completed?: boolean;
}
```

**Invoice** - Factuur

```typescript
interface Invoice {
  id?: string;
  invoiceNumber: string;
  client: Client;
  items: InvoiceItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus; // PENDING, PAID, OVERDUE
  issueDate: Date;
  dueDate: Date;
}
```

## 🚀 Development Workflow

### 1. Start Development

```bash
npm install           # Eenmalig
npm start             # Start dev server op localhost:4200
```

### 2. Maak Changes

- Code wordt auto-formatted bij opslaan (VS Code)
- ESLint geeft warnings in editor

### 3. Commit

```bash
git add .
git commit -m "feat: nieuwe feature"
# → Pre-commit hooks runnen automatisch (format + lint)
```

### 4. Push

```bash
git push
# → CI pipeline runt automatisch (lint, test, build)
```

### 5. Deploy

```bash
npm run build         # Build voor productie
firebase deploy       # Deploy naar Firebase Hosting
```

## 🔧 Common Tasks

### Nieuwe Service Toevoegen

```typescript
// 1. Maak model
export interface MyModel {
  id?: string;
  name: string;
}

// 2. Maak service
@Injectable({ providedIn: 'root' })
export class MyService extends BaseService<MyModel> {
  constructor() {
    super('my-collection');
  }
}

// 3. Gebruik in component
constructor(private myService: MyService) {}

ngOnInit() {
  this.myService.getData$().subscribe(items => {
    this.items = items;
  });
}
```

### Nieuwe Page Toevoegen

```bash
# 1. Generate component
ng generate component pages/my-page

# 2. Add route in app.routes.ts
{
  path: 'my-page',
  component: MyPageComponent,
  canActivate: [authGuard]
}

# 3. Add to navigation (if needed)
```

### Firebase Firestore Query

```typescript
// Via BaseService - simpel
service.getData$().subscribe(items => {...});

// Custom query - direct Firestore
import { collection, query, where } from '@angular/fire/firestore';

const q = query(
  collection(firestore, 'clients'),
  where('email', '==', 'test@example.com')
);

collectionData(q).subscribe(results => {...});
```

## 🐛 Troubleshooting

### Build Errors

```bash
# Clean & rebuild
rm -rf .angular dist node_modules
npm install
npm run build
```

### Test Failures

```bash
# Run specific test
npm test -- --include='**/my-service.spec.ts'

# Check coverage
npm run test:coverage
open coverage/TrimSalon/index.html
```

### Firebase Auth Issues

1. Check Firebase Console → Authentication → Users
2. Check Firestore → `allowed-users` collection
3. Check browser console for errors
4. Verify `app.config.ts` has correct Firebase config

### Calendar Not Working

1. Check Firebase Functions logs in Firebase Console
2. Verify OAuth credentials in Google Cloud Console
3. Check if user has calendar scope permission

## 📚 Extra Resources

### Documentatie

- **AUTOMATION_README.md** - Quality automation uitleg
- **TESTING.md** - Testing guide
- **QUALITY_GUIDE.md** - Quick reference
- **README.md** - Project overview

### Angular Docs

- https://angular.dev

### Firebase Docs

- https://firebase.google.com/docs

### PrimeNG Components

- https://primeng.org

## 💡 Best Practices

### DO ✅

- Gebruik BaseService voor CRUD
- Extend FormBaseComponent voor formulieren
- Test nieuwe features
- Gebruik TypeScript types (geen `any`)
- Commit kleine changes (atomic commits)
- Document complexe logic met comments

### DON'T ❌

- Geen direct Firestore calls (gebruik services)
- Geen `any` types zonder goede reden
- Geen hardcoded values (gebruik config)
- Geen production secrets in code
- Geen force push naar main branch
- Geen devMode in productie

## 🎯 Quick Start Checklist

Als je 6 maanden niet gewerkt hebt:

- [ ] 1. Lees dit document volledig
- [ ] 2. `npm install` om dependencies te updaten
- [ ] 3. `npm start` en check of het werkt
- [ ] 4. Kijk naar recent commits: `git log --oneline -20`
- [ ] 5. Check Firebase Console voor productie data
- [ ] 6. Run tests: `npm run test:coverage`
- [ ] 7. Review open issues op GitHub
- [ ] 8. Update dependencies indien nodig: check Dependabot PRs

**Klaar om te beginnen! 🚀**
