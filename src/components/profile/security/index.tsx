"use client";

import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

import { DataCard } from "@/components/data-card";

export function Security() {
  return (
    <DataCard title="Segurança" icon={<Lock className="h-5 w-5" />}>
      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full justify-start rounded-xl border-gray-200 cursor-pointer"
        >
          <Lock className="h-4 w-4 mr-2" />
          Alterar Senha
        </Button>
      </div>
    </DataCard>
  );
}
