# Testing & Quality Assurance

## Overzicht

Dit project heeft uitgebreide test coverage en geautomatiseerde kwaliteitscontroles om code kwaliteit te garanderen met minimale handmatige inspanning.

## Automatische Kwaliteitscontroles

### 1. Pre-commit Hooks (Lokaal)

Bij elke commit worden automatisch uitgevoerd:

- ✅ **Prettier**: Code formatting check
- ✅ **ESLint**: Code linting zonder auto-fix
- ⏭️ **Tests**: Optioneel (uitgeschakeld voor snelheid)

**Hoe te gebruiken:**

```bash
git add .
git commit -m "Your message"
# Hooks worden automatisch uitgevoerd
```

### 2. CI/CD Pipeline (GitHub Actions)

Bij elke push en pull request:

- ✅ **Linting**: Volledige lint check
- ✅ **Tests**: Alle unit tests met coverage
- ✅ **Build**: Production build verificatie
- ✅ **Coverage**: Upload naar Codecov (optioneel)
- ✅ **SonarCloud**: Code quality scan (optioneel)

**Status bekijken:**

- GitHub Actions tab in je repository
- Badge in README (optioneel toe te voegen)

## Test Commands

### Development

```bash
# Interactieve tests (watch mode)
npm test

# Tests met coverage
npm run test:coverage

# Tests in CI mode (headless)
npm run test:ci
```

### Alle Kwaliteitscontroles

```bash
# Voer alle checks uit (zoals CI)
npm run quality:full
```

## Test Structuur

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── *.service.ts
│   │   │   └── *.service.spec.ts  ✅ Volledige coverage
│   │   ├── guards/
│   │   │   ├── *.guard.ts
│   │   │   └── *.guard.spec.ts    ✅ Volledige coverage
│   │   └── components/
│   │       ├── *.component.ts
│   │       └── *.component.spec.ts ✅ Basis tests
│   └── pages/
│       └── */
│           ├── *.component.ts
│           └── *.component.spec.ts ✅ Basis tests
└── test-helpers/
    ├── firebase-mocks.ts      ✅ Mock Firebase services
    ├── angular-mocks.ts       ✅ Mock Angular services
    └── test-data-factory.ts   ✅ Test data generators
```

## Coverage Doelen

| Component Type | Coverage Target | Huidige Status |
| -------------- | --------------- | -------------- |
| Services       | 80%+            | ✅ Volledig    |
| Guards         | 80%+            | ✅ Volledig    |
| Components     | 60%+            | ✅ Basis       |
| Directives     | 80%+            | ✅ Volledig    |

## Minimale Inspanning, Maximale Kwaliteit

### ✅ Wat is al geautomatiseerd:

1. **Code Formatting**: Prettier checkt en format automatisch
2. **Linting**: ESLint valideert code kwaliteit
3. **Testing**: Karma + Jasmine draaien automatisch in CI
4. **Build Validation**: Productie build wordt getest
5. **Pre-commit**: Voorkomt slechte code in de repository

### 📋 Wat je moet doen:

**Bij nieuwe features:**

1. Schrijf code
2. Commit → Pre-commit hooks runnen automatisch
3. Push → CI pipeline runt automatisch
4. Merk failures en fix ze

**Bij bugs:**

1. Schrijf test die bug reproduceert
2. Fix de bug
3. Commit & push → Alles wordt gevalideerd

## Best Practices

### Test Schrijven

**Services:**

```typescript
describe("MyService", () => {
  let service: MyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MyService, { provide: Firestore, useValue: new MockFirestore() }],
    });
    service = TestBed.inject(MyService);
  });

  it("should do something", () => {
    // Test implementation
  });
});
```

**Components:**

```typescript
describe("MyComponent", () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [
        /* mocks */
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
```

## Code Quality Tools

### ESLint

Valideert TypeScript code kwaliteit:

- Type safety
- Best practices
- Code style
- Angular specific rules

### Prettier

Zorgt voor consistente code formatting:

- Automatische formatting
- Consistent across team
- Geen discussies over stijl

### Karma + Jasmine

Test framework:

- Unit tests
- Component tests
- Service tests
- Guard tests

## Troubleshooting

### Tests falen lokaal maar niet in CI

```bash
# Clear node_modules en reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests in CI mode
npm run test:ci
```

### Pre-commit hook faalt

```bash
# Fix linting issues automatisch
npm run lint

# Fix formatting automatisch
npm run format

# Try commit again
git commit -m "Your message"
```

### Coverage te laag

1. Check coverage report: `coverage/TrimSalon/index.html`
2. Voeg tests toe voor rode files
3. Run `npm run test:coverage` opnieuw

## Toekomstige Verbeteringen (Optioneel)

- [ ] E2E tests met Playwright/Cypress
- [ ] Visual regression testing
- [ ] Performance monitoring
- [ ] Automated dependency updates (Dependabot)
- [ ] Security scanning (Snyk/GitHub Security)

## Support

Voor vragen over testing:

1. Check deze documentatie
2. Kijk naar bestaande tests als voorbeeld
3. Check test-helpers voor mock utilities
