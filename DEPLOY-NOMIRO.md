# Deploying NoMiRo to nomiro.app

**Architecture used in this guide**

| Layer | Service | Cost |
|---|---|---|
| Frontend | GitHub Pages (custom domain) | Free |
| CI/CD | GitHub Actions | Free (2 000 min/month) |
| Database + Auth | Supabase cloud | Free tier |
| Email | Brevo SMTP | Free (300 emails/day) |
| Push notifications | Web Push / VAPID | Free (open standard) |
| Domain | nomiro.app (you own this) | ~$12/yr |

Total ongoing cost: **$0** (within free tiers).

---

## Before you start

You need these installed on your machine:

```bash
node --version   # need v18 or higher
npm --version    # need v9 or higher
git --version
```

And accounts at:
- [github.com](https://github.com) (free)
- [supabase.com](https://supabase.com) (free)
- [brevo.com](https://brevo.com) (free — for email)
- Access to your domain DNS for **nomiro.app**

Install the Supabase CLI:

```bash
npm install -g supabase
supabase --version   # should print 1.x or higher
```

---

## Part 1 — GitHub repository

### 1.1 Push your code to GitHub

If you haven't already:

```bash
cd nomiro-code

git init
git add .
git commit -m "Initial commit"

# Create a new repo at github.com/new, then:
git remote add origin https://github.com/YOUR_USERNAME/nomiro.git
git branch -M main
git push -u origin main
```

### 1.2 Enable GitHub Pages

1. Go to your repo on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source**, select **GitHub Actions**
4. Leave everything else as default — click **Save**

GitHub Pages is now waiting for your first deployment. The URL will be `https://YOUR_USERNAME.github.io/nomiro` until you add the custom domain in Part 5.

---

## Part 2 — Supabase project

### 2.1 Create a project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name: `nomiro`
3. Set a strong database password — **save it somewhere safe**
4. Region: pick the one closest to your users
5. Click **Create new project** and wait ~2 minutes

### 2.2 Get your project credentials

In the Supabase dashboard, go to **Project Settings** → **API**:

Copy these values — you'll need them shortly:

```
Project URL:   https://xxxxxxxxxxxx.supabase.co
anon/public key: eyJhbGci...  (long string starting with eyJ)
Project ID:    xxxxxxxxxxxx   (the part before .supabase.co)
```

### 2.3 Run the database migrations

Link your local project to Supabase and push all 16 migrations:

```bash
cd nomiro-code

# Log in (opens browser)
supabase login

# Link to your new project (use the Project ID from above)
supabase link --project-ref YOUR_PROJECT_ID

# Push all migrations to the database
supabase db push
```

Expected output: 16 migrations applied successfully.

Verify in Supabase dashboard → **Table Editor** — you should see tables including `profiles`, `families`, `children`, `tasks`, `rewards`, `notifications`, `push_subscriptions`.

### 2.4 Configure Auth settings

In Supabase dashboard → **Authentication** → **URL Configuration**:

| Setting | Value |
|---|---|
| Site URL | `https://nomiro.app` |
| Redirect URLs | `https://nomiro.app/auth/callback` |

In **Authentication** → **Email Templates** — leave as default for now (the custom templates are deployed via the edge function in Part 4).

---

## Part 3 — Email (Brevo SMTP)

### 3.1 Create a Brevo account

1. Sign up at [brevo.com](https://brevo.com) (free, no credit card)
2. Go to **SMTP & API** → **SMTP**
3. Click **Generate a new SMTP key**
4. Copy the SMTP credentials shown:

```
Host:     smtp-relay.brevo.com
Port:     587
Login:    your@email.com
Password: (the generated key, starts with xsmtp...)
```

### 3.2 Verify your sender domain

In Brevo → **Senders & IP** → **Domains** → **Add a domain**:

1. Enter `nomiro.app`
2. Brevo will give you DNS TXT records to add (SPF, DKIM)
3. Add them in your domain registrar's DNS panel
4. Click **Verify** in Brevo — wait up to 30 minutes for DNS propagation

> **Why this matters**: Without domain verification, emails will land in spam or be rejected.

---

## Part 4 — Push notifications (VAPID keys)

VAPID keys authenticate your server to browsers when sending push notifications. Generate them once and never change them — changing keys invalidates all existing subscriptions.

```bash
npx web-push generate-vapid-keys
```

Output looks like:

```
Public Key:
BMbXzZA8gQJuKLq... (long base64url string)

Private Key:
xY9zA2b... (shorter base64url string)
```

**Save both keys** — you can't recover the private key later.

---

## Part 5 — GitHub Actions secrets

This is where you wire everything together. All secrets are stored encrypted in GitHub and injected into the build/deploy process.

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Add each of these:

### Frontend build secrets (`VITE_*`)

| Secret name | Value |
|---|---|
| `VITE_BACKEND_MODE` | `cloud` |
| `VITE_SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGci...` (anon/public key) |
| `VITE_SUPABASE_PROJECT_ID` | `xxxxxxxxxxxx` |
| `VITE_VAPID_PUBLIC_KEY` | the **Public Key** from Part 4 |

> These are baked into the JavaScript bundle at build time. They are safe to expose — the Supabase anon key is restricted by Row Level Security policies.

---

## Part 6 — Deploy the frontend

Trigger your first deployment:

```bash
git commit --allow-empty -m "Trigger initial deploy"
git push
```

Go to your repo → **Actions** tab. You'll see the **Deploy to GitHub Pages** workflow running. It takes about 2 minutes.

When it finishes, your app is live at:
`https://YOUR_USERNAME.github.io/nomiro`

---

## Part 7 — Custom domain (nomiro.app)

### 7.1 Add the domain in GitHub

1. Repo → **Settings** → **Pages**
2. Under **Custom domain**, type `nomiro.app`
3. Click **Save**
4. Check **Enforce HTTPS** (may take a few minutes to appear after DNS is set)

GitHub will show you the DNS records to add.

### 7.2 Add DNS records

Log in to your domain registrar (wherever you bought nomiro.app) and add:

**Option A — apex domain (nomiro.app)**

Add four `A` records:

```
Type  Name  Value
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
```

Also add a `AAAA` record if your registrar supports IPv6:

```
Type   Name  Value
AAAA   @     2606:50c0:8000::153
AAAA   @     2606:50c0:8001::153
AAAA   @     2606:50c0:8002::153
AAAA   @     2606:50c0:8003::153
```

**Option B — also add www redirect**

```
Type   Name  Value
CNAME  www   YOUR_USERNAME.github.io
```

### 7.3 Wait for DNS propagation

DNS changes typically take 15 minutes to 2 hours. Check progress:

```bash
dig nomiro.app +short
# Should return GitHub's IPs (185.199.x.x)
```

Once DNS propagates, visit `https://nomiro.app` — your app should load.

---

## Part 8 — Supabase edge functions

### 8.1 Set the function secrets

Run all of these in one command (replace the placeholder values):

```bash
supabase secrets set \
  SMTP_HOST=smtp-relay.brevo.com \
  SMTP_PORT=587 \
  SMTP_USER=your@email.com \
  SMTP_PASS=xsmtp-your-generated-key \
  SMTP_FROM="NoMiRo <noreply@nomiro.app>" \
  SMTP_SECURE=false \
  EMAIL_WEBHOOK_SECRET=$(openssl rand -hex 32) \
  APP_URL=https://nomiro.app \
  APP_DOMAIN=nomiro.app \
  EMAIL_SENDER_DOMAIN=nomiro.app \
  SITE_NAME=nomiro \
  VAPID_PUBLIC_KEY=your-vapid-public-key-from-part-4 \
  VAPID_PRIVATE_KEY=your-vapid-private-key-from-part-4 \
  VAPID_SUBJECT=mailto:admin@nomiro.app
```

> **Tip for `EMAIL_WEBHOOK_SECRET`**: the `$(openssl rand -hex 32)` part auto-generates a secure 32-byte random secret. Write down the value it generates (`supabase secrets list` to see it later).

### 8.2 Deploy the edge functions

```bash
supabase functions deploy auth-email-hook      --project-ref YOUR_PROJECT_ID
supabase functions deploy process-email-queue  --project-ref YOUR_PROJECT_ID
supabase functions deploy scheduled-tasks      --project-ref YOUR_PROJECT_ID
supabase functions deploy send-2fa-code        --project-ref YOUR_PROJECT_ID
supabase functions deploy send-parent-invite   --project-ref YOUR_PROJECT_ID
supabase functions deploy send-push-notification --project-ref YOUR_PROJECT_ID
supabase functions deploy verify-2fa           --project-ref YOUR_PROJECT_ID
```

Or deploy all at once:

```bash
supabase functions deploy --project-ref YOUR_PROJECT_ID
```

Verify in Supabase dashboard → **Edge Functions** — all 7 should show as **Active**.

### 8.3 Wire up the auth email hook

This connects Supabase's auth emails (signup confirmation, password reset) to your custom templates:

1. Supabase dashboard → **Authentication** → **Hooks**
2. Click **Add hook** → **Send email**
3. Set **Hook type**: `HTTP`
4. Set **URL**: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/auth-email-hook`
5. Set **HTTP headers**: add `x-nomiro-signature` (leave value blank for now — the function verifies via the `EMAIL_WEBHOOK_SECRET` you set above)
6. Click **Save**

### 8.4 Set up the email queue cron job

The `process-email-queue` function needs to run every minute to drain the email queue:

1. Supabase dashboard → **Database** → **Extensions** → enable `pg_cron`
2. Go to **SQL Editor** and run:

```sql
select cron.schedule(
  'process-email-queue',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_service_role_key' limit 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
```

> This runs every minute and dispatches any queued emails via SMTP.

---

## Part 9 — Google Sign-In (optional)

If you want the "Sign in with Google" button to work:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → **Credentials** → **Create OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Authorised redirect URIs:
   ```
   https://xxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
5. Copy the **Client ID** and **Client Secret**
6. In Supabase dashboard → **Authentication** → **Providers** → **Google**
7. Enable it and paste your Client ID and Secret
8. Click **Save**

---

## Part 10 — Verify everything works

Run through this checklist after deployment:

```
[ ] https://nomiro.app loads the app
[ ] https://nomiro.app shows a valid HTTPS padlock (green lock)
[ ] Sign up with email creates an account
[ ] Confirmation email arrives in inbox (not spam)
[ ] Sign in works after confirming email
[ ] "Forgot password" sends a reset email
[ ] Creating a family and adding a child works
[ ] Assigning a task and marking it complete works
[ ] Push notification permission prompt appears
[ ] Push notifications arrive on device
[ ] Inviting a parent sends an invitation email
[ ] 2FA can be enabled in Security Settings
```

Test email delivery:

```bash
# Check Brevo dashboard → Logs → Email activity
# Each sent email appears here with delivery status
```

---

## Part 11 — Ongoing deployments

After the initial setup, deploying new code is just:

```bash
git add .
git commit -m "your message"
git push
```

GitHub Actions automatically builds and deploys within ~2 minutes. Watch progress in the **Actions** tab.

To update edge functions after code changes:

```bash
supabase functions deploy --project-ref YOUR_PROJECT_ID
```

---

## Part 12 — Android app (Play Store) — optional

### 12.1 Prerequisites

Install:
- [Android Studio](https://developer.android.com/studio) (latest stable)
- Accept all SDK licenses: `sdkmanager --licenses`

### 12.2 Add the Android platform

```bash
cd nomiro-code
npm install @capacitor/android @capacitor/splash-screen
npx cap add android
```

### 12.3 Build and open in Android Studio

```bash
npm run build
npx cap sync android
npx cap open android
```

### 12.4 Generate a release keystore

**Do this once. Keep this file forever — you cannot upload updates without it.**

```bash
keytool -genkey -v \
  -keystore nomiro-release.keystore \
  -alias nomiro \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

It will ask for your name, organisation, country, and two passwords. Write them all down.

Store `nomiro-release.keystore` somewhere safe (password manager, encrypted backup). Never commit it to git.

### 12.5 Build a signed AAB for Play Store

In Android Studio:
1. **Build** → **Generate Signed Bundle / APK**
2. Choose **Android App Bundle**
3. Point to your `nomiro-release.keystore`
4. Enter your passwords
5. Build type: **release**
6. Click **Finish**

The output file is at:
`android/app/build/outputs/bundle/release/app-release.aab`

### 12.6 Upload to Play Console

1. Go to [play.google.com/console](https://play.google.com/console) (one-time $25 fee)
2. Create app → **Android App** → app name: NoMiRo
3. **Release** → **Internal testing** → **Create new release**
4. Upload `app-release.aab`
5. Fill in release notes → **Review and roll out**
6. Internal testers can install within minutes

Before public release, complete:
- Store listing (description, screenshots, icon)
- Content rating questionnaire
- Privacy policy URL (required)
- Target audience declaration

### 12.7 Automated Android builds via GitHub Actions

The `android.yml` workflow builds a signed AAB automatically when you push a version tag. Add these secrets to GitHub:

| Secret | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w 0 nomiro-release.keystore` output |
| `ANDROID_KEY_ALIAS` | `nomiro` |
| `ANDROID_KEY_STORE_PASSWORD` | your keystore password |
| `ANDROID_KEY_PASSWORD` | your key password |

Then trigger a release build:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The signed `.aab` appears in **Actions** → the run → **Artifacts**.

---

## Troubleshooting

**App loads a blank page**
Check the browser console (F12). Usually a missing `VITE_SUPABASE_URL` — verify the GitHub secret is set and re-run the Actions workflow.

**"Network error" or "Failed to fetch"**
The Supabase URL is wrong, or the anon key is from a different project. Go to Supabase → Settings → API and copy the values again.

**Emails not arriving**
1. Check Brevo dashboard → Logs → Email activity
2. Check spam folder
3. Verify your sender domain is confirmed in Brevo
4. Check the edge function logs: Supabase → Edge Functions → `send-2fa-code` → Logs

**Push notifications not working**
1. Verify `VITE_VAPID_PUBLIC_KEY` in GitHub secrets matches the public key in Supabase secrets
2. Push notifications require HTTPS — they will not work on `http://`
3. Check the browser console for service worker errors

**DNS not resolving**
```bash
dig nomiro.app A           # should return 185.199.x.x
dig www.nomiro.app CNAME   # should return your-username.github.io
```
If not, wait longer or check your registrar's DNS panel for typos.

**Database migration errors**
```bash
supabase db push --dry-run   # preview without applying
supabase migration list       # see what's applied vs pending
```

---

## Summary of costs

| Service | Free tier limit | Your usage estimate |
|---|---|---|
| GitHub Pages | Unlimited | ✅ fine |
| GitHub Actions | 2 000 min/month | ✅ ~10 min/deploy |
| Supabase database | 500 MB | ✅ fine for hundreds of families |
| Supabase Auth | 50 000 MAU | ✅ fine |
| Supabase Edge Functions | 500 000 invocations/month | ✅ fine |
| Brevo email | 300 emails/day (9 000/month) | ✅ fine |
| Push notifications | Unlimited | ✅ free, open standard |

When you outgrow free tiers: Supabase Pro is $25/month (8 GB DB, unlimited MAU). Brevo Starter is €25/month (unlimited emails).
