import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils";
import { ExtraGroup } from "../customize-order";

type Props = {
  group: ExtraGroup;
  selectedIds: string[];
  onChange: (groupId: string, selectedIds: string[]) => void;
};

// Badge único de "OPCIONAL" - antes o grupo de tamanho (single-select)
// usava um estilo (pílula maiúscula) e o de complementos (multi-select)
// usava outro (texto simples minúsculo). Padronizado nos dois.
function OptionalBadge() {
  return (
    <span className="rounded-md bg-muted px-[7px] py-[1px] text-[9.5px] font-extrabold tracking-wide text-muted-foreground">
      OPCIONAL
    </span>
  );
}

export function SelectOptions({ group, selectedIds, onChange }: Props) {
  const handleSelectSingle = (id: string) => {
    // Clicar na opção já selecionada desmarca - o grupo é opcional.
    onChange(group.id, selectedIds[0] === id ? [] : [id]);
  };

  const handleToggleMultiple = (id: string) => {
    const isSelected = selectedIds.includes(id);
    onChange(
      group.id,
      isSelected
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    );
  };

  if (!group.multiple) {
    return (
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold tracking-tight text-foreground">
            {group.title}
          </span>
          <OptionalBadge />
        </div>

        <div className="mt-[7px] grid grid-cols-3 gap-1.5">
          {group.options.map((option) => {
            const isSelected = selectedIds[0] === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectSingle(option.id)}
                className={cn(
                  "flex h-[50px] flex-col items-center justify-center gap-0.5 rounded-[10px] border bg-card transition-colors",
                  isSelected
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/40"
                    : "border-border hover:border-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "truncate px-1 text-[12.5px] font-bold",
                    isSelected ? "text-orange-600 dark:text-orange-400" : "text-foreground",
                  )}
                >
                  {option.label}
                </span>
                <span
                  className={cn(
                    "text-[10.5px] font-semibold",
                    isSelected ? "text-orange-500/90" : "text-muted-foreground",
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
      <div className="flex items-center gap-2">
        <span className="text-xs font-extrabold tracking-tight text-foreground">
          {group.title}
        </span>
        <OptionalBadge />
      </div>

      <div className="mt-[7px] grid grid-cols-2 gap-1.5">
        {group.options.map((option) => {
          const isSelected = selectedIds.includes(option.id);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleToggleMultiple(option.id)}
              className={cn(
                "flex h-[38px] min-w-0 items-center gap-2 rounded-[9px] border bg-card px-2.5 text-left transition-colors",
                isSelected
                  ? "border-orange-500 bg-orange-50/70 dark:bg-orange-950/40"
                  : "border-border hover:border-muted-foreground",
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
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
                {option.label}
              </span>
              <span className="shrink-0 text-[11px] font-bold text-muted-foreground">
                {option.price === 0 ? "Grátis" : `+ ${formatCurrency(option.price)}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
