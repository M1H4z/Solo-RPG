# Solo Leveling RPG Project Checklist

This checklist is based on the features outlined in the project's design and current implementation status.

## I. Core Systems

### 1. Account System

- [x] User Registration (Username, Email, Password, Country)
  - [x] API: `/api/auth/signup`
  - [x] Supabase Auth: User metadata (username, country)
  - [x] `users` table sync
- [x] User Login (Email, Password)
  - [x] API: `/api/auth/signin`
  - [x] Supabase Auth
- [ ] User Logout (API endpoint exists, frontend integration check)
- [ ] Email Verification (If using Supabase email confirmation - check `/auth/callback` or similar)
- [ ] Password Reset Functionality

### 2. Hunter Management

- [x] Hunter Selection Page (`/hunters`)
  - [x] Redirect after login/register
  - [x/partial] Display existing hunters (Max 2)
  - [x] Option to create a new hunter
- [x] Hunter Creation Page (`/hunters/create`)
  - [x] Navigation from hunter selection
  - [x] Max 2 hunters per account enforcement (API & Frontend)
- [x] Delete Hunter Functionality
  - [x] UI on `HunterCard`
  - [x] API: `/api/hunters/[hunterId]` DELETE
  - [x] Service: `deleteMyHunter`
- [ ] Hunter Profile/Detail Page (`/hunters/[id]`) - Currently placeholder, needs `ProfileClientContent.tsx` integration.

### 3. Hunter Creation Process

- [x] Choose from 6 Classes (Healer, Fighter, Mage, Assassin, Tanker, Ranger)
  - [x] Data: `src/constants/classes.ts`
  - [x] UI: `HunterCreatorForm`
- [x] Unique Initial Stat Distribution per Class
  - [x] Data: `src/constants/classes.ts`
  - [x] Applied by: `/api/hunters/create`
- [x] Initial 50 Stat Points (Pre-allocated by class)
- [x] Stats Definition (Strength, Agility, Perception, Intelligence, Vitality)
  - [x] Types: `Hunter`
  - [x] Logic: `src/lib/game/stats.ts`
- [x] Hunter Naming
  - [x] UI: `HunterCreatorForm`
  - [x] Saved by: `/api/hunters/create`

### 4. Dashboard (`/dashboard`)

- [x] Display Hunter Details:
  - [x] Name, Rank, Level, Class
  - [x] HP, MP, EXP, Gold, Diamonds
  - [x] Base Stats
  - [x] Derived Stats (via `calculateDerivedStats`)
  - [x] Component: `DashboardClientContent.tsx`
- [x] Stat Allocation UI (`HunterStatsAllocator` component)
  - [x] API: `/api/hunters/[hunterId]/allocate-stat`
- [x] Navigation Links:
  - [x] Enter Gate -> Gate Hub (`/gate?hunterId=...`)
  - [ ] Skills -> Skill Page (`/skills?hunterId=...`) - Page route missing, link commented out.
  - [x] Inventory -> Inventory Page (`/inventory?hunterId=...`)
  - [x] Shop -> Shop Page (`/shop?hunterId=...`)
- [x] Solana Wallet Connect Button (Functionality TBD for currency)

### 5. Dungeon System (Enter Gate)

- [x] Gate Hub (`/gate`)
  - [x] Triggered from Dashboard "Enter Gate"
  - [x] `GateClientContent.tsx`
  - [x] Locate new gate if none active (API: `/api/gate/locate`, rank-based selection)
  - [x] Display active gate details (API: `/api/gate/status`)
  - [x] Abandon gate (API: `/api/gate/abandon`)
- [x] Dungeon Instance (`/gate/[gateId]`)
  - [x] `DungeonViewClientContent.tsx`
  - [x] Fetch current room data (API: `/api/dungeons/[gateId]`)
- [ ] Dungeon Structure:
  - [x] Random depth (3-6 levels, in `active_gates`)
  - [x] Random rooms per depth (3-6 rooms, in `active_gates`)
  - [x] Player start: Depth 1, Room 1 (Handled by `DungeonViewClientContent`)
  - [ ] Grid-based movement: Needs to be dynamic based on room data (Currently static in `DungeonViewClientContent`)
  - [ ] Consider Phaser/Tiled integration for dungeon view (User's ongoing work)
- [ ] Room Events:
  - [x] Monster Encounter (Player lands on event tile, triggers `CombatInterface`)
  - [ ] Treasure Discovery (Design phase, event tile trigger)
  - [ ] Mini-boss Battle (End of depth, design phase, `isBoss` flag exists)
- [ ] Loot System:
  - [x] `lootService.ts` determines drops (`enemyId`, `lootTables.constants.ts`)
  - [x] Influenced by: Dungeon Type (via enemies), Room Type (Monster encounter done)
  - [ ] Influence by: Depth Level (Not explicitly in `lootService.ts` yet)
  - [x] Boss/Mini-boss loot (Possible via enemy ID specific loot)
  - [ ] Persist loot (items/gold) from `CombatInterface` to hunter (Call from `DungeonViewClientContent` -> API) - **CRITICAL TODO in `DungeonViewClientContent`**
- [x] Item Rarity System (Common to Sovereign)
  - [x] Definitions: `item.types.ts`, `inventory.constants.ts`
- [ ] Boss Fights:
  - [x/partial] Final room boss (Design, `isBoss` flag on `EnemyCombatEntity`)
  - [ ] Scaled stats for bosses (TBD)
- [x] Gate Rules:
  - [x] Time-limited access (`expires_at` in `active_gates`)
  - [ ] Save/resume mid-dungeon (Partially supported by `active_gates` state, needs robust handling)
  - [x] Only one gate at a time (Unique `hunter_id` in `active_gates`)
- [x] Dungeon Progression API (`PUT /api/dungeons/[gateId]/progress`)
  - [x] Updates `current_room`/`current_depth`
  - [x] Handles dungeon completion (redirect)

## III. Combat System (`CombatInterface.tsx`)

- [x] Turn-based logic (Pokémon-inspired)
- [x] 2D Sprites (Player/Enemy)
- [x] Turn order based on speed (`hunterData.speed` vs `enemyData.speed`)
- [ ] Special conditions affecting turn order (TBD)
- [x] Status Effects (Buffs/Debuffs)
  - [x] Implemented in `CombatInterface` (duration, stat application)
  - [ ] Persistence outside combat / cure items (Design phase)
- [ ] Player Death:
  - [x] HP <= 0 -> 'loss' state in `CombatInterface`
  - [ ] EXP penalty (Design - `onCombatResolved` in `DungeonViewClientContent` to handle)
  - [ ] Revive with 50% HP/MP (Design - `onCombatResolved` to handle)
- [x] Level Up Mechanics:
  - [x] EXP gain in combat
  - [x] Persistence via `/api/hunters/[hunterId]/gain-exp` (called from `DungeonViewClientContent` after combat) - **CRITICAL TODO in `DungeonViewClientContent`**
  - [x] API handles: total EXP, level recalc (`calculateLevelFromExp`), stat/skill points, next level EXP
  - [ ] Full HP/MP recovery on level up (Design - API might return new values, client needs to update hunter state)

### 6. Inventory System

- [x] Item Acquisition:
  - [x] Dungeons (Loot from `CombatInterface` via `lootService.ts`)
  - [ ] Events (Design phase)
  - [x] Shop (Implemented)
- [x] Equipment Slots (Head, Chest, Legs, Feet, Hands, Main Hand, Off Hand, Accessories x2)
  - [x] Constants: `EQUIPMENT_SLOTS_ORDER`
  - [x] UI: `EquipmentDisplay.tsx`
- [x] Inventory Features:
  - [x] Drag-and-drop equip (`InventoryClientContent.tsx` with `@dnd-kit/core`)
  - [x] Item descriptions/stats on hover/click (Item details panel, tooltips)
  - [x] Sort/filter items (`InventoryClientContent.tsx`)
  - [ ] Stack/unstack items (Manual UI TBD, `item.max_stack` exists)
  - [x] Drop item (API: `/api/hunters/[hunterId]/drop-item`)
  - [ ] Sell items (Direct sell from inventory TBD, shop interaction could cover this)
  - [x/partial] Dual-wielding ("Hands" slot for single items, "Main Hand"/"Off Hand" for separate. Specific logic for weapon types TBD)
- [ ] General Item Listing API (e.g., for an item encyclopedia) - Missing.
- [x] Consumable Item Usage API (`/api/items/use/[itemId]`)

### 7. Shop System

- [x] Currencies:
  - [x] Gold (in-game, tracked in `hunters` table)
  - [x] Diamonds (premium, tracked in `hunters` table)
  - [ ] Real money purchase for Diamonds (TBD, Solana integration?)
- [x] Shop Content:
  - [x] Common and Rare Items (API: `/api/shop/items` with `is_purchasable=true`)
  - [ ] Limited Event Gear (Design: `is_event_item` attribute exists)
  - [ ] Hybrid Skills (Future)
- [x] Item Purchase
  - [x] Supabase RPC: `purchase_item`
  - [x] API: `/api/shop/purchase`
- [ ] User Trading (Design phase)

### 8. Skills System

- [x] Leveling Up Grants Stat Points (5) and Skill Points (5)
  - [x] API: `/api/hunters/[hunterId]/gain-exp` (returns points)
  - [x] UI: `DashboardClientContent` toast, hunter table `stat_points`, `skill_points`
- [x] Skill Unlocking
  - [x] Requirements: Level, Skill Point Cost, Prerequisites
  - [x] Data: `src/constants/skills.ts`
  - [x] UI: `SkillsClientContent.tsx`
  - [x] API: `/api/hunters/[hunterId]/unlock-skill`
- [x] Skill Tree Organization (Rank E to S)
  - [x] Data: `src/constants/skills.ts`
  - [x] UI: `SkillsClientContent.tsx` (visualization, navigation)
- [x] Skill Types:
  - [x] Active Skills:
    - [x] Equip up to 4 (UI in `SkillsClientContent.tsx`, `MAX_EQUIPPED` constant)
    - [x] API: `/api/hunters/[hunterId]/equip-skill`
  - [x] Passive Skills:
    - [x] Always active once unlocked
    - [x] Effects applied in `calculateDerivedStats`
- [ ] Hybrid Skills (Shop/Events) - Design phase
- [ ] General Skill Listing API (`/api/skills`) - Missing, for skill encyclopedia perhaps.

## IV. Calculations

### 9. Damage Calculation (`src/lib/combat/damageCalculator.ts`)

- [x] Raw Damage Pool (Attacker Attack + Action Power)
- [x] Defense Mitigation (`DEFENSE_MITIGATION_BASE`)
- [x] Level Difference Scaling (Capped ±25%)
- [x] Power Divisor (`POWER_DIVISOR`)
- [x] Critical Hit (Crit Rate vs. Roll, Crit Damage multiplier)
- [x] Precision & Variance (Min damage %, random variance)
- [x] Class/Type Modifiers (`CLASS_VS_CLASS_MODIFIERS`, etc.)
- [x] Contextual Modifiers (PvP, Boss - hooks exist)
- [x] Minimum Damage (Ensures 1 damage)

### 10. EXP Calculation

- [x] Base EXP from Enemy (`enemyData.baseExpYield`)
- [x] Level Multiplier (`LEVEL_UP_EXP_MULTIPLIER` in `CombatInterface`)
- [x] Persistence: Call `/api/hunters/[hunterId]/gain-exp` from `DungeonViewClientContent` - **CRITICAL TODO**
- [x] API Handling: Updates hunter EXP, level, points.
- [ ] Modifiers:
  - [x/partial] Bonus for rare/boss kills (Can be handled by higher `baseExpYield`)
  - [ ] Party/multi-kill bonuses (Design phase)

## V. Miscellaneous & TODOs

- [ ] **Content Creation:**
  - [ ] More Enemy Types (sprites, stats, abilities, loot tables)
  - [ ] More Item Definitions (stats, effects, icons, rarity distribution)
  - [ ] More Skill Definitions for all classes up to S rank
  - [ ] Dungeon Themes and specific room layouts/events for each (e.g., Goblin Dungeon, Undead Dungeon)
  - [ ] Boss designs and unique mechanics
  - [ ] Rank Up Quests / System
- [ ] **UI/UX Refinements:**
  - [ ] Consistent styling and component usage
  - [ ] Accessibility audit (ARIA attributes, keyboard navigation)
  - [ ] Responsive design improvements
  - [ ] Tooltips and guided user experience enhancements
  - [ ] Manual item stack/unstack UI in inventory
- [ ] **Phaser/Tiled Integration for Dungeons:**
  - [ ] Evaluate user's current Phaser PoC with procedural tilemaps (`PhaserGameInstance.tsx`).
  - [ ] Determine plan for using `src/common/tiled` utilities.
  - [ ] Integrate Tiled map loading if desired.
  - [ ] Replace or augment `DungeonViewClientContent`'s grid with Phaser view.
- [ ] **Solana Integration:**
  - [ ] Define use cases (e.g., premium currency purchase, NFT items/hunters).
  - [ ] Implement actual wallet interactions beyond connect button.
  - [ ] Smart contract development if needed.
  - [ ] Marketplace functionality (`src/marketplace` and `src/services/marketplace` stubs exist).
- [ ] **Testing:**
  - [ ] Unit tests for critical functions (damage calc, EXP calc, services).
  - [ ] Integration tests for API routes.
  - [ ] End-to-end tests for user flows.
- [ ] **Documentation:**
  - [x] `solo-rpg-flow-new.mdc` (User Flow - Living Document)
  - [x] `solo-rpg-folder-structure.mdc` (Folder Structure - Living Document)
  - [x] `solo-rpg-gate-flow.mdc` (Gate Flow - Living Document)
  - [x] `docs/ImplementedComponents.md` (List of React components)
  - [x] `docs/ProjectChecklist.md` (This file)
  - [ ] API documentation (e.g., Swagger/OpenAPI or markdown)
  - [ ] Developer onboarding guide
- [ ] **Error Handling & Logging:**
  - [ ] Comprehensive error handling on frontend and backend.
  - [ ] Client-side error reporting.
  - [ ] Server-side logging for debugging.
