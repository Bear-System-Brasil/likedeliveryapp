"use client";

import { cn } from "@/lib/utils";
import {
  PERIOD_LABELS,
  type CustomRange,
  type DashboardPeriod,
} from "@/services/financial-dashboard";

const ORDER: DashboardPeriod[] = [
  "today",
  "7d",
  "month",
  "previous-month",
  "custom",
];

const dateInputClass =
  "h-8 rounded-[8px] border border-[#E9EAEE] bg-white px-2 text-[12px] font-semibold text-[#14161A] outline-none";

/** Alimenta todas as consultas do painel — trocar aqui refaz as quatro faixas. */
export function PeriodSelector({
  period,
  onPeriodChange,
  customRange,
  onCustomRangeChange,
}: {
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  customRange: CustomRange;
  onCustomRangeChange: (range: CustomRange) => void;
}) {
  const incompleteCustom =
    period === "custom" && (!customRange.from || !customRange.to);
  const invertedCustom =
    period === "custom" &&
    !!customRange.from &&
    !!customRange.to &&
    customRange.from > customRange.to;

  return (
    <div className="mb-3.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {ORDER.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onPeriodChange(option)}
            aria-pressed={period === option}
            className={cn(
              "h-8 cursor-pointer rounded-[8px] px-3 text-[12px] font-bold transition-colors",
              period === option
                ? "bg-[#14161A] text-white"
                : "border border-[#E9EAEE] bg-white text-[#3D4149] hover:bg-[#F4F5F7]",
            )}
          >
            {PERIOD_LABELS[option]}
          </button>
        ))}

        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-1.5">
            <input
              type="date"
              aria-label="Data inicial"
              value={customRange.from}
              onChange={(e) =>
                onCustomRangeChange({ ...customRange, from: e.target.value })
              }
              className={dateInputClass}
            />
            <span className="text-[12px] font-semibold text-[#A2A7B0]">até</span>
            <input
              type="date"
              aria-label="Data final"
              value={customRange.to}
              onChange={(e) =>
                onCustomRangeChange({ ...customRange, to: e.target.value })
              }
              className={dateInputClass}
            />
          </div>
        )}
      </div>

      {(incompleteCustom || invertedCustom) && (
        <p className="mt-1.5 text-[11px] font-semibold text-[#B7791F]">
          {invertedCustom
            ? "A data inicial é posterior à final — mostrando o mês atual."
            : "Escolha as duas datas — até lá, mostrando o mês atual."}
        </p>
      )}
    </div>
  );
}
