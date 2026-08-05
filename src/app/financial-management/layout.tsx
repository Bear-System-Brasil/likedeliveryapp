"use client";

import ProtectedRoute from "@/components/protected-route";

export default function FinancialManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      {children}
    </ProtectedRoute>
  );
}
