# Investo Mobile

React Native (Expo) mobile app for the Investo investment management platform.

## Prerequisites

- Node.js 20+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS / Android) for development
- Or Android Studio / Xcode for simulators

## Setup

### 1. Install dependencies

```bash
cd mobile
npm install
```

### 2. Copy translation files

```bash
copy ..\frontend\messages\en.json messages\en.json
copy ..\frontend\messages\fr.json messages\fr.json
```

### 3. Start the development server

```bash
npx expo start
```

Scan the QR code with Expo Go on your phone, or press:
- `a` for Android emulator
- `i` for iOS simulator
- `w` for web preview

## Project structure

```
mobile/
├── app/                    Expo Router screens
│   ├── (auth)/             Login, Register, Verify Email
│   ├── (client)/           Client tab navigation + screens
│   ├── (accountant)/       Accountant tab navigation + screens
│   ├── (admin)/            Admin tab navigation + screens
│   ├── _layout.tsx         Root layout (i18n, QueryClient, Toast)
│   └── index.tsx           Bootstrap — checks token → routes to correct role
├── components/
│   ├── layout/             Header with bell badge and avatar
│   └── ui/                 StatCard, Button, Card, StatusBadge, etc.
├── lib/
│   ├── api.ts              All API calls (same backend as web)
│   ├── api-client.ts       Base fetch with SecureStore token injection
│   ├── auth-store.ts       Zustand auth store
│   ├── notification-store.ts  Zustand unread count store
│   ├── secure-storage.ts   expo-secure-store token helpers
│   ├── utils.ts            formatCurrency, formatDate, etc.
│   ├── zod-schemas.ts      Form validation schemas
│   └── i18n.ts             react-i18next setup (EN/FR)
├── types/index.ts          Shared TypeScript types (same as web)
├── constants/config.ts     API_BASE_URL, colors, banks, periods
└── messages/               Copy from ../frontend/messages/
```

## API

The app connects to the same backend as the web:
- Production: `https://investobacken.onrender.com/api`
- Development: change `apiUrl` in `app.json` → `extra.apiUrl`

## Authentication

- Tokens stored in `expo-secure-store` (encrypted on device)
- On launch: checks for stored token → validates → routes to role dashboard
- Supports CLIENT, ACCOUNTANT, ADMIN roles

## Features by role

### Client
- Dashboard with balance, deposits, investments overview
- Submit deposits with camera/gallery receipt upload
- Request withdrawals with balance validation
- View investments with cycle tracking
- Notifications with mark-read
- Settings: avatar, personal info, password change

### Accountant
- Dashboard with pending queue and activity
- Deposit management with permission-gated confirm/reject
- Withdrawal management with permission-gated confirm/reject
- Reports (requires generateReports permission)
- Notifications that navigate to relevant screens on tap
- Settings: avatar, contact info, password change

### Admin
- Full dashboard with platform-wide stats
- Full deposit and withdrawal management
- Client list with search and detail view
- Interest rate management
- Audit logs
- Notifications with navigation
- Settings: avatar, password change, language toggle

## Building for production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## Language

Toggle between English and French using the globe icon in Settings or the Header.
Translation files are shared with the web frontend (`../frontend/messages/`).
