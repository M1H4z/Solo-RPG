export type EquipmentSlotType =
  | "Head"
  | "Chest"
  | "Legs"
  | "Feet"
  | "Hands" // For gloves/gauntlets
  | "MainHand" // Weapon 1
  | "OffHand" // Weapon 2 / Shield
  | "Accessory1"
  | "Accessory2";

export type ItemType =
  | "Weapon"
  | "Armor"
  | "Accessory"
  | "Consumable"
  | "Material"; // Crafting, etc.

export type Rarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary"
  | "Mythical"
  | "Sovereign";

// Represents a base item definition (like in a database)
export interface BaseItem {
  id: string; // e.g., 'short-sword-01'
  name: string;
  description: string;
  type: ItemType;
  rarity: Rarity;
  icon?: string; // URL or path to item icon
  stats?: Partial<
    Record<
      | "strength"
      | "agility"
      | "perception"
      | "intelligence"
      | "vitality"
      | "attackPower"
      | "defense"
      | "hp"
      | "mp",
      number
    >
  >;
  slot?: EquipmentSlotType; // Which slot it goes into, if equippable
  stackable?: boolean;
  sellPrice?: number;
}

// Represents a specific instance of an item in a hunter's inventory
export interface InventoryItem extends BaseItem {
  inventoryId: string; // Unique ID for this *specific* instance in the inventory (e.g., UUID)
  quantity: number;
}

// Represents the equipped items
export type EquipmentSlots = Partial<
  Record<EquipmentSlotType, InventoryItem | null>
>;
