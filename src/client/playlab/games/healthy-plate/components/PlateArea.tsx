import React, { useState } from 'react';
import { FoodItem } from '../../../content/types';
import { PlateSelection } from '../../../utils/scoring';
import { FoodIcon } from '../../../components/FoodIcon';
import { CheckIcon } from '../../../components/UIIcons';

interface PlateAreaProps {
  plate: PlateSelection;
  highlightCategory?: string | null;
  onPlaceFood: (food: FoodItem, category: 'karbo' | 'protein' | 'sayur' | 'buah') => void;
  onRemoveFood: (category: 'karbo' | 'protein' | 'sayur' | 'buah') => void;
}

export const PlateArea: React.FC<PlateAreaProps> = ({
  plate,
  highlightCategory,
  onPlaceFood,
  onRemoveFood,
}) => {
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, slot: string) => {
    e.preventDefault();
    setDragOverSlot(slot);
  };

  const handleDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDrop = (e: React.DragEvent, slot: 'karbo' | 'protein' | 'sayur' | 'buah') => {
    e.preventDefault();
    setDragOverSlot(null);
    try {
      const foodData = e.dataTransfer.getData('application/json');
      if (foodData) {
        const item = JSON.parse(foodData) as FoodItem;
        onPlaceFood(item, slot);
      }
    } catch {
      // Ignore invalid drag payload
    }
  };

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[270px] rounded-full border-4 border-[#173d31] bg-white p-2.5 shadow-[3px_5px_0_#173d31] select-none my-1">
      <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-1.5 overflow-hidden rounded-full">
        {/* 1. Makanan Pokok (Karbohidrat) - Top Left */}
        <div
          onDragOver={(e) => handleDragOver(e, 'karbo')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'karbo')}
          onClick={() => plate.karbo && onRemoveFood('karbo')}
          className={`flex flex-col items-center justify-center rounded-tl-full border-2 p-1 text-center cursor-pointer transition active:scale-95 ${
            dragOverSlot === 'karbo'
              ? 'bg-[#fde68a] border-[#d97706] scale-105'
              : highlightCategory === 'karbo'
              ? 'bg-[#fef3c7] border-[#f59e0b] ring-2 ring-[#f59e0b]/50'
              : 'bg-[#fef3c7] border-[#f59e0b]'
          }`}
        >
          <FoodIcon iconId={plate.karbo ? (plate.karbo.iconId || plate.karbo.id) : 'karbo'} className="w-8 h-8" />
          <span className="text-[11px] font-black text-[#92400e] truncate w-full px-1">
            {plate.karbo ? plate.karbo.name : 'Karbohidrat'}
          </span>
          {plate.karbo ? (
            <span className="flex items-center gap-0.5 text-[9px] text-[#15803d] font-bold">
              <CheckIcon className="w-2.5 h-2.5" />
            </span>
          ) : (
            <span className="text-[8px] text-[#92400e]/60">1/3 piring</span>
          )}
        </div>

        {/* 2. Sayuran - Top Right */}
        <div
          onDragOver={(e) => handleDragOver(e, 'sayur')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'sayur')}
          onClick={() => plate.sayur && onRemoveFood('sayur')}
          className={`flex flex-col items-center justify-center rounded-tr-full border-2 p-1 text-center cursor-pointer transition active:scale-95 ${
            dragOverSlot === 'sayur'
              ? 'bg-[#bbf7d0] border-[#15803d] scale-105'
              : highlightCategory === 'sayur'
              ? 'bg-[#dcfce7] border-[#16a34a] ring-2 ring-[#16a34a]/50'
              : 'bg-[#dcfce7] border-[#16a34a]'
          }`}
        >
          <FoodIcon iconId={plate.sayur ? (plate.sayur.iconId || plate.sayur.id) : 'sayur'} className="w-8 h-8" />
          <span className="text-[11px] font-black text-[#166534] truncate w-full px-1">
            {plate.sayur ? plate.sayur.name : 'Sayuran'}
          </span>
          {plate.sayur ? (
            <span className="flex items-center gap-0.5 text-[9px] text-[#15803d] font-bold">
              <CheckIcon className="w-2.5 h-2.5" />
            </span>
          ) : (
            <span className="text-[8px] text-[#166534]/60">1/3 piring</span>
          )}
        </div>

        {/* 3. Lauk Pauk (Protein) - Bottom Left */}
        <div
          onDragOver={(e) => handleDragOver(e, 'protein')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'protein')}
          onClick={() => plate.protein && onRemoveFood('protein')}
          className={`flex flex-col items-center justify-center rounded-bl-full border-2 p-1 text-center cursor-pointer transition active:scale-95 ${
            dragOverSlot === 'protein'
              ? 'bg-[#bfdbfe] border-[#1d4ed8] scale-105'
              : highlightCategory === 'protein'
              ? 'bg-[#dbeafe] border-[#2563eb] ring-2 ring-[#2563eb]/50'
              : 'bg-[#dbeafe] border-[#2563eb]'
          }`}
        >
          <FoodIcon iconId={plate.protein ? (plate.protein.iconId || plate.protein.id) : 'protein'} className="w-8 h-8" />
          <span className="text-[11px] font-black text-[#1e40af] truncate w-full px-1">
            {plate.protein ? plate.protein.name : 'Protein'}
          </span>
          {plate.protein ? (
            <span className="flex items-center gap-0.5 text-[9px] text-[#15803d] font-bold">
              <CheckIcon className="w-2.5 h-2.5" />
            </span>
          ) : (
            <span className="text-[8px] text-[#1e40af]/60">1/6 piring</span>
          )}
        </div>

        {/* 4. Buah-buahan - Bottom Right */}
        <div
          onDragOver={(e) => handleDragOver(e, 'buah')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'buah')}
          onClick={() => plate.buah && onRemoveFood('buah')}
          className={`flex flex-col items-center justify-center rounded-br-full border-2 p-1 text-center cursor-pointer transition active:scale-95 ${
            dragOverSlot === 'buah'
              ? 'bg-[#fed7aa] border-[#c2410c] scale-105'
              : highlightCategory === 'buah'
              ? 'bg-[#ffedd5] border-[#ea580c] ring-2 ring-[#ea580c]/50'
              : 'bg-[#ffedd5] border-[#ea580c]'
          }`}
        >
          <FoodIcon iconId={plate.buah ? (plate.buah.iconId || plate.buah.id) : 'buah'} className="w-8 h-8" />
          <span className="text-[11px] font-black text-[#9a3412] truncate w-full px-1">
            {plate.buah ? plate.buah.name : 'Buah'}
          </span>
          {plate.buah ? (
            <span className="flex items-center gap-0.5 text-[9px] text-[#15803d] font-bold">
              <CheckIcon className="w-2.5 h-2.5" />
            </span>
          ) : (
            <span className="text-[8px] text-[#9a3412]/60">1/6 piring</span>
          )}
        </div>
      </div>

      {/* Center Label Badge */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#173d31] bg-white px-2 py-0.5 text-[9px] font-black shadow-sm">
        Isi Piringku
      </div>
    </div>
  );
};
