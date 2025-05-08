# 🎮 Solo RPG – A Web-Based, Blockchain-Enhanced Dungeon Crawler

_Our mission: To empower solo players with true digital ownership and a living, evolving RPG world._

---

## 🌟 Executive Summary

**Solo RPG** is a next-generation, web-based role-playing game that blends the strategic depth of turn-based RPGs with the innovation of blockchain technology. Inspired by _Solo Leveling_ and _Pokémon-style_ combat, Solo RPG immerses players in procedurally generated dungeons (“Gates”), where they level up, fight monsters, and collect rare loot—some of which can be minted and traded as real Solana NFTs. Built for solo players but powered by a thriving, player-driven economy, Solo RPG redefines ownership in gaming.

---

## 🖼️ Demo / Preview

> [Live Demo / Screenshots Coming Soon!]

---

## ⚔️ Core Features

- **Web2/Web3 Seamless Onboarding**  
  Sign up with email or connect a Solana wallet for full blockchain functionality—no friction, just play.

- **Hunter Customization & Progression**  
  Choose from six unique classes, allocate stat points, and unlock powerful skills through branching trees.

- **Procedurally Generated Dungeons ("Gates")**  
  Endless replayability via dynamic, grid-based dungeons filled with traps, treasures, and bosses.

- **Turn-Based Tactical Combat**  
  Engage in deep, Pokémon-inspired combat with status effects, elemental skills, and party-style strategy.

- **Blockchain-Powered Item Ownership**  
  Mint rare loot—such as weapons, armor, and accessories—as Solana NFTs. Trade or equip them freely.

- **In-Game Economy & Marketplace**  
  Player-driven economy with on-chain NFT trading and off-chain gear markets. Participate using SPL tokens.

- **Fully Accessible, Extensible UI**  
  Keyboard-navigable, mobile-friendly, ARIA-labeled, and designed for modular growth—new classes, mechanics, and economies can be added easily. Screen reader support is a priority.

---

## 🧠 Technical Vision

**Modular. Scalable. Secure.**
Solo RPG is built from the ground up for extensibility and Web3 integration. Core systems are loosely coupled, allowing for rapid iteration, feature expansion, and cross-platform compatibility. Key infrastructure components include:

- **Frontend:** Next.js + Tailwind (React/TSX)
- **Game Engine:** Phaser.js (2D combat, tilemap grid logic)
- **Backend:** Supabase (Postgres DB, Auth, Storage, Edge Functions)
- **Blockchain:** Solana (via @solana/web3.js), Metaplex (NFTs), SPL tokens

---

## 🛠️ Technical Architecture

### 🔄 Hybrid On/Off-Chain Design

- **Off-Chain (Supabase):** Fast reads/writes for session data, inventory, and gameplay logic.
- **On-Chain (Solana):** Ownership of NFTs, premium items, and SPL token balances.
- **Sync Strategy:**
  - Mint/trade/equip triggers dual updates (Supabase + Solana).
  - Scheduled jobs and webhooks reconcile states to prevent exploits and ensure consistency.

### 🗒 Marketplace Logic

- **NFT Trading:** Integrated via [Metaplex Auction House](https://docs.metaplex.com/programs/auction-house), supporting direct listings and offers.
- **Custom Contracts (Planned):** Enable advanced mechanics such as bundle sales, escrow trading, or hybrid items (NFTs with off-chain stat boosts or effects).
- **Wallets Supported:** Phantom, Solflare, Backpack, and other Solana-compatible wallets.

### 💰 Tokenomics & Balancing Layer

To maintain a sustainable game economy:

- **Controlled Emissions:** SPL tokens are distributed via milestone rewards and dungeon progression.
- **Anti-Abuse Mechanisms:** CAPTCHA, rate-limiting, and behavioral tracking to prevent botting and farming.
- **Dynamic Balancing:** Real-time price adjustments for shop items, drop rates, and rewards based on scarcity and inflation metrics.

---

## ❓ Why Blockchain?

Blockchain enables true digital ownership, transparent trading, and a player-driven economy. Players can mint, trade, and showcase unique items as NFTs, participate in a real token economy, and enjoy a level of asset security and interoperability not possible in traditional games.

---

## 🗌 Gameplay Loop

```
1. Register/Login → (Optional) Connect Wallet
2. Create Hunter → Choose Class & Allocate Stats
3. Navigate Dashboard → Select Activity (Gate, Shop, Skills, Market)
4. Enter Gate → Explore Procedurally Generated Dungeon
5. Encounter Events → Combat, Treasure, Mini-Bosses
6. Battle in Turn-Based Combat → Use Skills, Items, Tactics
7. Defeat Boss → Earn Loot, XP, Tokens
8. Return to Dashboard → Manage Inventory, Mint NFTs, Trade
9. Repeat with New Gates, Skills, Gear, & Seasons
```

---

## 🚀 Current Status & Roadmap (May 2025)

| Phase                 | Description                                                             |
| --------------------- | ----------------------------------------------------------------------- |
| ✅ Foundation Rebuild | New project architecture, repo setup, and toolchain reconfiguration     |
| 🔨 In Development     | Hunter creation, dungeon navigation system, base turn-based combat loop |
| 📅 Coming Soon        | NFT minting system, marketplace smart contracts, skills UI              |
| 🧑‍💻 Looking For        | Collaborators in smart contracts, UI/UX, game economy design            |

---

## 🧚 Getting Started (Local Dev)

```bash
# 1. Clone the Repository
git clone https://github.com/your-username/solo-rpg.git
cd solo-rpg

# 2. Install Dependencies
npm install

# 3. Configure Environment Variables
cp .env.example .env.local
# Fill in Supabase keys, Solana RPC, etc.

# 4. Run the App
npm run dev
# Visit http://localhost:3000
```

- Ensure Supabase DB tables are set up (see `/supabase/` directory).
- Connect wallet via Phantom or Solflare for blockchain features.
- Game assets live in `/assets/` (sprites, tilesets, audio).

---

## 🤝 Contributing

We welcome all contributions!

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit and push: `git commit -m "Add feature" && git push origin`
4. Open a Pull Request

For large features, open an issue first to discuss scope. Please follow our code style, naming conventions, and branching strategy.

---

## 📄 License

This project is licensed under the **MIT License**.
See [`LICENSE`](./LICENSE) for details.

---

## 📬 Contact & Links

- GitHub Issues: [Open an issue](https://github.com/your-username/solo-rpg/issues)
- Email: [your.email@example.com](mailto:your.email@example.com)
- Twitter / Discord (optional): [Add if available]

---
