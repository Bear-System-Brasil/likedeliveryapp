import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useAllCategories,
  useCartActions,
  usePublicProductAddOns,
  usePublicProductVariations,
  useRestaurant,
} from "@/hooks";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils";
import { Minus, Plus, X } from "lucide-react";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SelectOptions } from "../select-options";

type ImageURLType = {
  url: string;
}[];

type Props = {
  productData: {
    companyId: string;
    id: string;
    name: string;
    imageURL: ImageURLType;
    description: string;
    salePrice: number;
    productCategories: string[];
  };
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;
};

export type ExtraOption = {
  id: string;
  label: string;
  price: number;
};

export type ExtraGroup = {
  id: "variation" | "addon";
  title: string;
  multiple: boolean;
  options: ExtraOption[];
};

type CustomOrderType = {
  specialInstructions: string;
};

const initialCustomOrder = (): CustomOrderType => ({
  specialInstructions: "",
});

export function CustomizeOrder({
  productData,
  isModalOpen,
  setIsModalOpen,
}: Props) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notesOpen, setNotesOpen] = useState(false);
  const [selections, setSelections] = useState<Record<string, string[]>>({
    variation: [],
    addon: [],
  });

  // O back já suporta várias fotos por prato (productData.imageURL é um
  // array) - antes só a primeira era exibida. Sem foto nenhuma, cai no
  // placeholder.
  const images = productData.imageURL?.length
    ? productData.imageURL
    : [{ url: "/placeholder.svg" }];

  const [imageApi, setImageApi] = useState<CarouselApi>();
  const [currentImage, setCurrentImage] = useState(0);

  const updateCurrentImage = useCallback((api: CarouselApi) => {
    if (!api) return;
    setCurrentImage(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!imageApi) return;

    setCurrentImage(0);
    updateCurrentImage(imageApi);
    imageApi.on("select", updateCurrentImage);
    imageApi.on("reInit", updateCurrentImage);

    return () => {
      imageApi.off("select", updateCurrentImage);
      imageApi.off("reInit", updateCurrentImage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageApi, productData.id]);

  const [customOrder, setCustomOrder] = useState<CustomOrderType>(
    initialCustomOrder(),
  );

  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant(
    productData.companyId,
  );

  const { handleAddToCart: addToCart } = useCartActions();

  const { data: categories } = useAllCategories();

  const { data: variations = [], isLoading: variationsLoading } =
    usePublicProductVariations(productData.id, productData.companyId);
  const { data: addOns = [], isLoading: addOnsLoading } =
    usePublicProductAddOns(productData.id, productData.companyId);

  // Enquanto isso ainda tá carregando, `extraGroups` fica vazio e nada
  // aparece pra clicar - mas se o clique em "Adicionar" cair bem nessa
  // janela (antes de tamanhos/complementos chegarem), o pedido sai sem eles
  // ou a função aborta em silêncio (restaurant ainda undefined). Trava o
  // botão até tudo estar pronto, em vez de deixar o usuário adicionar algo
  // incompleto que o backend depois rejeita (some do carrinho).
  const isCustomizationLoading =
    variationsLoading || addOnsLoading || restaurantLoading;

  const extraGroups: ExtraGroup[] = useMemo(() => {
    const groups: ExtraGroup[] = [];

    const availableVariations = variations.filter((v) => v.isAvailable);
    if (availableVariations.length > 0) {
      groups.push({
        id: "variation",
        title: "Tamanho",
        multiple: false,
        options: availableVariations.map((v) => ({
          id: v.id,
          label: v.name,
          price: v.priceModifier,
        })),
      });
    }

    const availableAddOns = addOns.filter((a) => a.isAvailable);
    if (availableAddOns.length > 0) {
      groups.push({
        id: "addon",
        title: "Complementos",
        multiple: true,
        options: availableAddOns.map((a) => ({
          id: a.id,
          label: a.name,
          price: a.priceModifier,
        })),
      });
    }

    return groups;
  }, [variations, addOns]);

  const handleSelectionChange = (groupId: string, selectedIds: string[]) => {
    setSelections((prev) => ({ ...prev, [groupId]: selectedIds }));
  };

  const extrasTotal = useMemo(() => {
    return extraGroups.reduce((total, group) => {
      const selectedIds = selections[group.id] || [];
      const groupTotal = group.options
        .filter((option) => selectedIds.includes(option.id))
        .reduce((sum, option) => sum + option.price, 0);
      return total + groupTotal;
    }, 0);
  }, [extraGroups, selections]);

  const categoryMap = useMemo(() => {
    if (!categories) return {};

    return Object.fromEntries(categories.map((c: any) => [c.id, c.name]));
  }, [categories]);

  const getProductCategoryNames = (
    productCategories: any[],
    categoryMap: Record<string, string>,
  ) => {
    if (!productCategories) return [];

    return productCategories
      .map((pc) => categoryMap[pc.categoryId])
      .filter(Boolean);
  };

  const resetState = () => {
    setCustomOrder(initialCustomOrder());
    setQuantity(1);
    setNotesOpen(false);
    setSelections({ variation: [], addon: [] });
  };

  const handleConfirmAddToCart = async () => {
    if (!productData || !restaurant || isCustomizationLoading) return;

    setIsAddingToCart(true);

    try {
      const selectedVariationId = selections.variation?.[0];
      const selectedAddOnIds = selections.addon || [];

      const variationGroup = extraGroups.find((g) => g.id === "variation");
      const addOnGroup = extraGroups.find((g) => g.id === "addon");
      const variationLabel = variationGroup?.options.find(
        (o) => o.id === selectedVariationId,
      )?.label;
      const addOnLabels = addOnGroup?.options
        .filter((o) => selectedAddOnIds.includes(o.id))
        .map((o) => o.label);

      const success = await addToCart({
        id: productData.id.toString(),
        name: productData.name,
        price: unitPrice,
        image: productData.imageURL?.[0]?.url || "/placeholder.svg",
        restaurantId: restaurant.id,
        restaurantName: restaurant.tradeName,
        specialInstructions: customOrder.specialInstructions,
        quantity,
        variations: selectedVariationId
          ? [{ productVariationId: selectedVariationId }]
          : undefined,
        addOns: selectedAddOnIds.length
          ? selectedAddOnIds.map((id) => ({
              productAddOnsId: id,
              quantity: 1,
            }))
          : undefined,
        variationLabel,
        addOnLabels: addOnLabels?.length ? addOnLabels : undefined,
      });

      if (success) {
        setIsModalOpen(false);
        resetState();
      }
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const productTags = getProductCategoryNames(
    productData.productCategories,
    categoryMap,
  );

  const handleModalClose = (val: boolean) => {
    resetState();
    setIsModalOpen(val);
  };

  const unitPrice = productData.salePrice + extrasTotal;

  const totalPrice = unitPrice * quantity;

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        handleModalClose(open);
      }}
    >
      <DialogContent
        hideClose
        className="flex w-[calc(100%-2rem)] max-h-[86dvh] max-w-[440px] flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-2xl sm:w-full sm:rounded-2xl"
      >
        {/* Header image */}
        <div className="relative h-[118px] shrink-0 bg-[#EDEEF1]">
          {images.length > 1 ? (
            <Carousel setApi={setImageApi} className="h-full" opts={{ loop: true }}>
              <CarouselContent className="ml-0 h-[118px]">
                {images.map((image, index) => (
                  <CarouselItem key={index} className="h-full pl-0">
                    <Image
                      width={440}
                      height={118}
                      src={image.url || "/placeholder.svg"}
                      alt={`${productData.name} - foto ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : (
            <Image
              width={440}
              height={118}
              src={images[0].url || "/placeholder.svg"}
              alt={productData.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />

          {images.length > 1 && (
            <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
              {images.map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1.5 rounded-full bg-white transition-all",
                    currentImage === index ? "w-4 opacity-100" : "w-1.5 opacity-60",
                  )}
                />
              ))}
            </div>
          )}

          {productTags.length > 0 && (
            <span className="absolute left-3 top-3 z-20 rounded-md bg-white/95 px-2.5 py-[3px] text-[10.5px] font-extrabold text-[#3D4149]">
              {productTags[0]}
            </span>
          )}

          <button
            type="button"
            onClick={() => handleModalClose(false)}
            className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-[#3D4149] transition hover:bg-white"
            aria-label="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Radix requires a title/description for a11y; the product name is shown visually below */}
        <DialogTitle className="sr-only">{productData.name}</DialogTitle>
        <DialogDescription className="sr-only">
          {productData.description || productData.name}
        </DialogDescription>

        {/* Scrollable middle section - keeps header and footer always visible */}
        <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-3 pt-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-[18px] font-extrabold tracking-[-0.02em] text-[#14161A]">
                {productData.name}
              </h2>
              {productData.description && (
                <p className="mt-[3px] text-[12.5px] font-medium text-[#8A8F99]">
                  {productData.description}
                </p>
              )}
            </div>
            <span className="shrink-0 text-[16px] font-extrabold text-[#14161A]">
              {formatCurrency(productData.salePrice || 0)}
            </span>
          </div>

          <div className="mt-3.5 flex flex-col gap-3.5">
            {isCustomizationLoading ? (
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-[#EDEEF1]" />
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="h-[50px] animate-pulse rounded-[10px] bg-[#EDEEF1]" />
                  <div className="h-[50px] animate-pulse rounded-[10px] bg-[#EDEEF1]" />
                  <div className="h-[50px] animate-pulse rounded-[10px] bg-[#EDEEF1]" />
                </div>
              </div>
            ) : (
              extraGroups.map((group) => (
                <SelectOptions
                  key={group.id}
                  group={group}
                  selectedIds={selections[group.id] || []}
                  onChange={handleSelectionChange}
                />
              ))
            )}
          </div>

          <div className="mt-3">
            <button
              type="button"
              onClick={() => setNotesOpen((prev) => !prev)}
              className="text-[11.5px] font-bold text-orange-500"
            >
              + Observações
            </button>

            {notesOpen && (
              <Textarea
                placeholder="Ex: sem cebola, bem passado…"
                value={customOrder.specialInstructions}
                onChange={(e) =>
                  setCustomOrder((prev) => ({
                    ...prev,
                    specialInstructions: e.target.value,
                  }))
                }
                rows={2}
                className="mt-2 resize-none rounded-[9px] border border-[#E4E6EA] bg-[#FAFAFB] text-[12.5px] shadow-none focus-visible:ring-orange-400"
              />
            )}
          </div>
        </div>

        {/* Quantity and Add button */}
        <div className="flex shrink-0 items-center gap-3 border-t border-[#E9EAEE] bg-white px-[18px] py-3">
          <div className="flex h-10 shrink-0 items-center gap-0.5 rounded-[10px] bg-[#F4F5F7] px-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex h-8 w-[30px] items-center justify-center rounded-lg text-[#3D4149] disabled:opacity-40"
              aria-label="Diminuir quantidade"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[22px] text-center text-sm font-extrabold text-[#14161A]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-8 w-[30px] items-center justify-center rounded-lg text-[#3D4149]"
              aria-label="Aumentar quantidade"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            onClick={handleConfirmAddToCart}
            disabled={isAddingToCart || isCustomizationLoading}
            className="h-10 flex-1 rounded-[10px] bg-orange-500 text-[13.5px] font-extrabold text-white shadow-[0_4px_12px_rgba(255,107,0,.3)] hover:bg-orange-600 disabled:opacity-60"
          >
            {isCustomizationLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Carregando...
              </span>
            ) : isAddingToCart ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Adicionando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Adicionar</span>
                <span className="opacity-60">•</span>
                <span>{formatCurrency(totalPrice)}</span>
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
