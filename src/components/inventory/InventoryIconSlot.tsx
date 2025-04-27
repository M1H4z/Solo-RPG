'use client';

import React from 'react';
import { InventoryItem } from '@/types/item.types';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card'; // Keep Card for consistent border/bg
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/Tooltip";
import { RarityColors, RarityGradientColors } from '../../constants/colors'; // Adjust path if needed
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface InventoryIconSlotProps {
  item: InventoryItem;
  onClick: () => void; // Callback when the slot is clicked
  isSelected: boolean; // Is this the currently selected item?
  isLoading?: boolean; // Optional loading state (e.g., during equip/use)
}

export const InventoryIconSlot: React.FC<InventoryIconSlotProps> = ({
  item,
  onClick,
  isSelected,
  isLoading = false,
}) => {
  const rarityBorderColor = RarityColors[item.rarity] || 'border-border/50';
  const rarityGradientColor = RarityGradientColors[item.rarity] || 'gray-500';
  const backgroundClass = `bg-gradient-to-br from-background/50 to-${rarityGradientColor}/10`;

  // --- DnD Setup ---
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    // Use inventoryId as the unique ID for dragging
    id: `inventory-${item.inventoryId}`,
    data: { // Pass necessary item data for the onDragEnd handler
        type: 'inventory', // Differentiate from equipment drags later
        item: item, 
    },
    disabled: isLoading, // Disable dragging if an action is loading
  });

  // Style for the dragging transform
  const style = transform ? {
    transform: CSS.Translate.toString(transform),
    zIndex: 100, // Ensure dragged item is above others
  } : undefined;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
           {/* Use Card for consistent styling and interaction surface */}
          <Card 
            className={cn(
              "relative aspect-square flex items-center justify-center text-center p-1 transition-all duration-150 ease-in-out group cursor-pointer",
              // Border based on rarity and selection state
              isSelected 
                ? `border-2 border-ring ring-2 ring-ring ring-offset-2 ring-offset-background` 
                : `border-2 ${rarityBorderColor} hover:border-primary/70`,
              backgroundClass,
              isLoading ? 'opacity-50 cursor-not-allowed' : '',
              isDragging ? 'opacity-75 shadow-lg' : ''
            )}
            onClick={onClick} // Handle click on the card itself
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()} // A11y
            role="button"
            tabIndex={isLoading ? -1 : 0}
            aria-label={`${item.name} (${item.rarity})${item.quantity > 1 ? ` x${item.quantity}` : ''}${isSelected ? ', Selected' : ''}`}
            aria-pressed={isSelected}
            aria-disabled={isLoading}
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
          >
             {/* Content: Icon or Quantity */}
             <div className="relative flex items-center justify-center w-full h-full">
                 {/* Basic icon display - TODO: Improve this */}
                 <span className="text-2xl sm:text-3xl">{item.icon?.includes('sword') ? '⚔️' : item.icon?.includes('head') ? '👑' : item.icon?.includes('potion') ? '🧪' : item.icon?.includes('ear') ? '👂' : '📦'}</span>
                
                 {/* Quantity Badge for stackable items */}
                 {item.stackable && item.quantity > 1 && (
                    <span className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-sm text-[10px] px-1 py-0 leading-none font-semibold">x{item.quantity}</span>
                 )}
             </div>
             {isLoading && (
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                    <div className="text-xs text-text-muted">...</div>
                </div>
             )}
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-xs text-sm p-3 z-50">
           {/* Tooltip Content: Item Details */}
          <div className="space-y-1.5">
            <p className="font-semibold text-base text-text-primary">{item.name}</p>
            <p className="text-xs text-text-muted">{item.type} - {item.rarity}</p>
            <p className="text-xs whitespace-normal">{item.description}</p>
            {item.stats && (
              <ul className="list-disc list-inside space-y-0.5 text-xs mt-2">
                {Object.entries(item.stats).map(([stat, value]) => (
                  <li key={stat}><span className="capitalize font-medium text-text-primary/90">{stat}:</span> +{value}</li>
                ))}
              </ul>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}; 