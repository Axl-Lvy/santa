# Santa

A private Secret Santa site for one family: pair-rule draw, scratch-card reveal, anonymous Santa threads, family chat, wishlists and secret ideas. Next.js + SQLite, behind Cloudflare Access on the home-lab mini PC.

Needs Node 24+ (`nvm use` reads `.nvmrc`). Run locally with `npm install && npm run playground && npm run dev` (`.env.development` acts as `axel@test.fr`; 🧪 switches identity; mails stay in the outbox). Playground seed + troll gift draw: [docs/playground.md](docs/playground.md). Deploying, rehearsing and wiping: [docs/runbook.md](docs/runbook.md).
