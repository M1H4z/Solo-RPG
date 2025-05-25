/src
/app # Next.js App Router
/api # API routes
/auth/[...nextauth] # Auth API routes
/game/[...] # Game mechanics API endpoints
/(auth) # Authentication routes group
/login/page.tsx # Login page
/register/page.tsx # Registration page
/(game) # Game routes group - protected routes
/dashboard/page.tsx # Main dashboard
/hunters # Hunter management
/create/page.tsx # Hunter creation
/[id]/page.tsx # Hunter details/edit
/dungeons # Dungeon system
/page.tsx # Dungeon selection
/[id]/page.tsx # Active dungeon
/[id]/combat/page.tsx # Combat view

# Skills management is integrated in Profile page

/inventory/page.tsx # Inventory management  
 /shop/page.tsx # Shop
/layout.tsx # Root layout
/page.tsx # Landing page

/components # Reusable UI components
/ui # Base UI components
/Button.tsx
/Card.tsx
/Modal.tsx
/Input.tsx
/layout # Layout components
/Header.tsx
/Footer.tsx
/Sidebar.tsx
/auth # Auth-related components
/LoginForm.tsx
/RegisterForm.tsx
/hunters # Hunter-related components
/HunterCard.tsx
/HunterCreator.tsx
/StatDistribution.tsx
/dungeons # Dungeon-related components
/DungeonCard.tsx
/RoomView.tsx
/EventHandler.tsx
/combat # Combat-related components
/CombatInterface.tsx
/TurnOrder.tsx
/ActionSelector.tsx
/StatusEffects.tsx
/skills # Skill-related components
/SkillTree.tsx
/SkillCard.tsx
/inventory # Inventory-related components
/InventoryGrid.tsx
/ItemCard.tsx
/EquipmentSlots.tsx
/shop # Shop-related components
/ShopInterface.tsx
/ItemDisplay.tsx

/hooks # Custom React hooks
/useAuth.ts # Authentication hooks
/useSupabase.ts # Supabase client hook
/useCombat.ts # Combat system hooks
/useInventory.ts # Inventory management hooks
/useHunter.ts # Hunter data and actions

/lib # Library code, utilities
/supabase # Supabase client and utilities
/client.ts # Supabase client initialization
/database.types.ts # Generated Supabase types
/game # Game mechanics
/combat.ts # Combat calculations
/experience.ts # Experience/leveling
/dungeonGeneration.ts # Procedural dungeon generation
/lootTables.ts # Loot generation
/statusEffects.ts # Status effect handling
/utils # Utility functions
/formatters.ts # Data formatting utilities
/calculations.ts # Generic calculation utilities
/validators.ts # Form/data validation

/types # TypeScript type definitions
/auth.types.ts # Auth-related types
/hunter.types.ts # Hunter-related types
/item.types.ts # Item-related types
/skill.types.ts # Skill-related types
/dungeon.types.ts # Dungeon-related types
/combat.types.ts # Combat-related types
/shop.types.ts # Shop-related types

/constants # Constant values and configuration
/classes.ts # Class definitions
/skills.ts # Skill definitions
/dungeons.ts # Dungeon definitions
/items.ts # Item definitions
/monsters.ts # Monster definitions
/routes.ts # Application routes

/providers # Context providers
/AuthProvider.tsx # Authentication context
/GameStateProvider.tsx # Game state context

/services # Service layer with Server Actions
/authService.ts # Auth service and auth-related actions
/hunterService.ts # Hunter service and actions
/dungeonService.ts # Dungeon service and actions
/combatService.ts # Combat service and actions
/inventoryService.ts # Inventory service and actions
/shopService.ts # Shop service and actions
/skillService.ts # Skill service and actions

/styles # Global styles
/globals.css # Global CSS
/themes # Theme configurations
/dark.ts
/light.ts

/public # Static files
/images # Image assets
/avatars # Avatar images
/monsters # Monster images
/items # Item images
/skills # Skill icons (unused - skills integrated in profile)
/backgrounds # Background images
/sounds # Sound effects and music
/fonts # Custom fonts

/tests # Test files
/unit # Unit tests
/integration # Integration tests
/e2e # End-to-end tests

.env.local # Environment variables (local)
.env.example # Example environment variables
next.config.js # Next.js configuration
package.json # Dependencies and scripts
tsconfig.json # TypeScript configuration
tailwind.config.js # Tailwind CSS configuration (if using)
postcss.config.js # PostCSS configuration (if using)
middleware.ts # Next.js middleware (for auth protection)
supabase.ts # Supabase configuration
