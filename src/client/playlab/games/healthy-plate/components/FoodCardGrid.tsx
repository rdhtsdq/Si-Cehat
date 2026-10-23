import React from 'react';
import { FoodItem } from '../../../content/types';
import { FoodIcon } from '../../../components/FoodIcon';

interface FoodCardGridProps {
  foods: FoodItem[];
  onSelectFood: (food: FoodItem) => void;
}

export const FoodCardGrid: React.FC<FoodCardGridProps> = ({
  foods,
  onSelectFood,
}) => {
  const handleDragStart = (e: React.DragEvent, food: FoodItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(food));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-full max-w-md mx-auto mt-2">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-[#285648]">
          Pilihan Makanan
        </span>
        <span className="text-[10px] font-bold text-[#285648]/60">
          Ketuk atau tarik
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {foods.map((food) => (
          <button
            key={food.id}
            draggable
            onDragStart={(e) => handleDragStart(e, food)}
            onClick={() => onSelectFood(food)}
            className="game-card flex flex-col items-center justify-center rounded-xl p-2 text-center cursor-pointer touch-target transition"
            style={{ backgroundColor: food.color }}
            aria-label={`Pilih ${food.name}`}
          >
            <FoodIcon iconId={food.iconId || food.id} className="w-9 h-9" />
            <span className="mt-1 text-[11px] font-black text-[#173d31] truncate w-full">
              {food.name}
            </span>
            <span className="text-[9px] font-bold opacity-75 capitalize">
              {food.category === 'distractor' ? 'Camilan' : food.category}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
