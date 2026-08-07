import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAllCategories, useCartActions, useRestaurant } from "@/hooks";
import { formatCurrency } from "@/utils";
import { Minus, Plus } from "lucide-react";

import { Accordion } from "@/components/ui/accordion";
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

type CustomOrderType = {
  specialInstructions: string;
  size: "small" | "medium" | "large" | "extra-large";
  extraIngredients: string[];
  currentPrice: number;
};

type OptionsType = {
  label: string;
  price: number;
};

type ValueType = "size" | "extra-ingredients";

export type OptionalsList = {
  label: string;
  value: ValueType;
  options: OptionsType[];
};

const optionalOptions: OptionalsList[] = [
  {
    label: "Tamanho",
    value: "size",
    options: [
      {
        label: "Pequeno",
        price: 0,
      },
      {
        label: "Medio",
        price: 5,
      },
      {
        label: "Grande",
        price: 10,
      },
    ],
  },
  {
    label: "Ingredientes Extras",
    value: "extra-ingredients",
    options: [
      {
        label: "Queijo",
        price: 3,
      },
      {
        label: "Cebola",
        price: 1.5,
      },
      {
        label: "Alface",
        price: 2,
      },
    ],
  },
];

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 20;

export function CustomizeOrder({
  productData,
  isModalOpen,
  setIsModalOpen,
}: Props) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(MIN_QUANTITY);

  const [customOrder, setCustomOrder] = useState<CustomOrderType>({
    specialInstructions: "",
    size: "medium",
    extraIngredients: [],
    currentPrice: productData.salePrice,
  });

  const { data: restaurant } = useRestaurant(productData.companyId);

  const { handleAddToCart: addToCart } = useCartActions();

  const { data: categories } = useAllCategories();

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

  // Preço da unidade já customizada (tamanho + extras escolhidos)
  const unitPrice =
    customOrder.currentPrice >= productData.salePrice
      ? customOrder.currentPrice
      : productData.salePrice + customOrder.currentPrice;

  const totalPrice = unitPrice * quantity;

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => Math.min(prev + 1, MAX_QUANTITY));
  };

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, MIN_QUANTITY));
  };

  const handleConfirmAddToCart = async () => {
    if (!productData || !restaurant) return;

    setIsAddingToCart(true);

    try {
      const success = await addToCart({
        id: productData.id.toString(),
        name: productData.name,
        price: unitPrice,
        image: productData.imageURL?.[0]?.url || "/placeholder.svg",
        restaurantId: restaurant.id,
        restaurantName: restaurant.tradeName,
        specialInstructions: customOrder.specialInstructions,
        quantity,
      });

      if (success) {
        setIsModalOpen(false);

        setCustomOrder({
          specialInstructions: "",
          size: "medium",
          extraIngredients: [""],
          currentPrice: 0,
        });
        setQuantity(MIN_QUANTITY);
      }
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleFinalPrice = (add: boolean, value: number) => {
    if (add) {
      setCustomOrder((prev) => ({
        ...prev,
        currentPrice: prev.currentPrice + value,
      }));
    } else {
      setCustomOrder((prev) => ({
        ...prev,
        currentPrice: prev.currentPrice - value,
      }));
    }
  };

  const handleModalClose = (val: boolean) => {
    setCustomOrder({
      specialInstructions: "",
      size: "medium",
      extraIngredients: [],
      currentPrice: productData.salePrice,
    });
    setQuantity(MIN_QUANTITY);

    setIsModalOpen(val);
  };

  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        handleModalClose(open);
      }}
    >
      <DialogContent className="overflow-y-auto border-0 w-[calc(100%-1.5rem)] sm:w-full max-w-2xl max-h-[90vh] p-0 flex flex-col ">
        <DialogHeader className="relative sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100 shrink-0">
          <Image
            width={500}
            height={500}
            src={productData.imageURL?.[0]?.url || "/placeholder.svg"}
            alt={productData.name}
            className="absolute top-0 left-0 w-full h-52 object-cover z-0"
          />

          <div className="flex flex-col  items-start justify-end py-4 min-h-48 z-10">
            <div className="flex h-full flex-wrap items-center justify-start gap-4">
              {getProductCategoryNames(
                productData.productCategories,
                categoryMap,
              ).map((tag) => (
                <span
                  key={tag}
                  className="bg-orange-500 px-2 min-w-24 text-center text-sm md:px-3 md:py-0.5 rounded-xl text-white font-bold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <DialogTitle>{productData.name}</DialogTitle>

          <DialogDescription className="text-start">
            {productData.description}
          </DialogDescription>
          <p className="text-start text-xl font-bold text-orange-600 mt-2">
            {formatCurrency(productData.salePrice || 0)}
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-4 mb-8 mt-4">
          {optionalOptions.map((item) => (
            <Accordion
              className="px-4"
              key={item.label}
              type="single"
              collapsible
              defaultValue={optionalOptions[0].label}
            >
              <SelectOptions data={item} changePrice={handleFinalPrice} />
            </Accordion>
          ))}
        </div>

        {/* Special Instructions */}
        <div className="px-4">
          <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-900">
            Observações Especiais
          </h3>
          <Textarea
            placeholder="Ex: Sem cebola, bem passado, etc..."
            value={customOrder.specialInstructions}
            onChange={(e) =>
              setCustomOrder((prev) => ({
                ...prev,
                specialInstructions: e.target.value,
              }))
            }
            className="min-h-20 sm:min-h-24 resize-none rounded-xl border-2 border-gray-200 focus:border-orange-400 text-xs sm:text-sm"
          />
        </div>

        {/* Quantity Stepper */}
        <div className="px-4 mt-6">
          <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-900">
            Quantidade
          </h3>
          <div className="flex items-center justify-between border-2 border-gray-200 rounded-xl p-4">
            <span className="text-sm sm:text-base text-gray-700">
              Quantas unidades?
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDecreaseQuantity}
                disabled={quantity <= MIN_QUANTITY}
                aria-label="Diminuir quantidade"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 border-orange-500 text-orange-500 flex items-center justify-center transition-colors hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>

              <span className="text-base font-bold text-gray-900 w-5 text-center">
                {quantity}
              </span>

              <button
                type="button"
                onClick={handleIncreaseQuantity}
                disabled={quantity >= MAX_QUANTITY}
                aria-label="Aumentar quantidade"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 border-orange-500 text-orange-500 flex items-center justify-center transition-colors hover:bg-orange-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Price Summary and Add Button */}
        {productData && (
          <div className="border-t px-4 sm:px-6 py-4 sm:py-5 shrink-0 mt-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <span className="text-base sm:text-lg font-semibold text-gray-900">
                Total:
              </span>
              <span className="text-xl sm:text-2xl font-bold text-orange-600">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <Button
              className="bg-orange-500 w-full cursor-pointer hover:bg-orange-400 px-2 min-w-24 text-center text-sm md:px-3 md:py-0.5 rounded-xl text-white font-bold"
              onClick={handleConfirmAddToCart}
              disabled={isAddingToCart}
              size="lg"
            >
              {isAddingToCart ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Adicionar {quantity} ao Carrinho
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
