# Solo RPG Project - Comprehensive Checklist

This checklist tracks the overall project status, prioritizing foundational work, core gameplay, blockchain integration, and future enhancements.

---

## 1. Foundation & Structure (High Priority)

- [x] **Refactor and Finalize Folder Structure**
  - [x] Ensure `/src/app` for Next.js routing and API
  - [x] Ensure `/src/components` for UI components (auth, combat, game, hunters, inventory, ui, etc.)
  - [x] Ensure `/src/constants` for game data (classes, skills, items)
  - [x] Ensure `/src/lib` for core logic (combat, game utils, Supabase, stats)
  - [x] Ensure `/src/services` for backend service abstractions
  - [x] Add `/src/solana` for blockchain logic (wallet provider)
  - [ ] Consider `/src/game` for future Phaser.js or game engine logic (currently empty)
  - [ ] Consider `/src/marketplace` for future trading UI and logic
  - [x] Ensure `/src/assets` for static game assets (sprites, images - currently in `/public`)
  - [x] Ensure `supabase/` for migrations and schema
- [x] **Core Technical Setup**
  - [x] Next.js Project Setup
  - [x] TypeScript Integration
  - [x] Supabase Integration (Client & Server)
  - [x] TailwindCSS for Styling
  - [x] Shadcn/ui for UI Components (Button, Card, Input, Select, etc.)
  - [x] ESLint and Prettier for Code Quality
  - [x] Database Schema Design (Initial - `database.types.ts` generated)
  - [x] Environment Variable Management (`.env`)
- [x] **Clean up obsolete files** and ensure code is grouped by feature
- [x] **Update README and onboarding docs** to reflect current structure and vision (Partially done, can always be improved)

---

## 2. Blockchain Integration (High Priority)

- [x] **Integrate `@solana/wallet-adapter`** for wallet connection
  - [x] Wallet Connection Setup (`@/solana/WalletProvider.tsx`)
  - [x] Wallet Connect Button (`WalletConnectButton.tsx`) on Dashboard
- [x] **Add wallet connect UI** and basic display
  - [x] UI: wallet address is only shown in the button
  - [ ] Store wallet address in user profile (Supabase) - (Design: Needs schema update and API)
- [ ] **Integrate `@solana/web3.js` and Metaplex** for NFT minting and management (Future)
- [ ] **Scaffold SPL token logic** (mint, transfer, balance check) (Future)
  - [ ] Relates to Diamond (premium currency) for potential on-chain representation
- [ ] **Update Supabase schema** for wallet addresses, NFT claims, and token balances (Future)
- [x] **Audit and confirm Solana provider setup follows best practices**
  - [x] Note: Magic Eden/extension provider warning is caused by browser extensions, not app code. Current setup for wallet connection is robust.
- [ ] **Define NFT Metadata Standards** (For consistency of minted items)
- [ ] **Implement On-Chain/Off-Chain Data Synchronization Strategy**
  - [ ] Design mint/trade/equip triggers for dual updates (Supabase + Solana)
  - [ ] Plan scheduled jobs/webhooks for state reconciliation

---

## 3. Game Engine & Core Gameplay (High Priority)

- [ ] **Modularize and integrate Phaser.js** for dungeon navigation and combat (Future - currently using React components)
- [ ] **Refactor dungeon and combat logic** to use Phaser for visuals/interactions (Future)
- [x] **Organize all game assets** (Currently in `/public`, consider centralizing in `/src/assets`)

  ***

  ### 3.1. User Flow & Account Management

  - **Account System**
    - [x] User Registration (Username, Email, Password, Country)
      - [x] API Endpoint (`/api/auth/signup`) & Frontend (`RegisterForm.tsx`)
    - [x] User Login (Email, Password)
      - [x] API Endpoint (`/api/auth/signin`) & Frontend (`LoginForm.tsx`)
    - [x] User Signout (`/api/auth/signout`)
    - [x] Route Protection (Middleware for `/(game)` routes)
    - [ ] Email Verification (Callback route `/api/auth/callback` seems to be missing/placeholder)
    - [ ] Password Reset Functionality
  - **Hunter Management**
    - [x] Redirection to Hunter Selection (`/hunters`) after Auth
    - [x] Hunter Selection Page (`HunterSelectionPage.tsx`, `HunterCard.tsx`, `/api/hunters`)
    - [x] Hunter Creation Page (`CreateHunterPage.tsx`, `/api/hunters/create`)
    - [x] Max 2 Hunters Per Account (Enforced)
    - [x] Hunter Deletion (UI on `HunterCard.tsx`, API `/api/hunters/[hunterId]` DELETE)
  - **Hunter Creation Details**
    - [x] 6 Classes with Unique Initial Stats (`src/constants/classes.ts`, `HunterCreatorForm.tsx`)
    - [x] Core Stats Defined (Strength, Agility, Perception, Intelligence, Vitality)
    - [x] Hunter Naming
  - **Dashboard (`/dashboard`)**
    - [x] Display Hunter Details (`DashboardClientContent.tsx`, `calculateDerivedStats`)
    - [x] Stat Allocation UI (`HunterStatsAllocator.tsx`)
    - [x] Navigation: Gate Hub, Inventory, Shop
    - [ ] Skills Page Navigation (Component `SkillsClientContent.tsx` exists, route `/skills` missing)
    - [ ] Hunter Profile Page (`/hunters/[id]`) (Placeholder, `ProfileClientContent.tsx` exists)

  ***

  ### 3.2. Skills System

  - [x] Leveling Up Grants Stat (5) & Skill Points (5) (`/api/hunters/[hunterId]/gain-exp`)
  - [x] Skill Unlocking (Level, Cost, Prerequisites) (`SkillsClientContent.tsx`, `/api/hunters/[hunterId]/unlock-skill`, `src/constants/skills.ts`)
  - [x] Skill Organization (Rank-based Tree E-S)
  - [x] Active Skills (Equip up to 4, `/api/hunters/[hunterId]/equip-skill`)
  - [x] Passive Skills (Effects in `calculateDerivedStats`)
  - [ ] Hybrid Skills (Shop/Events) (Design Phase)
  - [ ] API for general skill listing (`/api/skills` missing/placeholder)

  ***

  ### 3.3. Inventory System

  - [x] Item Acquisition (Dungeons via `lootService.ts`, Shop)
  - [ ] Item Acquisition from Events (Design Phase)
  - [x] Equipment Slots & UI (`EquipmentDisplay.tsx`)
  - [x] Drag-and-Drop Equip (`InventoryClientContent.tsx`)
  - [x] Item Details on Hover/Click
  - [x] Sort/Filter Items
  - [ ] Stack/Unstack Items (Manual UI TBD, `max_stack` exists)
  - [x] Drop Item (`/api/hunters/[hunterId]/drop-item`)
  - [ ] Sell Items (Not explicit, could be shop/inventory action)
  - [x] Dual-Wielding Support
  - [x] Item Rarity System

  ***

  ### 3.4. Shop System

  - [x] Dual Currencies (Gold, Diamonds - tracked in `hunters` table)
  - [ ] Real Money Purchase for Diamonds (TBD, Solana integration planned under Blockchain)
  - [x] Shop Content (Common/Rare Items via `/api/shop/items`)
  - [ ] Limited Event Gear (Attribute `is_event_item` exists, filter TBD)
  - [ ] Hybrid Skills in Shop (Future)
  - [x] Item Purchase (`purchase_item` RPC, `/api/shop/purchase` API)
  - [ ] User Trading (Design Phase - see Marketplace section)

  ***

  ### 3.5. Dungeon System (Enter Gate)

  - [x] Gate Entry Flow (`GateClientContent.tsx`, `/api/gate/*` routes)
  - [x] Dungeon Generation (Random by rank, depth, rooms - `/api/gate/locate`)
  - [ ] Specific Themed Dungeons (Content Creation Phase)
  - [x] Dungeon Structure (Grid Movement in `DungeonViewClientContent`)
  - [ ] Dynamic Grid Size (Currently static)
  - [x] Room Events: Monster Encounter (`CombatInterface`)
  - [ ] Room Events: Treasure Discovery, Mini-boss (Design Phase)
  - [x] Loot System (`lootService.ts`)
  - [ ] Loot Persistence from `CombatInterface` to hunter (Needs robust API call from `DungeonViewClientContent`)
  - [ ] Boss Fights: Final Room Boss, Scaled to Player (Design Phase)
  - [x] Gate Rules: Time-Limited, One Active Gate
  - [ ] Save/Resume Mid-Dungeon (Partially supported, explicit save TBD)
  - [x] Dungeon Progression API (`/api/dungeons/[gateId]/progress` or `/api/gate/[gateId]/progress`)

  ***

  ### 3.6. Combat System

  - [x] Turn-Based System (`CombatInterface.tsx`, Pokémon-inspired)
  - [x] 2D Sprites (`PlayerSprite.tsx`, `EnemySprite.tsx`)
  - [x] Turn Order (Speed-based)
  - [ ] Special Conditions Affecting Turn Order (TBD)
  - [x] Status Effects (Buffs/Debuffs in `CombatInterface`)
  - [ ] Status Effect Persistence Outside Dungeons (Design Phase)
  - [ ] Cure Items for Status Effects (Design Phase)
  - [x] Death Mechanics (HP <= 0 -> 'loss' state)
  - [ ] EXP Penalty on Death & Revive Logic (Design - `onCombatResolved` handling)
  - [x] Level Up Mechanics (`/api/hunters/[hunterId]/gain-exp`, stat/skill points)
  - [ ] Full HP/MP Recovery on Level Up (Design - API to confirm, client to update)

  ***

  ### 3.7. Game Calculations

  - [x] Damage Calculation (`src/lib/combat/damageCalculator.ts` - comprehensive)
  - [x] EXP Calculation (`CombatInterface.tsx` & API)
  - [ ] EXP Modifiers: Rare/Boss Kills, Party Bonuses (Design Phase, can use `baseExpYield`)

---

## 4. Marketplace & Tokenomics (Medium Priority)

- [ ] **Build `/marketplace` page and backend** for trading NFTs and in-game items (Future)
- [ ] **Integrate Metaplex Auction House** or custom contracts for on-chain trading (Future)
  - [ ] Metaplex Auction House for direct listings/offers
  - [ ] Design custom contracts for advanced mechanics (bundle sales, escrow, hybrid items)
- [ ] **Add off-chain trading logic** for regular items (Supabase) (Future)
- [ ] **Implement SPL token flows** for premium currency (Diamonds) and trading (Future)
  - [ ] Define SPL token distribution mechanisms (milestone rewards, dungeon progression)
- [ ] **Add anti-abuse mechanisms** (rate-limiting, CAPTCHA, behavioral tracking) (Future)
- [ ] **Implement dynamic pricing and drop rate logic** (Future, for shop/loot)

---

## 5. UI/UX & Accessibility (Medium Priority)

- [ ] **Audit and improve ARIA, keyboard navigation, and mobile responsiveness** (Ongoing)
  - [ ] Mobile Responsiveness (Thorough pass needed)
  - [ ] Accessibility (A11y) Audit and Improvements (Ongoing)
    - [ ] Prioritize Screen Reader Support
- [ ] **Refactor UI for modularity and extensibility** (Ongoing, component-based approach is good)

---

## 6. State Management & Hooks (Medium Priority)

- [x] **Basic React state and props** used extensively.
- [x] **React context providers** for Solana Wallet (`SolanaWalletContextProvider`).
- [ ] Consider global state management (Zustand, Redux Toolkit) if complexity grows.
- [ ] **Create custom hooks** for reusable blockchain/game logic (e.g., `useHunterData`, `useActiveGate`).

---

## 7. Testing (Medium/Low Priority)

- [ ] **Add unit tests** (Jest, React Testing Library) for critical components and utils.
- [ ] **Add integration tests** for user flows.
- [ ] **Add e2e tests** (Cypress, Playwright) for major features.

---

## 8. Theming & Polish (Low Priority)

- [ ] **Implement theme support** (Dark/Light mode beyond current Tailwind setup) (Future)
- [x] **Finalize documentation** (This checklist, flow docs, component list are good starts)
  - [ ] Add API docs for new/all endpoints (Swagger/OpenAPI?)
- [ ] **Sound Effects & Music** (Future)
- [ ] **Extensive Game Balancing and Testing** (Ongoing, crucial post-feature complete)

---

## 9. Other Future/Design Phase Features

_(These are items from the detailed feature list not yet started or in early design)_

- [ ] Party System
- [ ] PvP System
- [ ] Guild System
- [ ] Advanced Crafting System
- [ ] Achievements System
- [ ] Daily Quests / Challenges
- [ ] Storyline / Main Quests
- [ ] NPC Interactions & Quests
- [ ] World Map / Multiple Regions
- [ ] Mounts / Pets
- [ ] Admin Panel / Game Master Tools
- [ ] Seasonal Content / Updates

---

**Work top to bottom based on priority, break down big items as needed, and check off each item as you complete it!**
