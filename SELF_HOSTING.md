# NoMiRo Self-Hosting Guide

## Overview

NoMiRo supports two deployment modes:
- **Cloud mode**: Uses Supabase for backend
- **Local mode**: Fully offline-capable with IndexedDB + Cache Storage + OIDC

## Quick Start (Self-Hosted)

### 1. Build the app

```bash
git clone <your-repo-url>
cd nomiro
npm install
cp .env.example .env.local
# Edit .env.local with your settings
npm run build
```

### 2. Environment Variables

See `.env.example` for all options. Key settings:

```env
VITE_BACKEND_MODE=local
VITE_OIDC_AUTHORITY=https://auth.nomiro.app/realms/nomiro
VITE_OIDC_CLIENT_ID=nomiro-web
VITE_OIDC_REDIRECT_URI=https://nomiro.app/auth/callback
VITE_OIDC_POST_LOGOUT_URI=https://nomiro.app
VITE_OIDC_SCOPE=openid profile email
```

### 3. Deploy

The `dist/` folder is a static site. Deploy to any web server:

```bash
# Nginx, Apache, Caddy, Vercel, Netlify, Cloudflare Pages, etc.
npx serve dist
```

### 4. OIDC Provider Setup

Compatible with any OpenID Connect provider:

#### Keycloak (recommended for self-hosting)
```bash
docker run -d --name keycloak \
  -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest start-dev
```

1. Create a realm called `nomiro`
2. Create a client `nomiro-web` (public, authorization code flow)
3. Set redirect URI: `https://nomiro.app/auth/callback`
4. Set web origin: `https://nomiro.app`

#### Auth0
1. Create a Single Page Application
2. Callback URL: `https://nomiro.app/auth/callback`
3. Logout URL: `https://nomiro.app`
4. Use your Auth0 domain as `VITE_OIDC_AUTHORITY`

#### Authentik
1. Create an OAuth2/OIDC Provider
2. Create an Application linked to the provider
3. Set redirect URI: `https://nomiro.app/auth/callback`

## Migrating Code to Use Backend Client

The project provides a **drop-in replacement** for the Supabase client:

```typescript
// BEFORE (cloud-only):
import { supabase } from "@/integrations/supabase/client";
const { data } = await supabase.from("tasks").select("*").eq("family_id", id);

// AFTER (works in both modes):
import { backend } from "@/lib/backend-client";
const { data } = await backend.from("tasks").select("*").eq("family_id", id);
```

The `backend` client provides the exact same API:
- `backend.from("table").select().eq().single()`
- `backend.auth.signUp() / signInWithPassword() / signOut() / getSession()`
- `backend.storage.from("bucket").upload() / createSignedUrl()`
- `backend.functions.invoke("name", { body })`
- `backend.channel("name").on().subscribe()`

### Files to migrate

Replace `import { supabase }` with `import { backend }` in:
- `src/pages/Auth.tsx`
- `src/pages/ParentDashboard.tsx`
- `src/pages/ChildDashboard.tsx`
- `src/pages/FamilySettings.tsx`
- `src/pages/ForgotPassword.tsx`
- `src/pages/ResetPassword.tsx`
- `src/pages/AcceptInvite.tsx`
- `src/pages/TwoFactorVerify.tsx`
- `src/components/NotificationBell.tsx`
- `src/components/SecuritySettings.tsx`
- `src/components/TaskEditDialog.tsx`
- `src/components/TaskTemplateSelector.tsx`
- `src/components/RewardEditDialog.tsx`
- `src/components/ParentManagement.tsx`
- `src/components/ParentInviteDialog.tsx`
- `src/components/PendingInvitations.tsx`
- `src/hooks/usePushNotifications.ts`

## Architecture

```
┌─────────────────────────────────────────┐
│              React Frontend              │
├─────────────────────────────────────────┤
│  backend client (src/lib/backend-client) │
│  Same API: .from() .auth .storage        │
├────────────────┬────────────────────────┤
│   Cloud Mode   │     Local Mode         │
│   (Supabase)   │  (IndexedDB + OIDC)    │
│   Real DB/Auth │  Browser Storage       │
└────────────────┴────────────────────────┘
```

## Data Storage (Local Mode)

| Type | Technology | Notes |
|------|-----------|-------|
| Structured data | IndexedDB | All 13 tables mirrored |
| File storage | localStorage (base64) | Limited by browser quota |
| Network resources | Cache Storage API | Service Worker managed |
| Auth sessions | localStorage + OIDC | Token refresh supported |

### Data Export/Import

```javascript
// Export (browser console)
import { localExportAll } from '/src/lib/local-db';
const backup = await localExportAll();
// Save JSON

// Import
import { localImportAll } from '/src/lib/local-db';
await localImportAll(backupData);
```

## Offline Capabilities

In local mode, the app works fully offline after initial load:
- All data persists in IndexedDB
- App shell cached via Service Worker
- Cache-first for assets, network-first for API
- Auth tokens in localStorage

## Limitations (Local Mode)

- Push notifications require a separate push service
- Email sending (2FA, invites) not available
- Realtime sync between devices not available
- File storage limited by browser quota (~50MB-1GB depending on browser)
- Edge functions return mock responses
