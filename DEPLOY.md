# NoMiRo — Node.js Deployment Guide

## How it works

The app is a **React SPA** built with Vite. The Node.js server (`server.js`)
serves the compiled `dist/` folder with gzip compression and proper SPA routing
(all paths fall back to `index.html` so react-router works correctly).

> ⚠ **Build-time env vars**: All `VITE_*` variables are compiled into the
> JavaScript bundle. If you change them you must re-run `npm run build`.

---

## Quick Start (local)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.production.example .env
# Edit .env with your settings

# 3. Build the frontend
npm run build

# 4. Start the server
npm start
# → http://localhost:3000
```

---

## Docker

### Build & run

```bash
# Local (IndexedDB) mode
docker build \
  --build-arg VITE_BACKEND_MODE=local \
  --build-arg VITE_OIDC_AUTHORITY=https://auth.example.com/realms/nomiro \
  --build-arg VITE_OIDC_CLIENT_ID=nomiro-web \
  --build-arg VITE_OIDC_REDIRECT_URI=https://yourdomain.com/auth/callback \
  --build-arg VITE_OIDC_POST_LOGOUT_URI=https://yourdomain.com \
  --build-arg VITE_OIDC_SCOPE="openid profile email" \
  -t nomiro .

docker run -p 3000:3000 nomiro
```

```bash
# Cloud (Supabase) mode
docker build \
  --build-arg VITE_BACKEND_MODE=cloud \
  --build-arg VITE_SUPABASE_URL=https://yourproject.supabase.co \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key \
  --build-arg VITE_SUPABASE_PROJECT_ID=your-project-id \
  -t nomiro .

docker run -p 3000:3000 nomiro
```

### docker-compose example

```yaml
version: "3.9"
services:
  nomiro:
    build:
      context: .
      args:
        VITE_BACKEND_MODE: local
        VITE_OIDC_AUTHORITY: https://auth.example.com/realms/nomiro
        VITE_OIDC_CLIENT_ID: nomiro-web
        VITE_OIDC_REDIRECT_URI: https://yourdomain.com/auth/callback
        VITE_OIDC_POST_LOGOUT_URI: https://yourdomain.com
        VITE_OIDC_SCOPE: "openid profile email"
    ports:
      - "3000:3000"
    restart: unless-stopped
```

---

## Platform Guides

### Railway

1. Create a new project → **Deploy from GitHub repo**
2. Set **Build command**: `npm run build`
3. Set **Start command**: `npm start`
4. Add environment variables under **Variables**:
   - All `VITE_*` vars (used at build time)
   - `PORT` is set automatically by Railway
5. Deploy

### Render

1. New → **Web Service** → connect your repo
2. **Build command**: `npm install && npm run build`
3. **Start command**: `node server.js`
4. Add env vars in the **Environment** tab
5. Deploy

### Fly.io

```bash
fly launch          # creates fly.toml
fly secrets set VITE_BACKEND_MODE=local VITE_OIDC_AUTHORITY=... ...
fly deploy
```

### Heroku

```bash
heroku create nomiro-app
heroku config:set VITE_BACKEND_MODE=local VITE_OIDC_AUTHORITY=...
git push heroku main
```

Add a `Procfile` (already included):
```
web: node server.js
```

### VPS / bare metal (with nginx reverse proxy)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Run the app as a systemd service or with PM2:
```bash
npm install -g pm2
pm2 start server.js --name nomiro
pm2 save && pm2 startup
```

---

## Health Check

The server exposes `GET /health` → `{ "status": "ok", "timestamp": "..." }`

Use this for load balancer / container health probes.

---

## OIDC Provider Setup (Local Mode)

### Keycloak (recommended)

```bash
docker run -d --name keycloak \
  -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest start-dev
```

1. Create realm `nomiro`
2. Create client `nomiro-web` → Public, Authorization Code Flow
3. Valid redirect URIs: `https://yourdomain.com/auth/callback`
4. Web origins: `https://yourdomain.com`

### Auth0

1. Applications → New → Single Page App
2. Allowed Callback: `https://yourdomain.com/auth/callback`
3. Allowed Logout: `https://yourdomain.com`
4. `VITE_OIDC_AUTHORITY` = `https://YOUR_TENANT.auth0.com`

---

## Supabase Edge Functions (Cloud Mode)

The `supabase/functions/` directory contains Deno-based edge functions for:
- Email sending (2FA codes, invites)
- Push notifications
- Scheduled tasks

Deploy these separately via the Supabase CLI:
```bash
supabase functions deploy --project-ref YOUR_PROJECT_ID
```

Run migrations:
```bash
supabase db push --project-ref YOUR_PROJECT_ID
```

---

## Android / Play Store

NoMiRo uses [Capacitor](https://capacitorjs.com) to wrap the web app as a native Android app.

### Prerequisites

- Android Studio (latest stable)
- JDK 17+
- Android SDK (API level 33+)
- A Google Play Developer account ($25 one-time fee)

### Install Capacitor Android

```bash
npm install @capacitor/android @capacitor/splash-screen
npx cap add android
```

### Build and sync

```bash
# 1. Build the web bundle (VITE_* env vars baked in)
npm run build

# 2. Sync web assets and plugins into the Android project
npx cap sync android

# 3. Open Android Studio
npx cap open android
```

### App ID

The app ID is set in `capacitor.config.json`:

```json
{ "appId": "app.nomiro" }
```

> **Important**: The Play Store requires a globally unique reverse-domain ID.
> If `app.nomiro` is taken, use something like `com.yourcompany.nomiro`.
> Once published, the app ID **cannot be changed**.

### Google Sign-In (Android)

To enable Google Sign-In in the Android app:

1. Install the Capacitor Google Auth plugin:
   ```bash
   npm install @codetrix-studio/capacitor-google-auth
   npx cap sync android
   ```

2. In [Google Cloud Console](https://console.cloud.google.com/):
   - Create/open your project
   - Enable the **Google Sign-In** API
   - Create an **OAuth 2.0 Client ID** of type **Android**
   - Set the package name to `app.nomiro`
   - Provide the **SHA-1** fingerprint of your signing key:
     ```bash
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
     ```

3. Add your `google-services.json` (downloaded from Firebase or Google Cloud Console) to `android/app/`.

4. In `android/app/build.gradle`, apply the Google services plugin:
   ```groovy
   apply plugin: 'com.google.gms.google-services'
   ```

### Push Notifications (Android)

1. Install the push notifications plugin:
   ```bash
   npm install @capacitor/push-notifications
   npx cap sync android
   ```

2. Set up Firebase Cloud Messaging (FCM):
   - Create a Firebase project
   - Download `google-services.json` → `android/app/`
   - Copy the FCM server key → set as `FCM_SERVER_KEY` in Supabase secrets

3. Add to `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
   ```

### Signing for release

```bash
# Generate a release keystore (keep this file safe — you can never change it)
keytool -genkey -v -keystore nomiro-release.keystore \
  -alias nomiro -keyalg RSA -keysize 2048 -validity 10000

# Build signed APK / AAB in Android Studio:
# Build → Generate Signed Bundle / APK → Android App Bundle (AAB)
```

Upload the `.aab` file to Play Console.

### Play Store checklist

- [ ] Unique app ID (`app.nomiro` or similar)
- [ ] App icon: 512×512 PNG (no alpha), in `android/app/src/main/res/`
- [ ] Feature graphic: 1024×500 PNG
- [ ] Screenshots: min 2, phone & 7" tablet
- [ ] Privacy policy URL (required — data collection declaration)
- [ ] Content rating questionnaire completed
- [ ] Release signed AAB uploaded to Internal Testing track first
- [ ] `android:debuggable="false"` in release build manifest
- [ ] `allowMixedContent: false` in `capacitor.config.json` ✓ (already set)
- [ ] `webContentsDebuggingEnabled: false` in `capacitor.config.json` ✓ (already set)

### New environment variables added for edge functions

| Secret | Used by | Description |
|--------|---------|-------------|
| `EMAIL_WEBHOOK_SECRET` | `auth-email-hook` | Replaces `LOVABLE_API_KEY` — HMAC signing secret |
| `RESEND_API_KEY` | `process-email-queue`, `send-2fa-code`, `send-parent-invite` | Resend email delivery |
| `EMAIL_FROM_DOMAIN` | `send-parent-invite` | Domain in the `From:` header, e.g. `nomiro.app` |
| `APP_URL` | `send-parent-invite` | Fallback app URL, e.g. `https://nomiro.app` |
| `ALLOWED_ORIGINS` | All edge functions | Comma-separated extra allowed CORS origins |
| `SITE_NAME` | `auth-email-hook` | Site name in email templates |
| `APP_DOMAIN` | `auth-email-hook` | Root domain, e.g. `nomiro.app` |
| `EMAIL_SENDER_DOMAIN` | `auth-email-hook` | Sending domain, e.g. `notify.nomiro.app` |

Set secrets via the Supabase CLI:
```bash
supabase secrets set EMAIL_WEBHOOK_SECRET=your-secret RESEND_API_KEY=re_xxx ...
```
