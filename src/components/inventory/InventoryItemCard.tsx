import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { InventoryItem } from "@/types/item.types";

interface InventoryItemCardProps {
  item: InventoryItem;
  onEquip: (inventoryId: string) => void;
  onUseItem?: (inventoryId: string) => void;
  isEquipDisabled?: boolean;
  isLoading?: boolean;
}

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({
  item,
  onEquip,
  onUseItem,
  isEquipDisabled = false,
  isLoading = false,
}) => {
  const isEquippable = !!item.slot;

  const handleEquipClick = () => {
    if (isEquippable && !isEquipDisabled && !isLoading) {
      onEquip(item.inventoryId);
    }
  };

  return (
    <Card
      className={cn(
        "flex flex-col justify-between min-h-[180px] transition-shadow hover:shadow-md",
        isLoading ? "opacity-60 cursor-wait" : "",
      )}
    >
      <CardHeader className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="mb-1 text-base leading-tight">
              {item.name}
            </CardTitle>
            <CardDescription className="text-text-muted text-xs">
              {item.type}
              {item.slot ? ` (${item.slot})` : ""}
            </CardDescription>
          </div>
          {/* Basic icon display */}
          {item.icon && (
            <div className="flex size-8 shrink-0 items-center justify-center text-2xl">
              {item.icon.includes("sword")
                ? "⚔️"
                : item.icon.includes("head")
                  ? "👑"
                  : item.icon.includes("potion")
                    ? "🧪"
                    : item.icon.includes("ear")
                      ? "👂"
                      : "📦"}
            </div>
          )}
        </div>
        <Badge variant="outline" className="mt-2 w-fit text-xs">
          {item.rarity}
        </Badge>
        {item.quantity > 1 && (
          <span className="text-primary-foreground absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold">
            {item.quantity}
          </span>
        )}
      </CardHeader>
      <CardContent className="grow p-3 text-xs text-text-secondary">
        <p className="mb-2 whitespace-normal">{item.description}</p>
        {item.stats && (
          <ul className="list-inside list-disc space-y-0.5">
            {Object.entries(item.stats).map(([stat, value]) => (
              <li key={stat}>
                <span className="font-medium capitalize text-text-primary/80">
                  {stat}:
                </span>{" "}
                +{typeof value === 'number' ? value : String(value)}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 p-2 sm:flex-row">
        {isEquippable && (
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={handleEquipClick}
            disabled={isLoading || isEquipDisabled}
            aria-label={`Equip ${item.name}`}
          >
            Equip
          </Button>
        )}
        {item.type === "Consumable" && (
          <Button
            variant="secondary"
            size="sm"
            className="w-full bg-purple-600 text-white hover:bg-purple-700"
            onClick={() => onUseItem?.(item.inventoryId)}
            disabled={isLoading}
            aria-label={`Use ${item.name}`}
          >
            Use
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
