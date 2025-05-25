# Real Enemy System Implementation

This document outlines the complete task list for implementing a real enemy system to replace the current mock enemy data in the Solo RPG project.

## Phase 1: Database Schema & Migration

### 1.1 Database Schema Design

- [ ] Design `enemies` table schema

  - [ ] `id` (UUID, primary key)
  - [ ] `name` (text, enemy display name)
  - [ ] `enemy_type` (text, category like 'Humanoid', 'Undead', 'Beast', etc.)
  - [ ] `base_level` (integer, reference level for scaling)
  - [ ] `base_hp` (integer, base health points)
  - [ ] `base_attack` (integer, base attack power)
  - [ ] `base_defense` (integer, base defense)
  - [ ] `base_exp_yield` (integer, base experience reward)
  - [ ] `base_precision` (integer, base precision stat)
  - [ ] `base_evasion` (integer, base evasion stat)
  - [ ] `base_speed` (integer, base speed stat)
  - [ ] `sprite_key` (text, reference to sprite asset)
  - [ ] `is_boss_type` (boolean, can this enemy be a boss variant)
  - [ ] `description` (text, optional flavor text)
  - [ ] `created_at` (timestamp)
  - [ ] `updated_at` (timestamp)

- [ ] Design `enemy_spawn_rules` table schema

  - [ ] `id` (UUID, primary key)
  - [ ] `enemy_id` (UUID, foreign key to enemies)
  - [ ] `min_dungeon_rank` (text, minimum hunter rank - E,D,C,B,A,S)
  - [ ] `max_dungeon_rank` (text, maximum hunter rank - E,D,C,B,A,S)
  - [ ] `min_depth` (integer, minimum dungeon depth)
  - [ ] `max_depth` (integer, maximum dungeon depth)
  - [ ] `spawn_weight` (integer, relative spawn probability)
  - [ ] `dungeon_types` (text[], array of compatible dungeon types)
  - [ ] `is_boss_spawn` (boolean, for boss room spawns)
  - [ ] `created_at` (timestamp)

- [ ] Design `dungeon_enemy_pools` table schema (optional - for themed dungeons)
  - [ ] `id` (UUID, primary key)
  - [ ] `dungeon_type` (text, like 'goblin_cave', 'undead_crypt')
  - [ ] `enemy_id` (UUID, foreign key to enemies)
  - [ ] `spawn_weight` (integer, weight within this dungeon type)
  - [ ] `created_at` (timestamp)

### 1.2 Create Migration

- [ ] Create Supabase migration file

  - [ ] Include all table definitions
  - [ ] Add foreign key constraints
  - [ ] Add indexes for performance (enemy_id, dungeon_rank, depth)
  - [ ] Add RLS policies if needed

- [ ] Test migration locally
- [ ] Push migration to Supabase

## Phase 2: Core Enemy Data & Utilities

### 2.1 Enemy Type Constants

- [ ] Create `src/constants/enemies.ts`
  - [ ] Define `EnemyType` enum/union type
  - [ ] Define rank progression constants
  - [ ] Define scaling formulas constants
  - [ ] Export enemy category definitions

### 2.2 Enemy Scaling Logic

- [ ] Create `src/lib/game/enemyScaling.ts`
  - [ ] Implement level scaling function
  - [ ] Implement rank scaling function
  - [ ] Implement boss scaling function (1.5x HP, 1.2x attack, etc.)
  - [ ] Implement depth-based scaling
  - [ ] Add scaling variation/randomness (±10%)

### 2.3 Enemy Service

- [ ] Create `src/services/enemyService.ts`
  - [ ] `getEnemiesForSpawn(dungeonRank, depth, dungeonType)` function
  - [ ] `scaleEnemyToEncounter(baseEnemy, targetLevel, isBoss)` function
  - [ ] `generateEnemyCombatEntity(enemyId, encounterParams)` function
  - [ ] Error handling and validation

## Phase 3: Seed Data Creation

### 3.1 Base Enemy Definitions

- [ ] Create seed data for Rank E enemies (5-7 types)

  - [ ] Goblin Scout (basic humanoid)
  - [ ] Skeletal Warrior (undead)
  - [ ] Giant Rat (beast)
  - [ ] Cave Spider (beast)
  - [ ] Weak Slime (elemental)

- [ ] Create seed data for Rank D enemies (5-7 types)

  - [ ] Goblin Warrior (upgraded humanoid)
  - [ ] Zombie (undead)
  - [ ] Wolf (beast)
  - [ ] Stone Golem (elemental)
  - [ ] Orc Raider (humanoid)

- [ ] Create seed data for higher rank enemies (C, B, A, S)
  - [ ] Plan progression and power scaling
  - [ ] Ensure boss variants are available

### 3.2 Spawn Rules Configuration

- [ ] Define spawn rules for each enemy
  - [ ] Set appropriate rank ranges
  - [ ] Set depth restrictions
  - [ ] Configure spawn weights for balance
  - [ ] Define dungeon type compatibility

### 3.3 Seed Data Script

- [ ] Create `supabase/seeds/enemies.sql`
  - [ ] Insert base enemy data
  - [ ] Insert spawn rules
  - [ ] Insert dungeon pool associations
- [ ] Test seed data insertion

## Phase 4: API Development

### 4.1 Enemy Spawn API

- [ ] Create `/api/dungeons/[gateId]/spawn-enemy/route.ts`
  - [ ] Accept query parameters: `roomType`, `forceSpawn` (optional)
  - [ ] Fetch active gate data
  - [ ] Determine encounter parameters (depth, rank, dungeon type)
  - [ ] Query eligible enemies from database
  - [ ] Select enemy using weighted random selection
  - [ ] Apply scaling to create combat-ready entity
  - [ ] Return `EnemyCombatEntity` format
  - [ ] Handle edge cases (no eligible enemies)

### 4.2 Enemy Utilities API (optional)

- [ ] Create `/api/enemies/route.ts` (for admin/debug)
  - [ ] List all enemies with filters
  - [ ] Useful for testing and content management

### 4.3 Update Existing APIs

- [ ] Verify `lootService.ts` works with new enemy IDs
- [ ] Update any hardcoded enemy references

## Phase 5: Frontend Integration

### 5.1 Remove Mock Data

- [ ] Update `DungeonViewClientContent.tsx`
  - [ ] Remove hardcoded mock enemy creation
  - [ ] Add API call to spawn enemy endpoint
  - [ ] Handle loading state during enemy spawn
  - [ ] Handle spawn errors gracefully
  - [ ] Maintain backward compatibility during transition

### 5.2 Enemy Display Enhancements

- [ ] Update enemy sprite handling in `CombatInterface`
  - [ ] Ensure sprite_key mapping works correctly
  - [ ] Add fallback sprites for missing assets
  - [ ] Test with various enemy types

### 5.3 Combat Integration Testing

- [ ] Verify scaled enemy stats work correctly
- [ ] Test boss encounters (higher stats)
- [ ] Ensure loot system integration works
- [ ] Test EXP gain calculations

## Phase 6: Testing & Polish

### 6.1 Core Functionality Testing

- [ ] Test enemy spawning across different ranks
- [ ] Test enemy spawning across different depths
- [ ] Verify boss spawns work correctly
- [ ] Test edge cases (high depth, invalid ranks)

### 6.2 Balance Testing

- [ ] Verify enemy difficulty progression
- [ ] Test combat balance with scaled enemies
- [ ] Adjust spawn weights if needed
- [ ] Validate EXP rewards feel appropriate

### 6.3 Performance Testing

- [ ] Test database query performance
- [ ] Add caching if needed for enemy data
- [ ] Optimize spawn selection algorithm

### 6.4 Error Handling

- [ ] Test network failure scenarios
- [ ] Test invalid dungeon states
- [ ] Ensure graceful fallbacks exist

## Phase 7: Content Expansion (Future)

### 7.1 Additional Enemy Types

- [ ] Add more variety within each rank
- [ ] Create themed enemy sets
- [ ] Add special/rare enemy types

### 7.2 Enhanced Spawn Rules

- [ ] Time-based spawn variations
- [ ] Player behavior influenced spawns
- [ ] Special event enemies

### 7.3 Boss Mechanics

- [ ] Unique boss abilities
- [ ] Boss-specific loot tables
- [ ] Multi-phase boss encounters

## Implementation Notes

### Dependencies

- Phase 2 depends on Phase 1 completion
- Phase 3 can start after Phase 1 schema is ready
- Phase 4 depends on Phase 2 utilities
- Phase 5 depends on Phase 4 API completion

### Risk Mitigation

- Keep mock enemy as fallback during development
- Test thoroughly in development before production
- Implement gradual rollout (feature flag recommended)
- Monitor performance after deployment

### Success Criteria

- [ ] No more hardcoded enemy data in frontend
- [ ] Enemy variety increases dungeon replay value
- [ ] Combat balance feels appropriate for each rank
- [ ] System supports easy addition of new enemies
- [ ] Performance remains acceptable with database queries
- [ ] Loot system continues working seamlessly
