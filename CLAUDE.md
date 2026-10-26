# CLAUDE.md

Private Secret Santa site for 8 people, hosted on the home-lab mini PC behind Cloudflare Access.

- Stack and hosting decisions: `docs/superpowers/specs/2026-10-26-stack-design.md`. Treat them as
  settled; the app behaviour is still open.
- Infra lives in `~/IdeaProjects/home-lab` (tunnel, Access, cf-admin, compose). This repo only
  ships the app image.
- Commits: Conventional Commits. GitHub account `Axl-Lvy` over SSH.
