# Santa runbook

Everything that happens outside this repo: home-lab wiring, Cloudflare, deploys, rehearsal, wipe.

Two sites run the same image:

| Site                   | Service     | Purpose                                                                                                                                                            |
| ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `santa.axl-lvy.fr`     | `santa`     | The real event.                                                                                                                                                    |
| `dev-santa.axl-lvy.fr` | `dev-santa` | Test site. `SANTA_IMPERSONATION=on`: the admin gets the 🧪 account switcher, every page shows a « site de test » banner. Its own database, data key and admin PIN. |

Every push to `main` runs CI, publishes `ghcr.io/axl-lvy/santa:latest`, then calls the mini PC
webhook (`/hooks/deploy-santa`), which pulls the image and recreates both services. The deploy
job needs three GitHub secrets: `SANTA_DEPLOY_WEBHOOK_TOKEN`, `CF_ACCESS_CLIENT_ID`,
`CF_ACCESS_CLIENT_SECRET`. Until they exist, CI publishes the image and skips the deploy with a
warning.

## 1. Publish the image

Pushing to `main` runs `.github/workflows/image.yml`: lint, typecheck, tests, then `ghcr.io/axl-lvy/santa:latest` and `:sha-<short>`. The repo and the ghcr package are public, so the mini PC pulls without credentials. Note the digest of the pushed image (`docker buildx imagetools inspect ghcr.io/axl-lvy/santa:latest`).

## 2. Home-lab wiring (in `~/IdeaProjects/home-lab`, own branch and commit, then the usual deploy)

`hosts/minipc/docker-compose.yml`: add a network next to `amadis-edge` and put it on both connectors.

```yaml
# santa's path to both connectors. Only the connectors and santa join it, so nothing else in the
# stack can reach the app that holds who-drew-whom.
santa-edge:
  ipam:
    config:
      - subnet: 172.30.11.0/24
```

Re-check the subnet is unused first: `grep -ho 'subnet: 172[^ ]*' hosts/minipc/docker-compose*.yml`. Add `santa-edge` to the `networks:` of `cloudflared` and `cloudflared-v6`.

`hosts/minipc/docker-compose.apps.yml`:

```yaml
# Secret Santa (github.com/Axl-Lvy/santa). Public hostname santa.axl-lvy.fr, open to the internet:
# guests log in with their first name, the admin with a PIN. No published port.
santa:
  labels:
    homelab.group: santa
  image: ghcr.io/axl-lvy/santa@sha256:<digest>
  restart: unless-stopped
  environment:
    DATABASE_PATH: /data/santa.db
    APP_URL: https://santa.axl-lvy.fr
    TZ: "${TZ:-Europe/Paris}"
    SANTA_DATA_KEY: "${SANTA_DATA_KEY:-}"
    ADMIN_NAME: "${SANTA_ADMIN_NAME:-}"
    ADMIN_PIN: "${SANTA_ADMIN_PIN:-}"
  volumes:
    - santa_data:/data
  healthcheck:
    test:
      [
        "CMD",
        "node",
        "-e",
        "fetch('http://localhost:3000/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))",
      ]
    interval: 30s
    timeout: 10s
    start_period: 30s
    retries: 3
  networks: [santa-edge]
  profiles: [apps]
```

Declare `santa_data:` under the top-level `volumes:` and add the `SANTA_*` keys, empty, to `hosts/minipc/.env.example`. No `:?` guards: the app refuses to start with a clear log line when config is missing (`santa: invalid configuration: …`).

`SANTA_ADMIN_NAME` is the first name Axel types (`Axel`); `SANTA_ADMIN_PIN` is exactly 4 digits. Wrong PINs lock PIN login for 15 minutes after 5 tries, doubling each time; an open session is never affected.

**Switching from the Access + email setup** (both services crash at start without `ADMIN_NAME` and `ADMIN_PIN`, and every push to `main` redeploys them):

1. In home-lab, add `ADMIN_NAME` / `ADMIN_PIN` to both the `santa` and `dev-santa` blocks, and `SANTA_ADMIN_NAME`, `SANTA_ADMIN_PIN` (and dev-santa's own PIN) to the mini PC `.env`. Deploy. The old image ignores them.
2. Merge the first-name login to `main`; CI deploys the new image.
3. Remove `ADMIN_EMAIL`, `CF_ACCESS_*`, `SMTP_*` and `MAIL_FROM` from compose and `.env`, then do the Cloudflare clean-up below.

`SANTA_DATA_KEY` comes from `openssl rand -hex 32`. Set it once and never rotate it. It lives only in the mini PC `.env`, so back it up with that file: losing it loses the draw.

## 3. Cloudflare (by hand, in the dashboard)

1. Tunnel → public hostname `santa.axl-lvy.fr` → `http://santa:3000` (read-modify-write the ingress, keep the `http_status:404` catch-all last).
2. No Access application on `santa.axl-lvy.fr`: the app has its own first-name login. If one exists from the earlier setup, delete it once the first-name image is deployed (not before: the old image relies on it). Same for `dev-santa.axl-lvy.fr` if the test site should be public.
3. If they exist, delete the `secretsanta-users` and `person-*` groups in cf-admin, and the Email Obfuscation Configuration Rule for `santa.axl-lvy.fr` (the site no longer shows email addresses).

The deploy job's `CF_ACCESS_CLIENT_*` secrets stay: they guard the deploy webhook, not this app.

## 4. Rehearsal (before the family is entered)

1. Locally: `npm run dev`, log in as several guests by first name (Axel with PIN `0000`), or switch with the 🧪 panel.
2. In production with throwaway guests, through the tunnel: first-name login on two phones, live updates between them, an unknown name refused, a wrong admin PIN logged on Organisation, then the draw, the reveal on a real phone, both anonymous threads, an idea reaching the Santa.
3. Wipe (below), then enter the real family.

If the family already uses the pre-draw site when the draw features ship, rehearse those on a temporary second service `santa-rehearsal` (same block, own volume, hostname `santa-test.axl-lvy.fr` added as a second public hostname), then remove it.

## 5. Wipe

On the mini PC, from `hosts/minipc`:

```sh
docker compose -f docker-compose.yml -f docker-compose.apps.yml --profile apps stop santa
docker compose -f docker-compose.yml -f docker-compose.apps.yml --profile apps rm -f santa
docker volume rm home-lab_santa_data
docker compose -f docker-compose.yml -f docker-compose.apps.yml --profile apps up -d santa
```

## Good to know

- Anyone who knows a guest's first name can log in as them. That is by design: Organisation → « Connexions » lists every login with its device and IP, so an impostor shows up there.
- The app sends no email. Guests learn about the draw by opening the site.
- Anyone can lock PIN login by typing « Axel » with wrong codes. Open sessions keep working; if Axel has none left, restarting the container resets the lockout (it lives in memory).
- Don't change `SANTA_ADMIN_NAME` once Axel is a guest: the old name would then log in without the PIN.
- Nothing in the app or the logs shows who drew whom. The draw is final: there is no redo.
