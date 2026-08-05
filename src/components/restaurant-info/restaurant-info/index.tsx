"use client";

import { useMemo, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import Image from "next/image";

import { useAuthStore } from "@/stores/auth-store";

import { formatCurrency } from "@/utils/format-currency";

import {
  useAllCategories,
  useCartActions,
  useCompanyProducts,
  useRestaurant,
} from "@/hooks";

import { Clock, Heart, Minus, Plus, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AnimatedBackground,
  GlassCard,
  GlassCardContent,
  GradientButton,
} from "@/components/ui/custom";
import { Skeleton } from "@/components/ui/skeleton";

import { BackButton } from "@/components/back-button";
import { CustomizeOrder } from "@/components/customize-order/customize-order";
import { MainHeader } from "@/components/main-header";

export default function RestaurantPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const { items, totalItems, totalPrice, handleUpdateQuantity } =
    useCartActions();
  const { isAuthenticated } = useAuthStore();

  // React Query hooks - aproveita cache e prefetch!
  const {
    data: restaurant,
    isLoading: loadingRestaurant,
    error: restaurantError,
  } = useRestaurant(companyId);
  const {
    data: menuItems = [],
    isLoading: loadingProducts,
    error: productsError,
  } = useCompanyProducts(companyId);

  const { data: allCategories } = useAllCategories();

  // Derived state
  const loading = loadingRestaurant || loadingProducts;
  const error = restaurantError || productsError;

  const categoryMap = useMemo(() => {
    if (!allCategories) return {};

    return Object.fromEntries(allCategories.map((c: any) => [c.id, c.name]));
  }, [allCategories]);

  // Categorias derivadas dos produtos
  const categories = useMemo(() => {
    return [
      "Todos",
      ...new Set(
        menuItems
          .flatMap(
            (p: any) =>
              p.productCategories?.map(
                (pc: any) => categoryMap[pc.categoryId],
              ) || [],
          )
          .filter(Boolean),
      ),
    ];
  }, [menuItems, categoryMap]);

  // UI state
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [isFavorite, setIsFavorite] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const filteredItems =
    selectedCategory === "Todos"
      ? menuItems
      : menuItems.filter((item) => {
          if (!item.productCategories) return false;

          return item.productCategories.some(
            (pc: any) => categoryMap[pc.categoryId] === selectedCategory,
          );
        });

  const handleOpenModal = (item: any) => {
    if (!isAuthenticated) {
      router.push("/cart");
      return;
    }
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <AnimatedBackground blobCount={2}>
      <MainHeader
        cartItems={totalItems}
        onCartClick={() => router.push("/cart")}
        showSearch={true}
        showNav={true}
      />

      {/* Restaurant Hero Section */}
      <section className="pt-20 sm:pt-24 pb-6 sm:pb-8 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          {/* Espaço reservado para botão fixo */}
          <div className="h-16 sm:h-20 mb-2"></div>
          <BackButton onClick={() => router.push("/restaurants")} sticky />

          {loading ? (
            <GlassCard className="shadow-2xl overflow-hidden">
              {/* Skeleton para imagem de capa */}
              <div className="w-full aspect-16/5">
                <Skeleton className="w-full h-full rounded-none" />
              </div>

              <GlassCardContent className="p-4 sm:p-6">
                <div className="mb-4 sm:mb-6 space-y-3">
                  <Skeleton className="h-8 sm:h-10 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </GlassCardContent>
            </GlassCard>
          ) : error || !restaurant ? (
            <GlassCard className="shadow-2xl overflow-hidden">
              <div className="text-center p-8">
                <p className="text-red-600 mb-4">
                  {error?.message || "Restaurante não encontrado"}
                </p>
                <GradientButton onClick={() => router.push("/restaurants")}>
                  Voltar para Restaurantes
                </GradientButton>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="shadow-2xl overflow-hidden">
              <div className="relative w-full aspect-16/5 overflow-hidden bg-gray-100">
                <Image
                  width={1200}
                  height={375}
                  src={
                    restaurant.cover_url ||
                    restaurant.logo_url ||
                    "/placeholder.svg"
                  }
                  alt={restaurant.tradeName || "Restaurante"}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 hover:bg-white border-0 rounded-full h-9 w-9 sm:h-10 sm:w-10 cursor-pointer"
                >
                  <Heart
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                  />
                </Button>

                {/* Temporariamente desabilitado - propriedade isOpen não existe em Company */}
                {/* {restaurant.isOpen !== undefined && (
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                    <Badge className={`${restaurant.isOpen
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                      } text-white border-0 text-xs sm:text-sm`}>
                      {restaurant.isOpen ? '🟢 Aberto agora' : '🔴 Fechado'}
                    </Badge>
                  </div>
                )} */}
              </div>

              <GlassCardContent className="p-4 sm:p-6">
                <div className="mb-4 sm:mb-6">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {restaurant.tradeName}
                  </h1>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                    {restaurant.description || "Sem descrição disponível"}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <div className="flex items-center space-x-1 bg-orange-100 rounded-full px-2 sm:px-3 py-1">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-orange-500 text-orange-500" />
                      <span className="font-bold text-orange-700 text-xs sm:text-sm">
                        Novo
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600">
                      (0 avaliações)
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                    <span className="text-xs sm:text-sm text-gray-600">
                      30-40 min
                    </span>
                  </div>

                  {/* Temporariamente desabilitado - propriedade isOpen não existe em Company */}
                  {/* <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <div className={`flex items-center space-x-1 rounded-full px-2 sm:px-3 py-1 ${restaurant.isOpen ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                      <div className={`w-2 h-2 rounded-full ${restaurant.isOpen ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      <span className={`font-medium text-xs sm:text-sm ${restaurant.isOpen ? 'text-green-700' : 'text-red-700'
                        }`}>
                        {restaurant.isOpen ? 'Aberto' : 'Fechado'}
                      </span>
                    </div>
                  </div> */}
                </div>
              </GlassCardContent>
            </GlassCard>
          )}
        </div>
      </section>

      {/* Categories */}
      {!loading && !error && restaurant && (
        <section className="px-3 sm:px-4 mb-6 sm:mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden pb-2 scrollbar-categories">
              {categories.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`relative rounded-xl whitespace-nowrap h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-all inline-flex items-center justify-center overflow-hidden group border-2 cursor-pointer ${
                      isActive
                        ? "bg-linear-to-r from-orange-500 to-orange-500 text-white shadow-lg border-transparent"
                        : "bg-white text-gray-700 hover:text-orange-600"
                    }`}
                    style={
                      !isActive
                        ? {
                            borderColor: "#e5e7eb",
                            backgroundImage: "none",
                          }
                        : undefined
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundImage =
                          "linear-gradient(white, white), linear-gradient(to right, #f97316, #ec4899)";
                        e.currentTarget.style.backgroundOrigin = "border-box";
                        e.currentTarget.style.backgroundClip =
                          "padding-box, border-box";
                        e.currentTarget.style.borderColor = "transparent";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundImage = "none";
                        e.currentTarget.style.borderColor = "#e5e7eb";
                      }
                    }}
                  >
                    {isActive && (
                      <span
                        className="absolute inset-0 bg-white opacity-30 rotate-45 -translate-x-full group-hover:translate-x-full
                                      blur-sm transition-transform duration-500 pointer-events-none overflow-hidden rounded-xl"
                      />
                    )}
                    <span className="relative z-10">{category}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Menu Items */}
      {loading ? (
        <section className="px-4 mb-8 pb-32">
          <div className="max-w-7xl mx-auto">
            {/* Skeleton para categorias */}
            <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton
                  key={i}
                  className="h-9 sm:h-10 w-24 rounded-xl shrink-0"
                />
              ))}
            </div>

            {/* Skeleton para cards dos pratos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card
                  key={i}
                  className="border-0 bg-white/80 backdrop-blur-sm shadow-lg overflow-hidden"
                >
                  <Skeleton className="w-full aspect-16/10 rounded-none" />
                  <div className="p-4 sm:p-5 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-9 w-28 rounded-xl" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      ) : (
        !error &&
        restaurant && (
          <section className="px-4 mb-8 pb-32">
            <div className="max-w-7xl mx-auto">
              {filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">
                    Nenhum produto disponível nesta categoria
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredItems.map((item) => {
                    const cartItem = items.find(
                      (ci) => ci.id === item.id.toString(),
                    );
                    const inCart = !!cartItem;
                    const cartQuantity = cartItem?.quantity || 0;

                    return (
                      <Card
                        key={item.id}
                        className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                      >
                        {/* Image Section */}
                        <div className="relative w-full aspect-16/10 overflow-hidden bg-gray-100">
                          <Image
                            width={500}
                            height={312}
                            src={item.imageURL?.[0]?.url || "/placeholder.svg"}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Badge className="bg-red-600 text-white border-0 text-sm font-bold shadow-lg">
                                Indisponível
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Content Section */}
                        <div className="p-4 sm:p-5">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                            {item.name}
                          </h3>
                          <p className="text-gray-600 text-xs sm:text-sm mb-4 leading-relaxed line-clamp-2">
                            {item.description || "Sem descrição"}
                          </p>

                          {/* Price and Action Section */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex flex-col">
                              <div className="flex items-baseline gap-2">
                                <span className="text-xl sm:text-2xl font-bold text-gray-900">
                                  {formatCurrency(item.salePrice || 0)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center">
                              {!item.isAvailable ? (
                                <Button
                                  disabled
                                  className="rounded-xl bg-gray-300 text-gray-500 cursor-not-allowed px-3 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm"
                                >
                                  Indisponível
                                </Button>
                              ) : inCart ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        item.id.toString(),
                                        cartQuantity - 1,
                                      )
                                    }
                                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border-2 border-orange-300 hover:bg-orange-50 cursor-pointer"
                                  >
                                    <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                  <span className="font-bold text-base sm:text-lg min-w-6 sm:min-w-8 text-center">
                                    {cartQuantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        item.id.toString(),
                                        cartQuantity + 1,
                                      )
                                    }
                                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border-2 border-orange-300 hover:bg-orange-50 cursor-pointer"
                                  >
                                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <GradientButton
                                  onClick={() => handleOpenModal(item)}
                                  size="sm"
                                >
                                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  Adicionar
                                </GradientButton>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )
      )}

      {selectedItem && (
        <CustomizeOrder
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          productData={selectedItem}
        />
      )}

      {/* Floating Cart Summary */}
      {totalItems > 0 && (
        <div className="fixed bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-50">
          <div className="max-w-7xl mx-auto">
            <GlassCard variant="gradient" className="shadow-2xl">
              <GlassCardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm sm:text-base">
                      {totalItems} {totalItems === 1 ? "item" : "itens"} no
                      carrinho
                    </p>
                    <p className="text-white/90 text-xs sm:text-sm">
                      Total: {formatCurrency(totalPrice || 0)}
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push("/cart")}
                    className="relative bg-white text-orange-600 hover:bg-gray-50 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm whitespace-nowrap overflow-hidden group"
                  >
                    <span className="relative z-10">Ver Carrinho</span>
                  </Button>
                </div>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      )}
    </AnimatedBackground>
  );
}
