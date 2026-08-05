"use client";

import { useRouter } from "next/navigation";

import { DataCard } from "@/components/data-card";
import { Package } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

export function OrderHistory() {
  const router = useRouter();

  return (
    <DataCard
      title="Histórico de Pedidos"
      icon={<Package className="h-5 w-5" />}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Visualize todos os seus pedidos anteriores e acompanhe pedidos em
          andamento.
        </p>
        <GradientButton
          onClick={() => router.push("/orders")}
          className="w-full sm:w-auto  "
        >
          <Package className="h-4 w-4 mr-2" />
          Ver Meus Pedidos
        </GradientButton>
      </div>
    </DataCard>
  );
}
