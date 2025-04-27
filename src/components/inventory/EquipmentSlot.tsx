'use client';

import React from 'react';
import Image from 'next/image';
import { InventoryItem, EquipmentSlotType } from '@/types/item.types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { RarityColors, RarityGradientColors } from '../../constants/colors';

interface EquipmentSlotProps {
  slotType: EquipmentSlotType;
  item: InventoryItem | null | undefined;
  onUnequip: (slot: EquipmentSlotType) => void;
  isLoading?: boolean;
}

export const EquipmentSlot: React.FC<EquipmentSlotProps> = ({
  slotType,
  item,
  onUnequip,
  isLoading = false,
}) => {
  const handleUnequipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item && !isLoading) {
      onUnequip(slotType);
    }
  };

  const rarityBorderColor = item ? RarityColors[item.rarity] : 'border-border/50';
  const rarityGradientColor = item ? RarityGradientColors[item.rarity] : 'gray-500';
  const backgroundClass = item 
    ? `bg-gradient-to-br from-background/50 to-${rarityGradientColor}/10`
    : 'bg-background-secondary/30';

  let slotContent = null;
  if (isLoading) {
    slotContent = (
      <div className="flex flex-col items-center justify-center w-full h-full p-1">
        <div className="text-xs text-text-muted">...</div>
      </div>
    );
  } else if (item) {
    slotContent = (
      <div className="flex flex-col items-center justify-center gap-0 w-full h-full p-1">
        <div className="relative flex-grow flex items-center justify-center w-full mb-0.5">
          <span className="text-2xl sm:text-3xl">{item.icon?.includes('sword') ? '⚔️' : item.icon?.includes('head') ? '👑' : '🛡️'}</span>
        </div>
        <span className="text-[11px] font-medium text-text-primary leading-tight truncate w-full text-center">
          {item.name}
        </span>
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-0.5 right-0.5 h-4 w-4 p-0 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity"
          onClick={handleUnequipClick}
          aria-label={`Unequip ${item.name}`}
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </Button>
      </div>
    );
  } else {
    slotContent = (
      <div className="flex flex-col items-center justify-center w-full h-full p-1">
        <span className="text-xs text-text-disabled italic group-hover:text-text-secondary transition-colors">Empty</span>
      </div>
    );
  }

  return (
    <Card className={cn(
      "relative w-full h-full flex flex-col items-center justify-center text-center p-1 transition-colors group",
      item ? `border-2 ${rarityBorderColor}` : 'border-2 border-dashed border-border/50',
      backgroundClass,
      isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/5'
    )}>
      <CardContent className="p-0 flex flex-col items-center justify-center w-full h-full relative">
        {!item && !isLoading && (
          <span className="absolute top-1 left-1 text-[10px] font-semibold text-text-secondary opacity-50 group-hover:opacity-75 transition-opacity">
            {slotType}
          </span>
        )}
        {slotContent}
      </CardContent>
    </Card>
  );
}; 