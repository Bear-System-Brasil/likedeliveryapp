"use client";

import { useMemo, useState, useEffect, useRef } from "react";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  Heart,
  Plus,
  ShoppingBag,
  Star,
} from "lucide-react";

import { CustomizeOrder } from "@/components/customize-order/customize-order";
import { MainHeader } from "@/components/main-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { GradientButton } from "@/components/ui/gradient-button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAllCategories,
  useCartActions,
  useCompanyProducts,
  useRestaurant,
} from "@/hooks";
import { useAuth } from "@/contexts/auth-provider";
import { useAuthStore } from "@/stores/auth-store";
import { formatCurrency } from "@/utils/format-currency";
import { toast } from "sonner";

// Função para gerar IDs seguros e sem colisão
function slugify(text: string) {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Troca espaços e caracteres especiais por hífen
    .replace(/(^-|-$)+/g, ""); // Remove hifens sobrando nas pontas
}

function getProductCategoryName(
  productCategory: any,
  categoryMap: Record<string, string>,
) {
  if (typeof productCategory === "string") {
    return categoryMap[productCategory] || productCategory;
  }

  return (
    categoryMap[productCategory?.categoryId] ||
    productCategory?.category?.name ||
    productCategory?.name ||
    ""
  );
}

function getImageUrl(item: any) {
  return item?.imageURL?.[0]?.url || item?.image || "/placeholder.svg";
}

export default function RestaurantPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const { totalItems, totalPrice } = useCartActions();
  const { isAuthenticated, user } = useAuthStore();
  const { showAuthModal } = useAuth();

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

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const navRef = useRef<HTMLElement>(null);

  const loading = loadingRestaurant || loadingProducts;
  const error = restaurantError || productsError;

  const categoryMap = useMemo(() => {
    if (!allCategories) return {};
    return Object.fromEntries(
      allCategories.map((category: any) => [category.id, category.name]),
    );
  }, [allCategories]);

  // 1. Em vez de filtrar, agrupamos os itens por categoria
  const groupedItems = useMemo(() => {
    const groups: Record<string, any[]> = {};

    menuItems.forEach((item: any) => {
      // Pega a primeira categoria do produto, ou "Outros" se não tiver
      let catName = "Outros";
      if (item.productCategories && item.productCategories.length > 0) {
        const foundName = getProductCategoryName(item.productCategories[0], categoryMap);
        if (foundName) catName = foundName;
      }

      if (!groups[catName]) {
        groups[catName] = [];
      }
      groups[catName].push(item);
    });

    return groups;
  }, [categoryMap, menuItems]);

  // 2. Extrai as categorias para os botões do menu baseado nos grupos
  const categories = useMemo(() => Object.keys(groupedItems), [groupedItems]);

  // Define a primeira categoria como selecionada inicialmente
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // 3. Efeito para mudar a aba ativa no menu enquanto o usuário rola a página
  useEffect(() => {
    // Interrompe imediatamente se não houver categorias
    if (categories.length === 0) return; 

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const headerOffset = 150; // Compensação da altura do cabeçalho fixo

      let currentActive = categories[0];

      categories.forEach((category) => {
        // Busca usando o slug seguro
        const element = document.getElementById(`category-${slugify(category)}`);
        if (element) {
          const elementTop = element.offsetTop;
          if (scrollPosition >= elementTop - headerOffset) {
            currentActive = category;
          }
        }
      });

      if (currentActive) {
        setSelectedCategory(currentActive);
      }
    };

    // Adicionado { passive: true } para performance no mobile
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  // 4. Efeito para centralizar o botão da categoria no menu horizontal
  useEffect(() => {
    if (navRef.current && selectedCategory) {
      // Busca usando o slug seguro
      const activeButton = document.getElementById(`nav-btn-${slugify(selectedCategory)}`);
      if (activeButton) {
        const nav = navRef.current;
        // Calcula a posição para centralizar o botão no scroll horizontal
        const scrollLeft = activeButton.offsetLeft - nav.offsetWidth / 2 + activeButton.offsetWidth / 2;
        nav.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedCategory]);

  // Função de Clique para rolar até a categoria
  const scrollToCategory = (categoryName: string) => {
    // Busca usando o slug seguro
    const element = document.getElementById(`category-${slugify(categoryName)}`);
    if (element) {
      // Usa 120 para compensar o header fixo e a barra de categorias
      const y = element.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
      setSelectedCategory(categoryName);
    }
  };

  const restaurantData = restaurant as any;
  const specialties =
    restaurantData?.specialty || restaurantData?.speciality || [];
  const restaurantCategory =
    specialties[0]?.name || restaurantData?.categories?.[0]?.name || "Delivery";
  const restaurantRating = Number(restaurantData?.rating || 0);
  const totalReviews = Number(restaurantData?.totalReviews || 0);
  const hasRating = Number.isFinite(restaurantRating) && restaurantRating > 0;
  const deliveryTime = restaurantData?.time || "30-40 min";
  const deliveryFee = Number.parseFloat(
    String(restaurantData?.deliveryFee ?? "").replace(",", "."),
  );
  const deliveryLabel =
    Number.isFinite(deliveryFee) && deliveryFee > 0
      ? formatCurrency(deliveryFee)
      : "Entrega grátis";
  const isOpen =
    typeof restaurantData?.isOpen === "boolean" ? restaurantData.isOpen : null;
  const restaurantDescription = restaurantData?.description?.trim();

  const handleOpenModal = (item: any) => {
    if (!isAuthenticated) {
      showAuthModal("login");
      return;
    }

    if (user?.role && user.role !== "client") {
      toast.error(
        "Contas de restaurante não podem fazer pedidos - entre com uma conta de cliente.",
      );
      return;
    }

    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <AnimatedBackground showBlobs={false} className="bg-[#f4f5f7] py-0">
      <MainHeader
        cartItems={totalItems}
        onCartClick={() => router.push("/cart")}
        showSearch={true}
        showNav={true}
      />

      <main className="px-3 pb-28 pt-20 sm:px-5 sm:pt-24">
        <div className="mx-auto max-w-[1160px]">
          {loading ? (
            <RestaurantPageSkeleton />
          ) : error || !restaurant ? (
            <Card className="border-[#e9eaee] bg-white p-8 text-center shadow-sm">
              <p className="mb-4 text-red-600">
                {error?.message || "Restaurante não encontrado"}
              </p>
              <GradientButton onClick={() => router.push("/#lojas")} size="sm">
                Voltar para restaurantes
              </GradientButton>
            </Card>
          ) : (
            <>
              {/* === CABEÇALHO DO RESTAURANTE === */}
              <section className="overflow-hidden rounded-[14px] border border-[#e9eaee] bg-white shadow-sm">
                <div className="relative h-32 bg-[#edeef1] sm:h-40 md:h-[158px]">
                  <Image
                    fill
                    priority
                    sizes="(max-width: 640px) 100vw, 1160px"
                    src={
                      restaurantData.cover_url ||
                      restaurantData.logo_url ||
                      "/placeholder.svg"
                    }
                    alt={restaurantData.tradeName || "Restaurante"}
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/35 to-transparent" />

                  <button
                    type="button"
                    onClick={() => router.push("/#lojas")}
                    className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-sm transition hover:bg-white"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFavorite((favorite) => !favorite)}
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-sm transition hover:bg-white"
                  >
                    <Heart
                      className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`}
                    />
                  </button>
                </div>

                <div className="flex items-start gap-3 px-3 pb-4 sm:px-4">
                  <Image
                    width={56}
                    height={56}
                    src={restaurantData.logo_url || "/placeholder.svg"}
                    alt={`Logo de ${restaurantData.tradeName || "restaurante"}`}
                    className="relative z-10 -mt-7 h-14 w-14 shrink-0 rounded-[14px] border-[3px] border-white bg-[#edeef1] object-cover"
                  />

                  <div className="min-w-0 flex-1 pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="truncate text-[18px] font-extrabold tracking-[-0.02em] text-[#14161a]">
                        {restaurantData.tradeName}
                      </h1>
                      {isOpen !== null && (
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                            isOpen
                              ? "bg-[#e9f7ef] text-[#1b7f4c]"
                              : "bg-[#fff1e7] text-[#e05a00]"
                          }`}
                        >
                          {isOpen ? "Aberto" : "Fechado"}
                        </span>
                      )}
                    </div>

                    {restaurantDescription && (
                      <p className="mt-1 line-clamp-2 text-xs font-medium text-[#8a8f99]">
                        {restaurantDescription}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                      {hasRating && (
                        <span className="flex items-center gap-1 rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[#14161a]">
                          <Star className="h-3 w-3 fill-[#ffb020] text-[#ffb020]" />
                          {restaurantRating.toLocaleString("pt-BR", {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}
                        </span>
                      )}
                      <span className="rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[#3d4149]">
                        {restaurantCategory}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-[#f4f5f7] px-2.5 py-1 text-[#3d4149]">
                        <Clock3 className="h-3 w-3" />
                        {deliveryTime}
                      </span>
                      <span className="rounded-full bg-[#e9f7ef] px-2.5 py-1 text-[#1b7f4c]">
                        {deliveryLabel}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* === BARRA DE NAVEGAÇÃO DE CATEGORIAS FIXA === */}
              <nav
                ref={navRef}
                className="sticky top-[72px] z-30 -mx-3 flex gap-2 overflow-x-auto bg-[#f4f5f7]/95 px-3 py-3 backdrop-blur scrollbar-hide sm:top-[82px] sm:-mx-5 sm:px-5"
              >
                {categories.map((category) => {
                  const isActive = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      id={`nav-btn-${slugify(category)}`} // Uso do slug
                      type="button"
                      onClick={() => scrollToCategory(category)}
                      className={`shrink-0 rounded-lg border px-3.5 py-1.5 text-xs font-bold transition-all ${
                        isActive
                          ? "border-gray-900 bg-gray-900 text-white"
                          : "border-[#e9eaee] bg-white text-[#3d4149] hover:border-gray-300"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </nav>

              {/* === LISTA DE PRODUTOS AGRUPADOS POR CATEGORIA === */}
              <section aria-label="Itens do cardápio" className="mt-2 space-y-8">
                {menuItems.length === 0 ? (
                  <Card className="border-[#e9eaee] bg-white p-10 text-center shadow-sm">
                    <p className="text-sm font-medium text-gray-600">
                      Nenhum produto disponível no momento.
                    </p>
                  </Card>
                ) : (
                  Object.entries(groupedItems).map(([category, items]) => (
                    <div 
                      key={category} 
                      id={`category-${slugify(category)}`} // Uso do slug
                      className="scroll-mt-[130px]"
                    >
                      <h2 className="mb-4 text-xl font-extrabold text-gray-900">
                        {category}
                      </h2>
                      
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item: any) => {
                          const isAvailable = item.isAvailable !== false;

                          return (
                            <Card
                              key={item.id}
                              onClick={() => isAvailable && handleOpenModal(item)}
                              className={`group flex min-w-0 min-h-[116px] gap-3 overflow-visible rounded-[13px] border border-[#e9eaee] bg-white p-3 shadow-sm transition hover:border-[#dddfe4] hover:shadow-md ${
                                isAvailable ? "cursor-pointer" : "cursor-default"
                              }`}
                            >
                              <div className="flex min-w-0 flex-1 flex-col">
                                <h3 className="line-clamp-2 break-words text-sm font-bold tracking-[-0.01em] text-[#14161a]">
                                  {item.name}
                                </h3>
                                
                                {item.description && (
                                  <p className="mt-1 line-clamp-2 break-words text-xs font-medium leading-relaxed text-[#8a8f99]">
                                    {item.description}
                                  </p>
                                )}
                                
                                <div className="mt-auto flex items-center gap-2 pt-3">
                                  <span className="text-[15px] font-extrabold tracking-[-0.02em] text-[#14161a]">
                                    {formatCurrency(Number(item.salePrice || 0))}
                                  </span>
                                </div>
                              </div>

                              <div className="relative h-[92px] w-[92px] shrink-0">
                                <Image
                                  width={184}
                                  height={184}
                                  src={getImageUrl(item)}
                                  alt={item.name}
                                  className={`h-full w-full rounded-[10px] bg-[#edeef1] object-cover ${
                                    !isAvailable ? "opacity-60" : ""
                                  }`}
                                />

                                {!isAvailable ? (
                                  <Badge className="absolute inset-x-1 bottom-1 justify-center border-0 bg-black/70 px-1 py-1 text-[10px] text-white">
                                    Indisponível
                                  </Badge>
                                ) : (
                                  <Button
                                    type="button"
                                    size="icon"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleOpenModal(item);
                                    }}
                                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-lg border-2 border-white bg-orange-500 text-white shadow-md hover:bg-orange-600"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {selectedItem && (
        <CustomizeOrder
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          productData={selectedItem}
        />
      )}

      {totalItems > 0 && (
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-40 sm:left-4 sm:right-4 md:bottom-4">
          <div className="mx-auto max-w-[1160px] rounded-xl bg-[#14161a] px-3 py-3 text-white shadow-xl sm:px-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <ShoppingBag className="h-4 w-4 shrink-0 text-orange-400" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold sm:text-sm">
                    {totalItems} {totalItems === 1 ? "item" : "itens"} no
                    carrinho
                  </p>
                  <p className="text-[11px] font-medium text-gray-300 sm:text-xs">
                    Total: {formatCurrency(totalPrice || 0)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => router.push("/cart")}
                className="h-9 shrink-0 rounded-lg bg-white px-3 text-xs font-bold text-orange-600 hover:bg-orange-50 sm:px-4"
              >
                Ver carrinho
              </Button>
            </div>
          </div>
        </div>
      )}
    </AnimatedBackground>
  );
}

function RestaurantPageSkeleton() {
  return (
    <div className="space-y-3">
      <Card className="overflow-hidden border-[#e9eaee] bg-white shadow-sm">
        <Skeleton className="h-32 w-full rounded-none sm:h-40 md:h-[158px]" />
        <div className="flex gap-3 px-3 pb-4 sm:px-4">
          <Skeleton className="relative z-10 -mt-7 h-14 w-14 shrink-0 rounded-[14px]" />
          <div className="flex-1 space-y-2 pt-3">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-full max-w-md" />
            <Skeleton className="h-6 w-72 max-w-full" />
          </div>
        </div>
      </Card>

      <div className="flex gap-2 overflow-hidden py-3">
        {["a", "b", "c", "d"].map((item) => (
          <Skeleton key={item} className="h-8 w-20 shrink-0 rounded-lg" />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {["a", "b", "c", "d", "e", "f"].map((item) => (
          <Card
            key={item}
            className="flex min-h-[116px] gap-3 border-[#e9eaee] bg-white p-3"
          >
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="mt-auto h-4 w-20" />
            </div>
            <Skeleton className="h-[92px] w-[92px] shrink-0 rounded-[10px]" />
          </Card>
        ))}
      </div>
    </div>
  );
}