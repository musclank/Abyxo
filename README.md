<!-- ABYXO project README -->

<div align="center">

  <img src="website/logo.svg" alt="ABYXO" width="220">

  # ABYXO

  **Small Creature. Deep Chaos.**

  A community-driven deep-sea universe built around a crowned octopus, internet culture, and the Base ecosystem.

  [![Live Website](https://img.shields.io/badge/Live%20Website-Visit%20ABYXO-08c7d8?style=for-the-badge)](https://abyxo.xyz/)
  [![Network](https://img.shields.io/badge/Ecosystem-Base-2454ff?style=for-the-badge)](https://www.base.org/)
  [![Hosting](https://img.shields.io/badge/Hosted%20on-Vercel-181717?style=for-the-badge&logo=github)](https://pages.github.com/)

</div>

---

## Overview

ABYXO is an independent community-led meme coin concept with a playful deep-ocean identity. At its center is a small but troublemaking abyss-blue octopus: glowing cyan eyes, a mischievous expression, and a permanent golden crown.

The project combines a distinctive visual identity with an interactive, multi-page website and a browser-based arcade experience. Its community is known as the **Abyxonauts**.

> Small Creature. Deep Chaos.

## Explore ABYXO

- **[Visit the live website](https://abyxo.xyz/)**
- [The Lore](https://abyxo.xyz/lore.html) — the creature, its world, and the story of the abyss.
- [The Signal](https://abyxo.xyz/signal.html) — transmissions and project updates.
- [Tokenomics](https://abyxo.xyz/tokenomics.html) — project token information and disclosures.
- [Roadmap](https://abyxo.xyz/roadmap.html) — planned project direction.
- [Community](https://abyxo.xyz/community.html) — meet the Abyxonauts.
- [Top Clankers](https://abyxo.xyz/clanker-top.html) — Clanker ecosystem discovery page.
- [Terminal](https://abyxo.xyz/terminal.html) — interactive ABYXO experience.

## Website features

- **Responsive interface** — layouts designed for desktop and mobile screens.
- **Distinctive visual identity** — custom logo, mascot illustrations, ocean-inspired styling, and favicon.
- **Interactive character moods** — explore different sides of the ABYXO mascot.
- **Abyss transmissions** — discover randomized messages from the creature.
- **ABYXO Arcade** — a browser mini-game featuring treasure collection, hazards, multiple levels, boss encounters, health, and an automatically firing tentacle weapon.
- **Global leaderboard integration** — account and score-ranking interface powered by Supabase when configured.
- **Audio experience** — optional website sound and in-game sound controls.
- **Page transitions** — smooth navigation effects with reduced-motion consideration.
- **Project and legal information** — lore, roadmap, tokenomics, privacy, terms, risk disclosure, and disclaimer pages.

Feature availability may depend on the current deployment and external service configuration. The global leaderboard requires a configured Supabase project; see [Leaderboard setup](website/SUPABASE_SETUP.md).

## Technology

| Area | Implementation |
| --- | --- |
| Website | HTML5 |
| Styling | CSS3 |
| Interactions and game | Vanilla JavaScript |
| Hosting and deployment | Vercel |
| Authentication and leaderboard backend | Supabase (optional configuration) |
| Ecosystem theme | Base |

The website is built as a static site. No frontend framework or build step is required for the current website structure.

## Repository structure

```text
Abyxo/
├── .github/
│   └── workflows/          # Legacy GitHub Pages workflow (not production)
├── assets/
│   ├── branding/           # Brand artwork and social banner
│   ├── logo/               # Primary logo assets
│   └── mascot/             # Mascot artwork
├── community/              # Community principles and information
├── contracts/              # Contract planning and documentation
├── docs/                   # Brand, media, roadmap, and project documents
├── supabase/
│   └── functions/          # Backend function integrations
├── website/
│   ├── index.html          # Website homepage
│   ├── lore.html           # The Lore
│   ├── signal.html         # The Signal
│   ├── tokenomics.html     # Tokenomics
│   ├── roadmap.html        # Roadmap
│   ├── community.html      # Community
│   ├── clanker-top.html    # Top Clankers
│   ├── terminal.html       # Interactive terminal
│   ├── script.js           # Website interactions and arcade game
│   ├── styles.css          # Main website styles
│   ├── leaderboard.js      # Leaderboard client integration
│   ├── site-sound.js       # Website audio controls
│   └── supabase/           # Website database schema
├── CONTRIBUTING.md
├── DISCLAIMER.md
├── SECURITY.md
└── README.md
```

## Run locally

Because this is a static website, you can run it with any local HTTP server.

1. Clone the repository:

   ```bash
   git clone https://github.com/musclank/Abyxo.git
   cd Abyxo
   ```

2. Start a local server from the repository root:

   ```bash
   python -m http.server 8000
   ```

3. Open the website directory in your browser:

   ```text
   http://localhost:8000/website/
   ```

You can also open `website/index.html` directly, although a local HTTP server is recommended for testing browser features.

## Deployment

The production website is hosted on **Vercel**, connected to this GitHub repository. The Vercel project uses `website/` as its Root Directory and deploys automatically when changes are pushed to the connected production branch.

The GitHub Pages workflow in `.github/workflows/deploy-pages.yml` is separate legacy automation and is not the production host.

Live URL: **https://abyxo.xyz/**

## Global leaderboard configuration

The leaderboard interface uses Supabase for authentication and shared score storage. To configure it:

1. Create a Supabase project.
2. Run the SQL in `website/supabase/leaderboard.sql`.
3. Configure the project URL and publishable/anon key in `website/supabase-config.js`.
4. Add `https://abyxo.xyz` (and any required callback paths) to the Supabase authentication URL settings.
5. Follow the complete [Supabase setup guide](website/SUPABASE_SETUP.md).

**Security:** Never put a Supabase `service_role` key, database password, private key, or other server secret in browser-accessible files or commit them to Git.

## Project documentation

| Document | Description |
| --- | --- |
| [Brand Guide](docs/BRAND_GUIDE.md) | Visual identity and brand direction |
| [Media Kit](docs/MEDIA_KIT.md) | Official project media assets |
| [Social Launch Kit](docs/SOCIAL_LAUNCH_KIT.md) | Community and social communication materials |
| [Roadmap](docs/ROADMAP.md) | Project roadmap draft |
| [Tokenomics](docs/TOKENOMICS.md) | Tokenomics draft and project notes |
| [Community Principles](community/README.md) | Community standards |
| [Contract Documentation](contracts/README.md) | Contract-related notes |
| [Website Guide](website/README.md) | Website-specific information |
| [Leaderboard Setup](website/SUPABASE_SETUP.md) | Supabase configuration |
| [Disclaimer](DISCLAIMER.md) | Project disclaimer |
| [Security Policy](SECURITY.md) | Responsible security reporting |
| [Contribution Guide](CONTRIBUTING.md) | How to contribute |

## Project status and transparency

ABYXO is presented as a community-driven meme coin **concept**. Project materials, tokenomics, roadmap items, and contract-related documentation may include drafts or plans that are not yet finalized.

- No token ticker, contract address, launch, audit, or deployment should be considered confirmed unless published through an official, verifiable project channel.
- A website page or draft document is not proof of a live token or deployed smart contract.
- The project does not promise financial returns or token performance.

Please review the [project disclaimer](DISCLAIMER.md) and the website's [risk disclosure](website/risk-disclosure.html) before relying on project information.

## Contributing

Contributions, feedback, and improvements are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes. Keep changes focused, test the website on mobile and desktop, and never commit credentials or private information.

## Security

If you discover a security issue, please follow the instructions in [SECURITY.md](SECURITY.md). Do not publish secrets, exploit details, or private user information in a public issue.

## Community

The ABYXO community is known as the **Abyxonauts**.

Follow only links published through verified official ABYXO channels. Be cautious of impersonators, unofficial token contracts, and unsolicited messages.

---

<div align="center">

  **ABYXO — Small Creature. Deep Chaos.**

  Made for the depths. Powered by community.

  [Website](https://abyxo.xyz/) · [GitHub Repository](https://github.com/musclank/Abyxo)

</div>
