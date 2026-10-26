# Santa runbook

Everything that happens outside this repo: home-lab wiring, Cloudflare, deploys, rehearsal, wipe.

Two sites run the same image:

| Site | Service | Purpose |
|---|---|---|
| `santa.axl-lvy.fr` | `santa` | The real event. Real emails through Brevo. |
| `dev-santa.axl-lvy.fr` | `santa-dev` | Test site. `SANTA_IMPERSONATION=on`: the admin gets the 🧪 account switcher, every page shows a « site de test » banner, emails are captured (🧪 → « Emails envoyés ») instead of sent. Its own database and data key. |

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
# santa's path to both connectors and its egress (Brevo SMTP, Access certs). Only the connectors and
# santa join it, so nothing else in the stack can reach the app that holds who-drew-whom.
santa-edge:
  ipam:
    config:
      - subnet: 172.30.11.0/24
```

Re-check the subnet is unused first: `grep -ho 'subnet: 172[^ ]*' hosts/minipc/docker-compose*.yml`. Add `santa-edge` to the `networks:` of `cloudflared` and `cloudflared-v6`.

`hosts/minipc/docker-compose.apps.yml`:

```yaml
# Secret Santa (github.com/Axl-Lvy/santa). Public hostname santa.axl-lvy.fr behind Cloudflare Access
# (secretsanta-users). The app verifies the Access JWT itself. No published port.
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
    ADMIN_EMAIL: "${SANTA_ADMIN_EMAIL:-}"
    CF_ACCESS_TEAM_DOMAIN: "${SANTA_CF_ACCESS_TEAM_DOMAIN:-}"
    CF_ACCESS_AUD: "${SANTA_CF_ACCESS_AUD:-}"
    SMTP_HOST: smtp-relay.brevo.com
    SMTP_PORT: "587"
    SMTP_USER: "${SANTA_SMTP_USER:-}"
    SMTP_PASSWORD: "${SANTA_SMTP_PASSWORD:-}"
    MAIL_FROM: '"Père Noël secret" <no-reply@axl-lvy.fr>'
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

`SANTA_DATA_KEY` comes from `openssl rand -hex 32`. Set it once and never rotate it. It lives only in the mini PC `.env`, so back it up with that file: losing it loses the draw.

## 3. Cloudflare (by hand, in the dashboard)

1. Tunnel → public hostname `santa.axl-lvy.fr` → `http://santa:3000` (read-modify-write the ingress, keep the `http_status:404` catch-all last).
2. Access → application on that hostname, one Allow policy including only `secretsanta-users`. Session duration: the longest offered. If the login page can be customised, add a French header and footer. Copy the application's AUD tag into `SANTA_CF_ACCESS_AUD`.
3. Rules → Configuration Rule for `santa.axl-lvy.fr`: Email Obfuscation **Off** (the admin page lists emails; Scrape Shield would rewrite them and break hydration).
4. cf-admin: create `secretsanta-users` and one `person-*` group per participant, each in `secretsanta-users`.

Adding someone in the app's Organisation page does not grant access: step 4 must be done for them too.

## 4. Rehearsal (before the family is entered)

1. Locally: `npm run dev`, several identities via `/api/dev/as?email=…`, mails at `/api/dev/outbox`.
2. In production with throwaway participants (Axel's plus-addresses, admitted by the Access `person-axel` group), through the tunnel: live updates between two phones, a family chat digest after 2 h, the outsider page for a non-participant, then the draw, the draw email (link only), the reveal on a real phone, both anonymous threads, an idea reaching the Santa. Brevo's log must show no email triggered by an anonymous message or an idea.
3. Wipe (below), then enter the real family.

If the family already uses the pre-draw site when the draw features ship, rehearse those on a temporary second service `santa-rehearsal` (same block, own volume, hostname `santa-test.axl-lvy.fr` added as a second public hostname on the same Access application), then remove it.

## 5. Wipe

On the mini PC, from `hosts/minipc`:

```sh
docker compose -f docker-compose.yml -f docker-compose.apps.yml --profile apps stop santa
docker compose -f docker-compose.yml -f docker-compose.apps.yml --profile apps rm -f santa
docker volume rm home-lab_santa_data
docker compose -f docker-compose.yml -f docker-compose.apps.yml --profile apps up -d santa
```

## Good to know

- Anyone who hasn't visited gets a family chat digest at most every 6 hours while the chat is active, between 08:00 and 21:00. That is by design.
- Nothing in the app, the logs or the emails shows who drew whom. The draw is final: there is no redo.
