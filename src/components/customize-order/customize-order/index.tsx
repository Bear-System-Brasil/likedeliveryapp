import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useAllCategories,
  useCartActions,
  usePublicProductAddOns,
  usePublicProductVariations,
  useRestaurant,
} from "@/hooks";
import { formatCurrency } from "@/utils";
import { Minus, Plus, X } from "lucide-react";

import Image from "next/image";
import { useMemo, useState } from "react";
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

  const [customOrder, setCustomOrder] = useState<CustomOrderType>(
    initialCustomOrder(),
  );

  const { data: restaurant } = useRestaurant(productData.companyId);

  const { handleAddToCart: addToCart } = useCartActions();

  const { data: categories } = useAllCategories();

  const { data: variations = [] } = usePublicProductVariations(
    productData.id,
    productData.companyId,
  );
  const { data: addOns = [] } = usePublicProductAddOns(
    productData.id,
    productData.companyId,
  );

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
    if (!productData || !restaurant) return;

    setIsAddingToCart(true);

    try {
      const selectedVariationId = selections.variation?.[0];
      const selectedAddOnIds = selections.addon || [];

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
          <Image
            width={440}
            height={118}
            src={productData.imageURL?.[0]?.url || "/placeholder.svg"}
            alt={productData.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />

          {productTags.length > 0 && (
            <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-[3px] text-[10.5px] font-extrabold text-[#3D4149]">
              {productTags[0]}
            </span>
          )}

          <button
            type="button"
            onClick={() => handleModalClose(false)}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-[#3D4149] transition hover:bg-white"
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
            {extraGroups.map((group) => (
              <SelectOptions
                key={group.id}
                group={group}
                selectedIds={selections[group.id] || []}
                onChange={handleSelectionChange}
              />
            ))}
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
            disabled={isAddingToCart}
            className="h-10 flex-1 rounded-[10px] bg-orange-500 text-[13.5px] font-extrabold text-white shadow-[0_4px_12px_rgba(255,107,0,.3)] hover:bg-orange-600"
          >
            {isAddingToCart ? (
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
