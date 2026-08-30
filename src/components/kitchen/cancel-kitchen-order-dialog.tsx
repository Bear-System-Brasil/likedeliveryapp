"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CANCEL_REASONS } from "@/constants/order-management";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { getOrderLabel } from "./helpers";
import type { KitchenOrder } from "./types";

interface CancelKitchenOrderDialogProps {
  order: KitchenOrder | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (order: KitchenOrder, reason: string) => Promise<unknown>;
  isLoading?: boolean;
}

/**
 * Motivo é obrigatório: sem ele o backend devolve 400, então o botão só
 * habilita quando há texto. Alvos grandes — quem cancela está de luva.
 */
export function CancelKitchenOrderDialog({
  order,
  open,
  onClose,
  onConfirm,
  isLoading,
}: CancelKitchenOrderDialogProps) {
  const [preset, setPreset] = useState("");
  const [custom, setCustom] = useState("");

  useEffect(() => {
    if (!open) {
      setPreset("");
      setCustom("");
    }
  }, [open]);

  const reason = preset === "Outro" ? custom.trim() : preset;
  const isValid = reason.length > 0;

  const handleConfirm = async () => {
    if (!order || !isValid) return;
    await onConfirm(order, reason);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Cancelar pedido #{order ? getOrderLabel(order) : "---"}
          </DialogTitle>
          <DialogDescription className="text-base">
            Informe o motivo. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <Label className="text-base font-semibold">Motivo do cancelamento</Label>

          <div className="grid gap-2">
            {CANCEL_REASONS.map((option) => (
              <Button
                key={option}
                type="button"
                variant={preset === option ? "default" : "outline"}
                className="h-auto min-h-12 cursor-pointer justify-start whitespace-normal py-3 text-left text-base"
                onClick={() => setPreset(option)}
              >
                {option}
              </Button>
            ))}
          </div>

          {preset === "Outro" && (
            <div className="space-y-1.5">
              <Label className="text-base">Descreva o motivo</Label>
              <Textarea
                autoFocus
                value={custom}
                onChange={(event) => setCustom(event.target.value)}
                placeholder="O que aconteceu com este pedido?"
                className="min-h-24 text-base"
                maxLength={500}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-12 cursor-pointer text-base"
          >
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || isLoading}
            className="h-12 cursor-pointer text-base"
          >
            {isLoading ? "Cancelando..." : "Confirmar cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
