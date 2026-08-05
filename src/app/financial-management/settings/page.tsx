import { Sidebar } from "@/components/sidebar"

export default function SettingsPage() {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar selectedLabel="Configurações" />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      </main>
    </div>
  )
}
