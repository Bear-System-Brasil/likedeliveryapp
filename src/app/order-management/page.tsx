"use client";

import { AdminPageLayout } from "@/components/admin-page-layout";
import OrderManagement from "@/components/order-management";
import ProtectedRoute from "@/components/protected-route";
import { ChefHat } from "lucide-react";

export default function OrderManagementPage() {
  return (
    <ProtectedRoute allowedRoles={["owner", "admin", "manager", "cook"]}>
      <OrderManagementContent />
    </ProtectedRoute>
  );
}

function OrderManagementContent() {
  return (
    <AdminPageLayout title="Gestão de Pedidos" icon={ChefHat}>
      <OrderManagement />
    </AdminPageLayout>
  );
}
