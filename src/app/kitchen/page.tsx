"use client";

import { AdminPageLayout } from "@/components/admin-page-layout";
import Kitchen from "@/components/kitchen";
import ProtectedRoute from "@/components/protected-route";
import { ChefHat } from "lucide-react";

export default function KitchenPage() {
  return (
    <ProtectedRoute allowedRoles={["cook", "manager", "owner", "admin"]}>
      <KitchenContent />
    </ProtectedRoute>
  );
}

function KitchenContent() {
  return (
    <AdminPageLayout title="Cozinha" icon={ChefHat} mainClassName="pb-0 md:pb-0">
      <Kitchen />
    </AdminPageLayout>
  );
}
