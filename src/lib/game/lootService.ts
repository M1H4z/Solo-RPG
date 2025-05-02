import { getLootTable, LootDrop, LootResult } from '@/constants/lootTables.constants';

interface LootContext {
    enemyId: string;
    // Add other context later: playerLuck, dungeonRank, etc.
}

// Simple loot determination logic
export function determineLoot(context: LootContext): LootResult {
    const lootTable = getLootTable(context.enemyId);
    const droppedItems: LootDrop[] = [];
    let droppedGold = 0;

    if (!lootTable) {
        console.warn(`No loot table found for enemy ID: ${context.enemyId}`);
        return { droppedItems, droppedGold };
    }

    console.log(`Rolling loot for enemy: ${context.enemyId}`);

    // Iterate through each possible item in the table
    lootTable.forEach(entry => {
        // Roll against drop chance
        if (Math.random() <= entry.dropChance) {
            // Calculate quantity
            const quantity = Math.floor(Math.random() * (entry.maxQuantity - entry.minQuantity + 1)) + entry.minQuantity;

            // Special handling for gold placeholder
            if (entry.itemId === 'gold_pouch_small') { 
                droppedGold += quantity;
                console.log(` -> Dropped ${quantity} Gold`);
            } else {
                droppedItems.push({ itemId: entry.itemId, quantity });
                console.log(` -> Dropped ${quantity}x ${entry.itemId}`);
            }
        }
    });

    return { droppedItems, droppedGold };
} 