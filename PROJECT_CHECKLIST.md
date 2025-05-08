# 📝 Solo RPG – Prioritized Project Checklist

---

## 1. Foundation & Structure (High Priority)

- [x] **Refactor folder structure**
  - [x] Add `/solana` for blockchain logic (wallet, NFT, SPL token)
  - [x] Add `/game` for Phaser.js and game engine logic
  - [x] Add `/marketplace` for trading UI and logic
  - [x] Add `/services/blockchain` for blockchain service abstraction
  - [x] Add `/services/marketplace` for marketplace service logic
  - [x] Add `/assets` for game assets (sprites, tilemaps, audio, images)
- [x] **Clean up obsolete files** and ensure code is grouped by feature
- [x] **Update README and onboarding docs** to reflect new structure and vision

---

## 2. Blockchain Integration (High Priority)

- [x] **Integrate `@solana/wallet-adapter`** for wallet connection (Phantom, Solflare, etc.)
- [x] **Add wallet connect UI** and store wallet address in user profile (Supabase)
  - [x] UI: wallet address is only shown in the button, not below
- [ ] **Integrate `@solana/web3.js` and Metaplex** for NFT minting and management
- [ ] **Scaffold SPL token logic** (mint, transfer, balance check)
- [ ] **Update Supabase schema** for wallet addresses, NFT claims, and token balances
- [x] **Audit and confirm Solana provider setup follows best practices**
  - [x] Note: Magic Eden/extension provider warning is caused by browser extensions, not app code. Current setup is robust and production-ready for wallet connection.

---

## 3. Game Engine & Core Gameplay (High Priority)

- [ ] **Modularize and integrate Phaser.js** for dungeon navigation and combat
- [ ] **Refactor dungeon and combat logic** to use Phaser for visuals/interactions
- [ ] **Organize all game assets** in `/assets`

---

## 4. Marketplace & Tokenomics (Medium Priority)

- [ ] **Build `/marketplace` page and backend** for trading NFTs and in-game items
- [ ] **Integrate Metaplex Auction House** or custom contracts for on-chain trading
- [ ] **Add off-chain trading logic** for regular items (Supabase)
- [ ] **Implement SPL token flows** for premium currency and trading
- [ ] **Add anti-abuse mechanisms** (rate-limiting, CAPTCHA, behavioral tracking)
- [ ] **Implement dynamic pricing and drop rate logic**

---

## 5. UI/UX & Accessibility (Medium Priority)

- [ ] **Audit and improve ARIA, keyboard navigation, and mobile responsiveness**
- [ ] **Refactor UI for modularity and extensibility**

---

## 6. State Management & Hooks (Medium Priority)

- [ ] **Implement React context providers** for auth, wallet, and game state
- [ ] **Create custom hooks** for blockchain/game logic

---

## 7. Testing (Medium/Low Priority)

- [ ] **Add unit, integration, and e2e tests** for all new and existing features

---

## 8. Theming & Polish (Low Priority)

- [ ] **Implement theme support** and document usage
- [ ] **Finalize documentation** for all new features, flows, and onboarding
- [ ] **Add API docs** for new endpoints

---

# 🚦 Suggested Order of Attack

1. Foundation & Structure
2. Blockchain Integration
3. Game Engine & Core Gameplay
4. Marketplace & Tokenomics
5. UI/UX & Accessibility
6. State Management & Hooks
7. Testing
8. Theming & Polish

---

**Work top to bottom, break down big items as needed, and check off each item as you complete it!**
