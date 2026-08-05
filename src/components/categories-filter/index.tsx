"use client";

import { Ref } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryItem = {
  id: string | null;
  name: string;
  icon?: string;
};

type Props = {
  categories: CategoryItem[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
  showArrows?: boolean;
  scrollCategories?: (direction: "left" | "right") => void;
  categoriesScrollRef?: Ref<HTMLDivElement>;
  showAllOption?: boolean;
  allLabel?: string;
  title?: string;
  rightContent?: React.ReactNode;
};

export function CategoriesFilter({
  categories,
  selectedValue,
  onSelect,
  showArrows = false,
  scrollCategories,
  categoriesScrollRef,
  showAllOption = false,
  allLabel = "Todos",
  title,
  rightContent,
}: Props) {
  return (
    <section className="px-3 sm:px-4 mb-8">
      <div className="max-w-7xl mx-auto">
        {(title || rightContent) && (
          <div className="flex items-center justify-between mb-4">
            {title && (
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {title}
              </h2>
            )}
            {rightContent}
          </div>
        )}

        <div className="relative">
          {/* Seta esquerda - só aparece a partir de sm */}
          {showArrows && (
            <button
              onClick={() => scrollCategories?.("left")}
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 shadow-md border border-gray-200 items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          <div
            ref={categoriesScrollRef}
            className="flex gap-2 overflow-x-auto scroll-smooth scrollbar-hide pb-4"
          >
            {showAllOption && (
              <button
                onClick={() => onSelect(null)}
                className={cn(
                  "shrink-0 px-5 py-2.5 rounded-2xl font-medium text-sm whitespace-nowrap transition-all",
                  selectedValue === null
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                )}
              >
                {allLabel}
              </button>
            )}

            {categories.map((category) => (
              <button
                key={category.id ?? category.name}
                onClick={() => onSelect(category.id)}
                className={cn(
                  "shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl font-medium text-sm whitespace-nowrap transition-all border",
                  selectedValue === category.id
                    ? "bg-orange-500 text-white border-orange-500 shadow-md"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                )}
              >
                {category.icon && (
                  <span className="text-base">{category.icon}</span>
                )}
                {category.name}
              </button>
            ))}
          </div>

          {/* Seta direita - só aparece a partir de sm */}
          {showArrows && (
            <button
              onClick={() => scrollCategories?.("right")}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 shadow-md border border-gray-200 items-center justify-center hover:bg-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
