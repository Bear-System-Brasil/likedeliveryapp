"use client";

import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/custom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, ShoppingCart, Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger";
  currentRestaurant?: string;
  newRestaurant?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title = "Confirmar ação",
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  currentRestaurant,
  newRestaurant,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    // onOpenChange(false)
  };

  const handleCancel = () => {
    onCancel();
    // onOpenChange(false)
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full ${
                variant === "danger"
                  ? "bg-red-100 text-red-600"
                  : "bg-orange-100 text-orange-600"
              }`}
            >
              {variant === "danger" ? (
                <Trash2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {title}
            </DialogTitle>
          </div>

          {currentRestaurant && newRestaurant ? (
            <DialogDescription className="text-base text-gray-600 leading-relaxed pt-2">
              <div className="space-y-3">
                <p>Você já tem itens no carrinho:</p>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <ShoppingCart className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-900">
                      {currentRestaurant}
                    </span>
                  </div>
                </div>
                <p className="text-sm">
                  Deseja{" "}
                  <strong className="text-red-600">limpar o carrinho</strong> e
                  adicionar itens de:
                </p>
                <div className="bg-linear-to-r from-orange-50 to-orange-50 rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center gap-2 text-sm">
                    <ShoppingCart className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold text-gray-900">
                      {newRestaurant}
                    </span>
                  </div>
                </div>
              </div>
            </DialogDescription>
          ) : (
            <DialogDescription className="text-base text-gray-600 leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="px-6 pb-6 pt-2 gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1 h-11 text-base font-medium border-2 hover:bg-gray-50"
          >
            {cancelText}
          </Button>
          <GradientButton
            onClick={handleConfirm}
            className={`flex-1 px-4 py-3 text-base font-medium ${
              variant === "danger"
                ? "bg-linear-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
                : ""
            }`}
          >
            {confirmText}
          </GradientButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
