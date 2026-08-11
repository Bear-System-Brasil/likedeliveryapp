"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { RESTAURANT_CATEGORIES } from "@/constants";
import { RestaurantGridSkeleton } from "@/components/restaurant-card-skeleton";

import { Restaurant } from "@/components/ui/restaurant";

import { Restaurant as RestaurantType } from "@/types/restaurant";
import { NoRestaurantNear } from "@/components/ui/no-restaurant-near";
import { cn } from "@/lib/utils";

type Props = {
  loading: boolean;
  restaurants: RestaurantType[];
  visibleCount: number;
  trendingRestaurants: RestaurantType[];
};

type RestaurantListBlockProps = {
  emptyContent?: ReactNode;
  emptyMessage: string;
  emptyTitle: string;
  filterContent?: ReactNode;
  id?: string;
  loading: boolean;
  restaurants: RestaurantType[];
  skeletonCount: number;
  subtitle: string;
  title: string;
};

type StoreCategory = {
  id: string;
  icon?: string;
  name: string;
};

const HOME_CATEGORY_IDS = [
  "pizza",
  "lanches",
  "italiana",
  "japonesa",
  "saudavel",
  "doces",
  "bebidas",
  "cafe",
  "caldos",
  "arabe",
];

const HOME_CATEGORY_LABELS: Record<string, string> = {
  italiana: "Massas",
  saudavel: "Saudavel",
  cafe: "Cafe",
  arabe: "Arabe",
};

const CATEGORY_ALIASES: Record<string, string[]> = {
  italiana: ["massas", "macarrao", "italiana"],
  lanches: ["lanche", "lanches", "hamburguer", "hamburger", "burger"],
  saudavel: ["saudavel", "fitness"],
};

const normalizeText = (value?: string | null) =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

function CompactEmptyState({
  message,
  title,
}: {
  message: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-5 text-center shadow-sm">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-xs text-gray-500 sm:text-sm">{message}</p>
    </div>
  );
}

function RestaurantListBlock({
  emptyContent,
  emptyMessage,
  emptyTitle,
  filterContent,
  id,
  loading,
  restaurants,
  skeletonCount,
  subtitle,
  title,
}: RestaurantListBlockProps) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex items-start justify-between gap-3 mb-2 sm:mb-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-gray-950">
            {title}
          </h2>
          <p className="mt-0.5 text-[11px] sm:text-sm text-gray-500">
            {subtitle}
          </p>
        </div>
      </div>

      {filterContent}

      {loading ? (
        <RestaurantGridSkeleton count={skeletonCount} />
      ) : restaurants.length ? (
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {restaurants.map((restaurant, index) => (
            <Restaurant
              key={restaurant.id}
              restaurant={restaurant}
              index={index}
            />
          ))}
        </div>
      ) : emptyContent ? (
        emptyContent
      ) : (
        <CompactEmptyState title={emptyTitle} message={emptyMessage} />
      )}
    </section>
  );
}

function StoreCategoriesFilter({
  categories,
  selectedValue,
  onSelect,
}: {
  categories: StoreCategory[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
}) {
  return (
    <div className="mb-3 sm:mb-4">
      <div className="mb-1.5 sm:mb-2 flex items-center justify-between gap-3 sm:gap-4">
        <h3 className="text-sm sm:text-base font-bold text-gray-700">
          Categorias
        </h3>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-xs sm:text-sm font-semibold text-orange-600 transition-colors hover:text-orange-700"
        >
          Ver todas
        </button>
      </div>

      <div className="flex gap-2 sm:gap-3 overflow-x-auto scroll-smooth scrollbar-hide py-1">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() =>
              onSelect(selectedValue === category.id ? null : category.id)
            }
            className={cn(
              "shrink-0 flex h-8 sm:h-9 items-center gap-1.5 sm:gap-2 rounded-full border px-3 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap shadow-sm transition-all",
              selectedValue === category.id
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white border-gray-200 text-gray-800 hover:border-orange-200 hover:bg-orange-50",
            )}
          >
            {category.icon && (
              <span className="text-xs sm:text-sm leading-none">
                {category.icon}
              </span>
            )}
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TrendingRestaurantsSection({
  trendingRestaurants,
  visibleCount,
  restaurants,
  loading,
}: Props) {
  const [location, setLocation] = useState("");
  const [selectedStoreCategory, setSelectedStoreCategory] = useState<
    string | null
  >(null);

  const storeCategories = useMemo<StoreCategory[]>(
    () =>
      HOME_CATEGORY_IDS.map((categoryId) => {
        const category = RESTAURANT_CATEGORIES.find(
          (item) => item.id === categoryId,
        );

        return {
          id: categoryId,
          icon: category?.icon,
          name: HOME_CATEGORY_LABELS[categoryId] ?? category?.name ?? categoryId,
        };
      }),
    [],
  );

  // A API ja filtra por raio quando recebe lat/lng. Aqui so descartamos o que
  // vier marcado explicitamente como fora do raio - `undefined` significa
  // "resposta sem calculo de distancia" e nao pode esconder a loja.
  const restaurantsNearUser = useMemo(
    () =>
      restaurants.filter((restaurant) => restaurant.isWithinRadius !== false),
    [restaurants],
  );

  const newsRestaurants = useMemo(
    () =>
      trendingRestaurants.filter(
        (restaurant) => restaurant.isWithinRadius !== false,
      ),
    [trendingRestaurants],
  );

  const selectedCategory = storeCategories.find(
    (category) => category.id === selectedStoreCategory,
  );

  const filteredStores = useMemo(() => {
    if (!selectedStoreCategory) return restaurantsNearUser;

    const selectedTerms = [
      selectedStoreCategory,
      selectedCategory?.name,
      ...(CATEGORY_ALIASES[selectedStoreCategory] ?? []),
    ]
      .map(normalizeText)
      .filter(Boolean);

    return restaurantsNearUser.filter((restaurant) => {
      const restaurantTerms = [
        restaurant.description,
        ...((restaurant.specialty ?? []).flatMap((specialty) => [
          specialty.id,
          specialty.name,
        ])),
        ...((restaurant.categories ?? []).flatMap((category) => [
          category.id,
          category.name,
          category.description,
        ])),
      ]
        .map(normalizeText)
        .filter(Boolean);

      return restaurantTerms.some((term) =>
        selectedTerms.some(
          (selectedTerm) =>
            term === selectedTerm ||
            term.includes(selectedTerm) ||
            selectedTerm.includes(term),
        ),
      );
    });
  }, [
    restaurantsNearUser,
    selectedCategory?.name,
    selectedStoreCategory,
  ]);

  const visibleStores = filteredStores.slice(0, visibleCount);
  const isInitialLoading = loading && !restaurants.length;
  const shouldAskForLocation = !location && !restaurants.length;

  useEffect(() => {
    const handler = () => {
      const findLocation = document.cookie
        .split("; ")
        .find((row) => row.startsWith("userLocation="));

      const foundLocation = findLocation ? findLocation.split("=")[1] : "";

      if (foundLocation) {
        try {
          const decodedLocation = decodeURIComponent(foundLocation);
          const parsedLocation = JSON.parse(decodedLocation);

          if (
            typeof parsedLocation === "object" &&
            parsedLocation !== null &&
            "lat" in parsedLocation &&
            "lng" in parsedLocation
          ) {
            setLocation(`${parsedLocation.lat}, ${parsedLocation.lng}`);
          } else {
            setLocation(decodedLocation);
          }
        } catch {
          setLocation(foundLocation);
        }
      } else {
        setLocation("");
      }
    };

    handler();

    window.addEventListener("locationChanged", handler);

    return () => window.removeEventListener("locationChanged", handler);
  }, []);

  return (
    <div className="px-3 sm:px-4 mb-6 sm:mb-10">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <RestaurantListBlock
          title="Novidades"
          subtitle="Destaques recentes perto de voce"
          restaurants={newsRestaurants}
          loading={isInitialLoading}
          skeletonCount={4}
          emptyTitle="Nenhuma novidade encontrada"
          emptyMessage={
            shouldAskForLocation
              ? "Escolha um endereco para ver as novidades perto de voce."
              : "Ainda nao ha novidades perto de voce."
          }
        />

        <RestaurantListBlock
          id="lojas"
          title="Lojas"
          subtitle="Tudo perto de voce"
          restaurants={visibleStores}
          loading={isInitialLoading}
          skeletonCount={8}
          emptyTitle="Nenhuma loja encontrada"
          emptyMessage={
            selectedStoreCategory
              ? "Nenhuma loja encontrada nessa categoria."
              : "Ainda nao ha lojas perto de voce."
          }
          filterContent={
            <StoreCategoriesFilter
              categories={storeCategories}
              selectedValue={selectedStoreCategory}
              onSelect={setSelectedStoreCategory}
            />
          }
          emptyContent={shouldAskForLocation ? <NoRestaurantNear /> : undefined}
        />
      </div>
    </div>
  );
}
