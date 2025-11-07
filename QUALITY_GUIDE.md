# Quality Automation Quick Reference

## 🚀 Dagelijkse Workflow

### 1. Start Development

```bash
npm start
```

### 2. Maak Code Wijzigingen

- VS Code zal automatisch formatteren bij opslaan
- ESLint zal automatisch problemen markeren

### 3. Commit Code

```bash
git add .
git commit -m "feat: add new feature"
```

✅ Pre-commit hooks runnen automatisch:

- Prettier formatting
- ESLint checks

### 4. Push Code

```bash
git push
```

✅ CI/CD pipeline runt automatisch:

- Lint check
- All tests
- Build verification

## 🧪 Testing Commands

| Command                 | Wanneer te gebruiken            |
| ----------------------- | ------------------------------- |
| `npm test`              | Lokale development (watch mode) |
| `npm run test:coverage` | Check test coverage             |
| `npm run test:ci`       | Simuleer CI omgeving            |
| `npm run quality:full`  | Volledige check voor release    |

## 🔍 Quality Commands

| Command                | Wat het doet                   |
| ---------------------- | ------------------------------ |
| `npm run lint`         | Fix lint problemen automatisch |
| `npm run lint:check`   | Check zonder auto-fix          |
| `npm run format`       | Format alle files              |
| `npm run format:check` | Check formatting               |
| `npm run build`        | Build voor production          |

## ⚡ Snelle Fixes

### Lint Errors

```bash
npm run lint  # Auto-fix
```

### Format Errors

```bash
npm run format  # Auto-format
```

### Test Failures

```bash
# Clear cache
rm -rf .angular node_modules
npm install
npm test
```

### Build Failures

```bash
# Clean build
rm -rf dist .angular
npm run build
```

## 📊 Coverage Bekijken

1. Run tests met coverage:

```bash
npm run test:coverage
```

2. Open report:

```bash
open coverage/TrimSalon/index.html
```

## 🎯 Kwaliteitsdoelen

- ✅ **Services**: 80%+ coverage
- ✅ **Guards**: 80%+ coverage
- ✅ **Components**: 60%+ coverage
- ✅ **Linting**: 0 errors
- ✅ **Build**: Success

## 🔄 Pre-commit Hook Problemen?

Als de hook faalt:

```bash
# Fix alles automatisch
npm run lint
npm run format

# Of skip hook (ALLEEN IN NOODGEVAL)
git commit --no-verify -m "message"
```

## 🚨 CI/CD Failures

1. Check GitHub Actions tab
2. Kijk welke stap faalt
3. Run dezelfde command lokaal:
   - Lint failure: `npm run lint:check`
   - Test failure: `npm run test:ci`
   - Build failure: `npm run build`
4. Fix en push opnieuw

## 💡 Tips

1. **Altijd formatteren voor commit**: `npm run format`
2. **Test lokaal voor push**: `npm run test:coverage`
3. **Check coverage**: Open `coverage/TrimSalon/index.html`
4. **VS Code**: Install aanbevolen extensions
5. **Pre-commit**: Laat het zijn werk doen, skip niet

## 📚 Meer Info

- Volledige testing guide: `TESTING.md`
- Angular docs: https://angular.dev
- Jasmine docs: https://jasmine.github.io
