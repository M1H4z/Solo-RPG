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

- `DungeonViewClientContent.tsx`: Manages the view and interactions within a dungeon room, including grid movement and event triggering.

## Game Components (`src/components/game/`)

- `CurrencyHistoryChart.tsx`: Displays a chart for currency history (likely for gold/diamonds).
- `DashboardClientContent.tsx`: Main dashboard UI, displaying hunter stats, navigation, etc.
- `GateClientContent.tsx`: UI for the Gate Hub, allowing players to find and enter gates.
- `InventoryClientContent.tsx`: Manages the player's inventory, item display, and equipment.
- `ProfileClientContent.tsx`: Displays detailed hunter profile information (potentially a more detailed view than the dashboard).
- `ShopClientContent.tsx`: UI for the in-game item shop. (Note: also listed under `src/components/shop/`)
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

## Shop Components (`src/components/shop/`)

- `ShopClientContent.tsx`: UI for the in-game item shop. (Note: also listed under `src/components/game/`)

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
