# Local playground

Dev-only tooling. Not used in production.

## Seed fake family

```bash
nvm use          # Node 24+ (.nvmrc)
npm run playground
npm run dev
```

Wipes `./data/dev.db` (gitignored), seeds 8 gag personas, budget €25, one pair rule.
Edit the cast in `scripts/playground-seed.ts`, re-run to reset.

Mails: no SMTP → in-memory outbox. 🧪 switcher → « Emails envoyés » or `/api/dev/outbox`.

## Troll gift inspiration

On **Idées**: banner **Trouver une idée cadeau**.

Flow (client-only, no server):

1. Pick a participant (theatre only — does not change the draw)
2. Slow pack-opening ceremony (skip available)
3. Reveal one of 20 static “worst gift” cards (`lib/troll-gifts.ts`)
4. **Prendre ça** prefills the open form (Idées: targets the picked person)

Deck shuffles without replacement, then reshuffles. Pure gag. No persistence, no mail.
