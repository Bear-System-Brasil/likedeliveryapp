"use client";

import { Button } from "@/components/ui/button";
import { CurrencyCentsInput } from "@/components/ui/currency-cents-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StockQuantityInput } from "@/components/ui/stock-quantity-input";
import { useConfirm } from "@/contexts/confirm-provider";
import { cn } from "@/lib/utils";
import {
  useCreateProductVariation,
  useDeleteProductVariation,
  useProductVariations,
  useUpdateProductVariation,
} from "@/hooks";
import type { ProductVariation } from "@/services/api";
import { formatCurrency } from "@/utils";
import { Edit, Loader2, Plus, Ruler, Trash2 } from "lucide-react";
import { useState } from "react";

interface Props {
  productId: string | null;
  productName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  name: string;
  priceModifier: number | undefined;
  stockQuantity: number | undefined;
  isAvailable: boolean;
}

const emptyForm: FormState = {
  name: "",
  priceModifier: undefined,
  stockQuantity: undefined,
  isAvailable: true,
};

const fieldClassName =
  "h-9 rounded-[10px] border-[#E9EAEE] bg-white text-xs shadow-none focus-visible:ring-1 focus-visible:ring-[#FF6B00]";

export function ProductVariationsDialog({
  productId,
  productName,
  open,
  onOpenChange,
}: Props) {
  const { confirm } = useConfirm();
  const { data: variations = [], isLoading } = useProductVariations(productId);
  const createVariation = useCreateProductVariation();
  const updateVariation = useUpdateProductVariation();
  const deleteVariation = useDeleteProductVariation();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const isSaving = createVariation.isPending || updateVariation.isPending;

  const trimmedName = form.name.trim();
  const isDuplicateName = variations.some(
    (v) =>
      v.id !== editingId &&
      v.name.trim().toLowerCase() === trimmedName.toLowerCase(),
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleEdit = (variation: ProductVariation) => {
    setEditingId(variation.id);
    setForm({
      name: variation.name,
      priceModifier: variation.priceModifier,
      stockQuantity: variation.stockQuantity,
      isAvailable: variation.isAvailable,
    });
  };

  const handleSubmit = async () => {
    if (!productId) return;
    if (!form.name.trim() || form.priceModifier === undefined) return;
    if (isDuplicateName) return;

    const data = {
      name: form.name.trim(),
      priceModifier: form.priceModifier,
      stockQuantity: form.stockQuantity,
      isAvailable: form.isAvailable,
    };

    if (editingId) {
      await updateVariation.mutateAsync({ id: editingId, productId, data });
    } else {
      await createVariation.mutateAsync({ productId, data });
    }

    resetForm();
  };

  const handleDelete = async (variation: ProductVariation) => {
    if (!productId) return;

    const ok = await confirm({
      title: "Remover tamanho?",
      description: `"${variation.name}" vai deixar de aparecer pros clientes.`,
      confirmText: "Remover",
      cancelText: "Cancelar",
      variant: "danger",
    });
    if (!ok) return;

    await deleteVariation.mutateAsync({ id: variation.id, productId });
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) resetForm();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] rounded-[14px] border-[#E9EAEE] bg-white p-0 shadow-[0_24px_70px_rgba(20,22,26,0.18)] sm:max-w-[480px]">
        <DialogHeader className="shrink-0 border-b border-[#E9EAEE] px-4 pb-3 pt-4 sm:px-6">
          <DialogTitle className="text-base font-extrabold text-[#14161A] sm:text-lg">
            Tamanhos
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-[#8A8F99] sm:text-sm">
            {productName
              ? `Variações de tamanho de "${productName}"`
              : "Variações de tamanho deste prato"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          <div className="grid gap-2 rounded-[10px] border border-[#E9EAEE] bg-[#FAFAFB] p-3">
            <div className="grid grid-cols-[1fr_110px_90px] gap-2">
              <div className="grid gap-1">
                <Label className="text-[11px] font-bold text-[#3D4149]">
                  Nome *
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Grande"
                  maxLength={100}
                  className={cn(
                    fieldClassName,
                    isDuplicateName &&
                      "border-red-400 focus-visible:ring-red-400",
                  )}
                />
                {isDuplicateName && (
                  <p className="text-[10.5px] font-semibold text-red-500">
                    Já existe um tamanho com esse nome
                  </p>
                )}
              </div>
              <div className="grid gap-1">
                <Label className="text-[11px] font-bold text-[#3D4149]">
                  Preço extra *
                </Label>
                <CurrencyCentsInput
                  value={form.priceModifier}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, priceModifier: value }))
                  }
                  maskWhileTyping
                  placeholder="R$ 0,01"
                  className={fieldClassName}
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-[11px] font-bold text-[#3D4149]">
                  Estoque
                </Label>
                <StockQuantityInput
                  value={form.stockQuantity}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, stockQuantity: value }))
                  }
                  placeholder="—"
                  minValue={0}
                  maxValue={9999}
                  className={fieldClassName}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-[11.5px] font-semibold text-[#3D4149]">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      isAvailable: e.target.checked,
                    }))
                  }
                  className="h-3.5 w-3.5 cursor-pointer accent-[#FF6B00]"
                />
                Disponível
              </label>

              <div className="flex gap-1.5">
                {editingId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetForm}
                    className="h-8 cursor-pointer rounded-[8px] px-2.5 text-[11.5px] font-bold text-[#8A8F99] hover:bg-white"
                  >
                    Cancelar
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    isSaving ||
                    !form.name.trim() ||
                    form.priceModifier === undefined ||
                    isDuplicateName
                  }
                  className="h-8 cursor-pointer rounded-[8px] bg-[#FF6B00] px-2.5 text-[11.5px] font-extrabold text-white hover:bg-[#E05A00]"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : editingId ? (
                    "Salvar"
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-3 divide-y divide-[#F4F5F7]">
            {isLoading &&
              [1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2 py-2.5">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}

            {!isLoading && variations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#F4F5F7] text-[#FF6B00]">
                  <Ruler className="h-5 w-5" />
                </div>
                <p className="text-[12.5px] font-bold text-[#14161A]">
                  Nenhum tamanho cadastrado
                </p>
                <p className="mt-1 text-[11px] font-medium text-[#8A8F99]">
                  Adicione o primeiro tamanho acima
                </p>
              </div>
            )}

            {!isLoading &&
              variations.map((variation) => (
                <div
                  key={variation.id}
                  className="flex items-center gap-2 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold text-[#14161A]">
                      {variation.name}
                    </p>
                    <p className="text-[10.5px] font-semibold text-[#A2A7B0]">
                      {variation.isAvailable ? "Disponível" : "Indisponível"}
                      {variation.stockQuantity !== undefined &&
                        ` · ${variation.stockQuantity} em estoque`}
                    </p>
                  </div>
                  <span className="shrink-0 text-[12.5px] font-extrabold text-[#14161A]">
                    {variation.priceModifier > 0
                      ? `+ ${formatCurrency(variation.priceModifier)}`
                      : "Incluso"}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(variation)}
                      aria-label={`Editar ${variation.name}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F4F5F7] text-[#3D4149] transition-colors hover:bg-[#E9EAEE]"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(variation)}
                      aria-label={`Remover ${variation.name}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FDEEEE] text-[#D64545] transition-colors hover:bg-[#F9DCDC]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
