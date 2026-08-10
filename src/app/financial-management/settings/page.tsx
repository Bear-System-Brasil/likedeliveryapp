"use client";

import { AdminPageLayout } from "@/components/admin-page-layout";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <AdminPageLayout
      title="Configurações"
      icon={Settings}
      mainClassName="p-4 pb-10 sm:p-6 lg:pl-64 lg:pr-8"
    >
      <div className="mx-auto max-w-7xl" />
    </AdminPageLayout>
  );
}
