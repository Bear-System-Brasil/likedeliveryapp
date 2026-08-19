import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format-currency";
import { Edit, Ruler, Sandwich, Trash2 } from "lucide-react";
import Image from "next/image";

export interface AdminDish {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  isPopular?: boolean;
  discount?: number;
  tags: string[];
  available?: boolean;
  category: string;
}

interface AdminDishCardProps {
  dish: AdminDish;
  onEdit?: (dish: AdminDish) => void;
  onDelete?: (dish: AdminDish) => void;
  onToggleAvailability?: (dish: AdminDish) => void;
  onManageAddOns?: (dish: AdminDish) => void;
  onManageVariations?: (dish: AdminDish) => void;
}

export function AdminDishCard({
  dish,
  onEdit,
  onDelete,
  onToggleAvailability,
  onManageAddOns,
  onManageVariations,
}: AdminDishCardProps) {
  const isAvailable = dish.available !== false;

  return (
    <article
      className={cn(
        "group flex h-full min-w-0 gap-3 rounded-[13px] border border-[#E9EAEE] bg-white p-2.5 text-[#14161A] transition-all",
        "hover:-translate-y-0.5 hover:border-[#FFD3B0] hover:shadow-[0_8px_20px_rgba(20,22,26,0.06)]",
        !isAvailable && "bg-white/80",
      )}
    >
      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[10px] bg-[#EDEEF1]">
        <Image
          src={dish.image}
          alt={dish.name}
          fill
          sizes="72px"
          className={cn(
            "object-cover transition-transform duration-300 group-hover:scale-105",
            !isAvailable && "grayscale opacity-70",
          )}
        />
        {dish.isPopular && (
          <span className="absolute right-1 top-1 rounded-md bg-[#FF6B00] px-1.5 py-0.5 text-[9px] font-extrabold text-white">
            Popular
          </span>
        )}
        {dish.discount && (
          <span className="absolute left-1 top-1 rounded-md bg-[#1B7F4C] px-1.5 py-0.5 text-[9px] font-extrabold text-white">
            -{dish.discount}%
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-bold tracking-normal">
            {dish.name}
          </h3>
          <div className="shrink-0 text-right">
            {dish.originalPrice && (
              <p className="text-[11px] font-semibold text-[#8A8F99] line-through">
                {formatCurrency(dish.originalPrice)}
              </p>
            )}
            <p className="text-sm font-extrabold text-[#14161A]">
              {formatCurrency(dish.price)}
            </p>
          </div>
        </div>

        <p className="truncate text-[11.5px] font-medium text-[#8A8F99]">
          {dish.description}
        </p>

        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="max-w-full truncate rounded-md bg-[#F4F5F7] px-2 py-0.5 text-[10.5px] font-bold text-[#3D4149]">
            {dish.category}
          </span>

          {dish.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="rounded-md border border-[#E9EAEE] px-2 py-0.5 text-[10.5px] font-bold text-[#3D4149]"
            >
              {tag}
            </span>
          ))}

          <button
            type="button"
            onClick={() => onToggleAvailability?.(dish)}
            disabled={!onToggleAvailability}
            title={
              isAvailable
                ? "Clique para desativar este prato"
                : "Clique para ativar este prato"
            }
            className={cn(
              "rounded-md px-2 py-0.5 text-[10.5px] font-extrabold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              isAvailable
                ? "bg-[#E9F7EF] text-[#1B7F4C] hover:bg-[#DDF1E7]"
                : "bg-[#F4F5F7] text-[#8A8F99] hover:bg-[#EBECF0]",
            )}
          >
            {isAvailable ? "Disponível" : "Indisponível"}
          </button>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 content-center gap-1.5">
        <button
          type="button"
          onClick={() => onEdit?.(dish)}
          disabled={!onEdit}
          aria-label={`Editar ${dish.name}`}
          title="Editar prato"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F4F5F7] text-[#3D4149] transition-colors hover:bg-[#E9EAEE] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Edit className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(dish)}
          disabled={!onDelete}
          aria-label={`Remover ${dish.name}`}
          title="Remover prato"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FDEEEE] text-[#D64545] transition-colors hover:bg-[#F9DCDC] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onManageAddOns?.(dish)}
          disabled={!onManageAddOns}
          aria-label={`Complementos de ${dish.name}`}
          title="Gerenciar complementos"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#2563EB] transition-colors hover:bg-[#DCEAFF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Sandwich className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onManageVariations?.(dish)}
          disabled={!onManageVariations}
          aria-label={`Tamanhos de ${dish.name}`}
          title="Gerenciar tamanhos"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F3EAFF] text-[#7C3AED] transition-colors hover:bg-[#EADCFF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Ruler className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
