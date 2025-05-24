# Implemented Components

This document lists all the React components implemented in the Solo RPG project.

## Auth Components (`src/components/auth/`)

- `LoginForm.tsx`: Handles user login.
- `RegisterForm.tsx`: Handles user registration.

## Combat Components (`src/components/combat/`)

- `CombatInterface.tsx`: Core component for managing the turn-based combat system.
- `EnemySprite.tsx`: Displays enemy sprites and animations.
- `PlayerSprite.tsx`: Displays player hunter sprites and animations.
- `SpriteAnimator.tsx`: Helper component for sprite animations.
- `VictoryRewardsPopup.tsx`: Displays rewards after a victorious combat.

## Dungeons Components (`src/components/dungeons/`)

- `DungeonViewClientContent.tsx`: Manages the view and interactions within a dungeon room, including grid movement and event triggering. Now includes real-time player presence display.

## Game Components (`src/components/game/`)

- `CurrencyHistoryChart.tsx`: Displays a chart for currency history (likely for gold/diamonds).
- `DashboardClientContent.tsx`: Main dashboard UI, displaying hunter stats, navigation, etc. Now includes real-time player presence panel.
- `GateClientContent.tsx`: UI for the Gate Hub, allowing players to find and enter gates. Now includes real-time player presence panel.
- `InventoryClientContent.tsx`: Manages the player's inventory, item display, and equipment. Now includes real-time player presence panel.
- `ProfileClientContent.tsx`: Displays detailed hunter profile information (potentially a more detailed view than the dashboard).
- `ShopClientContent.tsx`: UI for the in-game item shop. Now includes real-time player presence panel. (Note: also listed under `src/components/shop/`)
- `SkillsClientContent.tsx`: UI for viewing, unlocking, and equipping skills.
- `StatsDisplay.tsx`: A component to display hunter statistics.

## Hunters Components (`src/components/hunters/`)

- `HunterCard.tsx`: Displays a summary card for a hunter, used in selection.
- `HunterCreatorForm.tsx`: Form for creating a new hunter.
- `HunterStatsAllocator.tsx`: UI for players to allocate stat points.
- `StatsRadarChart.tsx`: Displays hunter stats in a radar chart format.

## Inventory Components (`src/components/inventory/`)

- `EquipmentDisplay.tsx`: Shows the currently equipped items.
- `EquipmentSlot.tsx`: Represents a single slot for equipment.
- `InventoryIconSlot.tsx`: Represents a single slot in the inventory grid.
- `InventoryItemCard.tsx`: Displays detailed information about a selected inventory item.

## Layout Components (`src/components/layout/`)

- _(Currently empty, contains only `.gitkeep`)_

## Multiplayer Components (`src/components/multiplayer/`)

- `OnlinePlayersPanel.tsx`: Displays real-time list of online players with their hunter information (name, level, class, rank). Includes functionality for expanding/collapsing player list, connection status indicator, and error handling. Integrated into Dashboard, Gate, Inventory, Shop, and Dungeon pages.

## Shop Components (`src/components/shop/`)

- `ShopClientContent.tsx`: UI for the in-game item shop. Now includes real-time player presence panel. (Note: also listed under `src/components/game/`)

## Skills Components (`src/components/skills/`)

- `SkillCard.tsx`: Displays details of a single skill.
- `SkillsDisplay.tsx`: Manages the display of lists of skills (e.g., equipped, available).

## Solana Components (`src/components/solana/`)

- `WalletConnectButton.tsx`: Button to connect a Solana wallet.

## UI Components (`src/components/ui/`)

- `Badge.tsx`: UI component for displaying badges.
- `Button.tsx`: General-purpose button component.
- `Card.tsx`: Card layout component.
- `ExperienceBar.tsx`: Displays an experience bar.
- `Input.tsx`: Form input field.
- `progress.tsx`: Progress bar component.
- `RealTimeClock.tsx`: Displays the current time.
- `Select.tsx`: Dropdown select component.
- `Separator.tsx`: Visual separator line.
- `skeleton.tsx`: Skeleton loader component.
- `tooltip.tsx`: Tooltip component.

## Hooks (`src/hooks/`)

- `usePlayerPresence.ts`: Custom hook for managing real-time player presence using Supabase Realtime. Handles connection management, presence tracking, error handling, and cleanup. Provides online player list, connection status, and player count.

## Profile Page (`/profile`)

- **Profile Page (`/profile`)**: Central hub for hunter management. Displays hunter details, stat allocation, currency, transaction history, and provides full skill management (unlock, equip, unequip, filter, and view all skills). All skill-related actions are performed here; there is no separate `/skills` page.

## Skills System

- **Skills System**: All skill management (unlocking, equipping, unequipping, filtering, and viewing) is integrated into the Profile page. There is no separate skills page or route; all skill actions are accessible from the hunter's profile.

## Real-Time Multiplayer Features

- **Player Presence System**: Real-time tracking of online players across all game locations (Dashboard, Gate, Inventory, Shop, Dungeons). Shows player count, hunter details (name, level, class, rank), and connection status. Automatically updates when players join/leave or change locations.
- **Location-Based Presence**: Players are tracked by their current location in the game, allowing for location-specific player lists.
- **Connection Management**: Robust error handling and reconnection logic for real-time features.
