# TrimSalon

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.5.

## 🚀 Tech Stack

- **Framework**: Angular 20.1.0
- **UI Library**: PrimeNG 20.0.1
- **Styling**: PrimeFlex
- **Backend**: Firebase (Functions, Firestore)
- **Calendar**: FullCalendar

## 🏁 Getting Started

1. **Clone & Install**:

   ```bash
   git clone <repo>
   npm install
   ```

2. **Configure environment**:

   Copy `.env.example` to `.env` and fill in the values. This repo generates `public/runtime-config.json` from your `.env` during `npm start` / `npm run build`.

   If you get `auth/api-key-expired`, update `FIREBASE_API_KEY` with the Web API Key from Firebase Console → Project settings → General → Your apps → (Web app) and re-run `npm start` (or `npm run config:generate`).

3. **Start Development Server**:

   ```bash
   npm start
   ```

   Navigate to `http://localhost:4200/`.

4. **Build**:
   ```bash
   npm run build
   ```

## 📚 Documentation

Detailed documentation has been organized into the `docs/` folder:

- **[Completion Status](docs/COMPLETION_STATUS.md)**: Overview of project completion and test coverage.
- **[Calendar Implementation](docs/CALENDAR_IMPLEMENTATION.md)**: Technical details of the calendar and sync implementation.
- **[Calendar Sync Guide](docs/CALENDAR_SYNC_GUIDE.md)**: User guide for Google Calendar synchronization.
- **[Automation Readme](AUTOMATION_README.md)**: Guide to automated quality checks.
- **[Testing Guide](TESTING.md)**: Comprehensive testing guide.

## ✨ Key Features

- **Appointment Management**: List and Calendar views.
- **Google Calendar Sync**: 2-way synchronization with private/work calendar support.
- **Mobile Optimized**: Responsive design with touch-friendly interfaces.
- **Quality Assurance**: Automated testing, linting, and formatting.

## 🛠️ Development Commands

```bash
# Development
npm start                  # Start dev server
npm test                   # Run tests (watch)

# Quality
npm run lint               # Auto-fix linting
npm run format             # Auto-format
npm run quality:full       # Full check (CI equivalent)
```
