import { Check } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils";
import { OptionalsList, OptionsType } from "../customize-order";

type Props = {
  data: OptionalsList;
  changePrice: (add: boolean, value: number) => void;
};

export function SelectOptions({ data, changePrice }: Props) {
  const [selectedSize, setSelectedSize] = useState(data.options[0]?.label);
  const [selectedSizePrice, setSelectedSizePrice] = useState(
    data.options[0]?.price ?? 0,
  );
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const handleSelectSize = (option: OptionsType) => {
    if (option.label === selectedSize) return;

    changePrice(false, selectedSizePrice);
    changePrice(true, option.price);
    setSelectedSize(option.label);
    setSelectedSizePrice(option.price);
  };

  const toggleExtra = (label: string, price: number, checked: boolean) => {
    setSelectedExtras((prev) =>
      checked ? [...prev, label] : prev.filter((item) => item !== label),
    );

    changePrice(checked, price);
  };

  if (data.value === "size") {
    return (
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold tracking-tight text-[#14161A]">
            {data.label}
          </span>
          <span className="rounded-md bg-[#14161A] px-[7px] py-[1px] text-[9.5px] font-extrabold tracking-wide text-white">
            OBRIGATÓRIO
          </span>
        </div>

        <div className="mt-[7px] grid grid-cols-3 gap-1.5">
          {data.options.map((option) => {
            const isSelected = option.label === selectedSize;

            return (
              <button
                key={option.label}
                type="button"
                onClick={() => handleSelectSize(option)}
                className={cn(
                  "flex h-[50px] flex-col items-center justify-center gap-0.5 rounded-[10px] border bg-white transition-colors",
                  isSelected
                    ? "border-orange-500 bg-orange-50"
                    : "border-[#E4E6EA] hover:border-[#c9cdd4]",
                )}
              >
                <span
                  className={cn(
                    "text-[12.5px] font-bold",
                    isSelected ? "text-orange-600" : "text-[#14161A]",
                  )}
                >
                  {option.label}
                </span>
                <span
                  className={cn(
                    "text-[10.5px] font-semibold",
                    isSelected ? "text-orange-500/90" : "text-[#A2A7B0]",
                  )}
                >
                  {option.price > 0
                    ? `+ ${formatCurrency(option.price)}`
                    : "Incluso"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2.5">
        <span className="text-xs font-extrabold tracking-tight text-[#14161A]">
          {data.label}
        </span>
        <span className="whitespace-nowrap text-[10.5px] font-semibold text-[#A2A7B0]">
          Opcional
        </span>
      </div>

      <div className="mt-[7px] grid grid-cols-2 gap-1.5">
        {data.options.map((option) => {
          const isSelected = selectedExtras.includes(option.label);

          return (
            <button
              key={option.label}
              type="button"
              onClick={() => toggleExtra(option.label, option.price, !isSelected)}
              className={cn(
                "flex h-[38px] min-w-0 items-center gap-2 rounded-[9px] border bg-white px-2.5 text-left transition-colors",
                isSelected
                  ? "border-orange-500 bg-orange-50/70"
                  : "border-[#E4E6EA] hover:border-[#c9cdd4]",
              )}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border-[1.5px]",
                  isSelected
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-[#C9CDD4]",
                )}
              >
                {isSelected && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#14161A]">
                {option.label}
              </span>
              <span className="shrink-0 text-[11px] font-bold text-[#A2A7B0]">
                {option.price === 0 ? "Grátis" : `+ ${formatCurrency(option.price)}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
