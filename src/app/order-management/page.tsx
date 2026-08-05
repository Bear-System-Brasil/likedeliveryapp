"use client";

import OrderManagement from "@/components/order-management";
import ProtectedRoute from "@/components/protected-route";
import Sidebar from "@/components/sidebar-menu-management/index";
import { ChefHat } from "lucide-react";
import { useState } from "react";

export default function OrderManagementPage() {
  return (
    <ProtectedRoute allowedRoles={["owner", "admin", "manager", "cook"]}>
      <OrderManagementContent />
    </ProtectedRoute>
  );
}

function OrderManagementContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header compacto — foco nos pedidos */}
        <header className="sticky top-0 z-10 bg-white border-b print:hidden lg:pl-64">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 shadow-sm shrink-0 lg:hidden cursor-pointer"
                aria-label="Abrir menu lateral"
              >
                ☰
              </button>
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-bold bg-linear-to-r from-orange-500 to-orange-500 bg-clip-text text-transparent">
                  Gestão de Pedidos
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-1 lg:pl-64">
          <OrderManagement />
        </main>
      </div>
    </>
  );
}
