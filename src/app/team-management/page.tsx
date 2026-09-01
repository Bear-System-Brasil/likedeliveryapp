"use client";

import { AdminPageLayout } from "@/components/admin-page-layout";
import ProtectedRoute from "@/components/protected-route";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeamManagement, type StaffMember, type StaffRole } from "@/hooks";
import {
  CalendarDays,
  Mail,
  Search,
  Trash2,
  TriangleAlert,
  UserCog,
  UserPlus,
} from "lucide-react";
import { useMemo } from "react";

// A ordem daqui é a ordem do seletor de função do convite, e as chaves são
// o StaffRoleEnum do backend - função nova entra nos dois mapas junto com o
// enum. `admin` ficou de fora de propósito (ver StaffRole).
const ROLE_LABELS: Record<StaffRole, string> = {
  manager: "Gerente",
  cook: "Cozinheiro",
  delivery: "Entregador",
  financial: "Financeiro",
};

const ROLE_BADGE_CLASSES: Record<StaffRole, string> = {
  manager: "bg-[#F3EAFF] text-[#7C3AED]",
  cook: "bg-[#FFF4DE] text-[#B7791F]",
  delivery: "bg-[#E9F7EF] text-[#1B7F4C]",
  financial: "bg-[#EAF2FF] text-[#2563EB]",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR");
}

function TeamManagementContent() {
  const {
    staff: filteredStaff,
    allStaff,
    searchQuery,
    setSearchQuery,
    isModalOpen,
    formData,
    removeTarget,
    handleOpenInviteModal,
    handleCloseModal,
    updateFormField,
    handleSendInvite,
    handleRequestRemove,
    handleCancelRemove,
    handleConfirmRemove,
  } = useTeamManagement();

  const activeCount = useMemo(
    () => allStaff.filter((member) => member.status === "active").length,
    [allStaff],
  );
  const pendingCount = allStaff.length - activeCount;

  return (
    <AdminPageLayout
      title="Equipe"
      icon={UserCog}
      mainClassName="p-4 pb-20 sm:p-6 md:pb-10 lg:pl-[17rem] lg:pr-8"
      actions={
        <Button
          onClick={handleOpenInviteModal}
          className="h-[34px] w-full cursor-pointer rounded-xl bg-[#FF6B00] px-4 text-[12.5px] font-extrabold text-white shadow-[0_4px_12px_rgba(255,107,0,0.25)] hover:bg-[#E05F00] sm:w-auto"
        >
          <UserPlus className="h-4 w-4" />
          Convidar Membro
        </Button>
      }
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-3 rounded-[10px] border border-[#FFE1CC] bg-[#FFF7ED] px-3.5 py-2.5 text-[11.5px] font-semibold text-[#B7791F]">
          Tela em construção: os convites e remoções abaixo ainda não são
          salvos no servidor - assim que o backend tiver a listagem de
          equipe, isso passa a persistir de verdade.
        </div>

        <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex h-9 w-full max-w-[340px] items-center gap-2 rounded-[8px] border border-[#E9EAEE] bg-white px-3">
            <Search className="h-4 w-4 shrink-0 text-[#8A8F99]" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-auto min-w-0 border-0 bg-transparent p-0 text-[12.5px] font-medium text-[#14161A] shadow-none placeholder:text-[#A2A7B0] focus-visible:ring-0"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-[8px] border border-[#E9EAEE] bg-white px-2.5 py-1 text-[11.5px] font-bold text-[#3D4149]">
              {allStaff.length} membros
            </span>
            <span className="rounded-[8px] bg-[#E9F7EF] px-2.5 py-1 text-[11.5px] font-bold text-[#1B7F4C]">
              {activeCount} ativos
            </span>
            {pendingCount > 0 && (
              <span className="rounded-[8px] bg-[#FFF4DE] px-2.5 py-1 text-[11.5px] font-bold text-[#B7791F]">
                {pendingCount} pendentes
              </span>
            )}
          </div>
        </div>

        <section className="overflow-hidden rounded-[8px] border border-[#E9EAEE] bg-white">
          <div className="hidden shrink-0 grid-cols-[minmax(0,1fr)_130px_110px_120px_56px] items-center gap-2 border-b border-[#E9EAEE] bg-[#FAFAFB] px-3.5 py-2.5 md:grid">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#A2A7B0]">
              Membro
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#A2A7B0]">
              Função
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#A2A7B0]">
              Status
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#A2A7B0]">
              Convidado em
            </span>
            <span className="text-right text-[10px] font-extrabold uppercase tracking-wide text-[#A2A7B0]">
              Ações
            </span>
          </div>

          {filteredStaff.length > 0 ? (
            <div className="divide-y divide-[#F4F5F7]">
              {filteredStaff.map((member: StaffMember) => (
                <div
                  key={member.id}
                  className="grid gap-3 p-3.5 md:grid-cols-[minmax(0,1fr)_130px_110px_120px_56px] md:items-center md:gap-2"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F4F5F7] text-[11px] font-extrabold text-[#3D4149]">
                      {member.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-bold text-[#14161A]">
                        {member.name}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] font-medium text-[#A2A7B0]">
                        <Mail className="h-3 w-3 shrink-0" />
                        {member.email}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-[6px] px-2 py-0.5 text-[10.5px] font-bold ${ROLE_BADGE_CLASSES[member.role]}`}
                    >
                      {ROLE_LABELS[member.role]}
                    </span>
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-[6px] px-2 py-0.5 text-[10.5px] font-bold ${
                        member.status === "active"
                          ? "bg-[#E9F7EF] text-[#1B7F4C]"
                          : "bg-[#FFF4DE] text-[#B7791F]"
                      }`}
                    >
                      {member.status === "active" ? "Ativo" : "Pendente"}
                    </span>
                  </div>

                  <div className="hidden items-center gap-1.5 text-[11.5px] font-bold text-[#5B6472] md:flex">
                    <CalendarDays className="h-3.5 w-3.5 text-[#A2A7B0]" />
                    {formatDate(member.invitedAt)}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRequestRemove(member)}
                      className="h-7 w-7 cursor-pointer rounded-[7px] bg-[#FDEEEE] text-[#D64545] hover:bg-[#FADADA] hover:text-[#B83232]"
                      aria-label={`Remover ${member.name}`}
                      title="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[8px] bg-[#FFF7ED] text-[#FF6B00]">
                <UserCog className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-bold text-[#14161A]">
                Nenhum membro encontrado
              </p>
              <p className="mt-1 text-xs font-medium text-[#8A8F99]">
                {searchQuery
                  ? "Tente outro termo de busca"
                  : "Convide o primeiro membro da equipe"}
              </p>
            </div>
          )}
        </section>
      </div>

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-h-[90vh] rounded-[8px] p-0 sm:max-w-[440px]">
          <DialogHeader className="border-b border-[#E9EAEE] px-4 pb-3 pt-4 sm:px-6">
            <DialogTitle className="text-lg font-extrabold text-[#14161A]">
              Convidar Membro
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-[#8A8F99]">
              Envie um convite por e-mail para um novo membro da equipe.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 px-4 py-4 sm:px-6">
            <div className="grid gap-1.5">
              <Label htmlFor="invite-email" className="text-xs">
                E-mail *
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormField("email", e.target.value)}
                placeholder="pessoa@email.com"
                className="h-10 rounded-xl border-[#E9EAEE] text-xs focus-visible:ring-orange-200"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="invite-role" className="text-xs">
                Função *
              </Label>
              <select
                id="invite-role"
                value={formData.role}
                onChange={(e) => updateFormField("role", e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E9EAEE] bg-white px-3 text-xs font-medium text-[#14161A] outline-none focus:border-orange-300"
              >
                {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="border-t border-[#E9EAEE] px-4 py-3 sm:px-6">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              className="cursor-pointer rounded-[8px] border-[#E9EAEE] text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendInvite}
              className="cursor-pointer rounded-[8px] bg-[#FF6B00] text-xs font-bold text-white hover:bg-[#E05F00]"
            >
              Enviar Convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && handleCancelRemove()}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-[8px] bg-white text-center shadow-2xl sm:w-fit">
          <div className="mx-auto mt-2 flex h-12 w-12 items-center justify-center rounded-[8px] bg-yellow-100">
            <TriangleAlert className="h-6 w-6 text-yellow-600" />
          </div>

          <AlertDialogHeader className="space-y-3 px-4">
            <AlertDialogTitle className="text-center text-xl font-bold text-[#14161A]">
              Remover da equipe?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm text-[#8A8F99]">
              <span className="block">
                <strong className="text-[#14161A]">
                  {removeTarget?.name}
                </strong>{" "}
                vai perder o acesso ao painel da empresa.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex w-full flex-row gap-3 px-4 pb-2 pt-2">
            <Button
              variant="outline"
              onClick={handleCancelRemove}
              className="h-10 flex-1 cursor-pointer rounded-[8px] border-[#E9EAEE] font-medium text-[#3D4149] hover:bg-[#F7F8FA]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRemove}
              className="h-10 flex-1 cursor-pointer rounded-[8px] bg-red-600 font-medium text-white hover:bg-red-700"
            >
              Remover
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  );
}

export default function TeamManagementPage() {
  return (
    <ProtectedRoute allowedRoles={["owner", "admin", "manager"]}>
      <TeamManagementContent />
    </ProtectedRoute>
  );
}
