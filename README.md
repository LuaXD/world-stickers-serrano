# Mundial 2026 Realtime Sticker Tracker

React + TypeScript + Vite + Tailwind app that syncs sticker counts live using Firebase Realtime Database.

## Stack

- React
- TypeScript
- Vite
- TailwindCSS
- Firebase Realtime Database
- GitHub Pages

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill Firebase values.
3. Start development server:

```bash
npm run dev
```

## Environment variables

Required values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Data shape

```json
{
  "users": {
    "Addis": {
      "stickers": {
        "MEX 1": 1,
        "MEX 2": 3,
        "FWC 7": 2
      }
    }
  }
}
```

## Realtime behavior

- App subscribes to `/users`
- Any client update is broadcast instantly by Firebase
- UI updates in all open sessions without refresh

## Username flow

- Predefined usernames in frontend
- User selects one name from dropdown
- Selected name persists in `localStorage`

## Firebase rules for this no-auth setup

Use only for trusted private usage:

```json
{
  "rules": {
    "users": {
      ".read": true,
      ".write": true
    }
  }
}
```

## GitHub Pages deployment

The repository includes `.github/workflows/deploy.yml`.

Set these repository secrets before pushing to `main`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
