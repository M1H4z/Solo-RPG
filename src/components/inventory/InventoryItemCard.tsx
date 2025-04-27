import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InventoryItemCardProps {
  item: InventoryItem;
  onEquip: (inventoryId: string) => void;
  isEquipDisabled?: boolean;
  isLoading?: boolean;
}

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({
  item,
  onEquip,
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
    <Card className={cn(
        "flex flex-col justify-between min-h-[180px] transition-shadow hover:shadow-md",
        isLoading ? 'opacity-60 cursor-wait' : ''
      )}>
      <CardHeader className="p-3">
         <div className="flex items-start justify-between gap-2">
            <div>
                <CardTitle className="text-base leading-tight mb-1">{item.name}</CardTitle>
                <CardDescription className="text-xs text-text-muted">{item.type}{item.slot ? ` (${item.slot})` : ''}</CardDescription>
            </div>
             {/* Basic icon display */}
            {item.icon && (
                 <div className="flex-shrink-0 w-8 h-8 text-2xl flex items-center justify-center">
                      {item.icon.includes('sword') ? '⚔️' : item.icon.includes('head') ? '👑' : item.icon.includes('potion') ? '🧪' : item.icon.includes('ear') ? '👂' : '📦'}
                 </div>
             )}
         </div>
         <Badge variant="outline" className="mt-2 text-xs w-fit">{item.rarity}</Badge> 
         {item.quantity > 1 && (
             <span className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">{item.quantity}</span>
         )}
      </CardHeader>
      <CardContent className="p-3 text-xs text-text-secondary flex-grow">
        <p className="mb-2 whitespace-normal">{item.description}</p> 
        {item.stats && (
          <ul className="list-disc list-inside space-y-0.5">
            {Object.entries(item.stats).map(([stat, value]) => (
              <li key={stat}><span className="capitalize font-medium text-text-primary/80">{stat}:</span> +{value}</li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="p-2 flex flex-col sm:flex-row gap-2">
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
        {item.type === 'Consumable' && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
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
