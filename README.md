# NoMiRo — Family Task Manager

A gamified chore & reward management app for families. Parents assign tasks, children earn points, and everyone redeems rewards.

## Tech stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend (cloud mode)**: Supabase (Postgres, Auth, Edge Functions, Storage)
- **Backend (local mode)**: IndexedDB + OIDC (offline-capable, self-hosted)
- **Mobile**: Capacitor (Android / Play Store)
- **PWA**: Vite PWA plugin (installable, offline-first)

## Quick start

```bash
npm install
cp .env.production.example .env.local   # fill in your values
npm run dev                              # http://localhost:8080
```

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full instructions (Docker, Railway, Render, Fly.io, Heroku, VPS).

```bash
npm run build   # builds dist/
npm start       # serves on PORT (default 3000)
```

## Backend modes

| Mode | How to set | Best for |
|------|-----------|---------|
| `cloud` | `VITE_BACKEND_MODE=cloud` | Managed hosting with Supabase |
| `local` | `VITE_BACKEND_MODE=local` | Offline-first or fully self-hosted |

## Android / Play Store

See the **Android** section in [DEPLOY.md](./DEPLOY.md).

```bash
npm run build
npx cap sync android
npx cap open android   # opens Android Studio
```

## Environment variables

See [`.env.production.example`](./.env.production.example) for all options.
