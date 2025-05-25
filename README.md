# Solo RPG

A web-based RPG inspired by Solo Leveling, featuring turn-based combat, blockchain-powered NFTs, and a player-driven marketplace. Built with Next.js, TypeScript, TailwindCSS, Supabase, Solana, and Phaser.js.

---

## 🚀 Project Vision

Solo RPG is a modern, solo-friendly RPG that blends classic dungeon-crawling, Pokémon-style combat, and deep character progression with true digital ownership via blockchain. Players can mint, trade, and own in-game assets as NFTs on Solana, and participate in a player-driven economy.

---

## ✨ Features

- **Solana wallet integration** (Phantom, Solflare, etc.)
- **NFT minting and trading** for weapons, armor, and accessories
- **Marketplace** for in-game and on-chain assets
- **SPL tokenomics** for premium currency and trading
- **Phaser.js game engine** for dungeons and combat
- **Modular, feature-based code structure** for easy scaling
- **Supabase backend** for authentication, data, and storage
- **Accessible, responsive UI** with TailwindCSS

---

## 📁 Folder Structure

```
/src
  /app/
    /api/                  # API route handlers (backend)
    /(auth)/               # Auth pages (login, register)
    /(game)/               # Main game pages (dashboard, dungeons, shop, etc.)
    /marketplace/          # Marketplace UI
    /solana/               # Solana wallet, NFT, token UI
    /game/                 # Game engine entry (Phaser.js, etc.)
  /components/
    /auth/
    /combat/
    /dungeons/
    /game/
    /hunters/
    /inventory/
    /layout/
    /marketplace/
    /shop/
    /skills/              # Skills integrated in profile
    /solana/
    /ui/
  /constants/
  /hooks/
  /lib/
    /game/
    /supabase/
    /utils/
  /providers/
  /services/
    /blockchain/
    /marketplace/
  /styles/
  /types/
  /assets/                 # Sprites, tilemaps, audio, images
```

---

## 🏁 Getting Started

1. **Clone the repo:**
   ```bash
   git clone https://github.com/your-username/solo-rpg.git
   cd solo-rpg
   ```
2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env.local` and fill in Supabase and Solana credentials.
4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
5. **Open [http://localhost:3000](http://localhost:3000)** to view the app.

---

## 🤝 Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Commit and push (`git commit -m 'Add feature' && git push origin feature/your-feature`)
5. Open a pull request describing your changes

Please follow the code style and structure guidelines. For major changes, open an issue first to discuss your ideas.

---

## 📚 Documentation

- [Project Description](./PROJECT_DESCRIPTION_FINAL.md)
- [Project Checklist](./docs/ProjectChecklist.mdProjectChecklist.md)

---

## 📄 License

This project is licensed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.
