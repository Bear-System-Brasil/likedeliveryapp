import { ArrowDown, ArrowUp } from 'lucide-react';
import React from 'react';

export type CardState = 'increasing' | 'decreasing';
export type CardType = 'default' | 'moneyType';

export interface CardProps {
  title: string;
  icon: React.ReactNode;
  midValue: number | string;
  bottomValue: string;
  bottomColor: string;
  cardState: CardState;
  cardType: CardType;
}

export default function ManagementCard({ title, icon, midValue, bottomValue, bottomColor, cardState, cardType }: CardProps) {

  const formattedValue = typeof midValue === 'number' && cardType === 'moneyType'
    ? midValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : midValue;

  return (
    <div className="h-28 w-56 bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="p-3 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <p className="text-gray-500 font-medium">{title}</p>
          <div className="text-gray-500">{icon}</div>
        </div>

        <div>
          <div className="flex text-xl font-bold">
            {cardType === 'moneyType' && <span>R$ </span>}
            <span>{formattedValue}</span>
          </div>
          <div className="flex items-center text-sm gap-1">
            {cardState === 'increasing' && <ArrowUp className="w-4 h-4 text-green-500" />}
            {cardState === 'decreasing' && <ArrowDown className="w-4 h-4 text-red-500" />}
            <span className={bottomColor}>{bottomValue}</span>
          </div>
        </div>
      </div>
    </div>
  );
};