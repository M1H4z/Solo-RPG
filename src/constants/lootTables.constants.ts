// Assuming ItemId is a string type for now. Import from actual items constants later.
type ItemId = string;
// import { ItemId } from './items.constants'; 

export type LootDrop = {
    itemId: ItemId;
    quantity: number;
};

export type LootResult = {
    droppedItems: LootDrop[];
    droppedGold: number;
};

interface LootTableEntry {
    itemId: ItemId;
    dropChance: number; // 0.0 to 1.0
    minQuantity: number;
    maxQuantity: number;
}

// Example loot table structure - can be expanded greatly
const LOOT_TABLES: Record<string, LootTableEntry[]> = {
    // Enemy ID or type as key
    'goblin-scout': [
        { itemId: 'gold_pouch_small', dropChance: 0.8, minQuantity: 5, maxQuantity: 20 }, // Represents gold
        { itemId: 'hp-potion-small', dropChance: 0.3, minQuantity: 1, maxQuantity: 2 },
        { itemId: 'goblin-ear', dropChance: 0.5, minQuantity: 1, maxQuantity: 1 },
        { itemId: 'rusty-sword', dropChance: 0.05, minQuantity: 1, maxQuantity: 1 },
    ],
    // Add other enemies/tables here...
};

export function getLootTable(enemyId: string): LootTableEntry[] | undefined {
    return LOOT_TABLES[enemyId];
} 