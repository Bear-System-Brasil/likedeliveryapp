import { apiService, type InviteStaffRequest, type StaffRole } from "@/services/api";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

// O tipo mora em services/api.ts, junto do contrato de POST /company/invite.
// Reexportado aqui porque a tela importa de "@/hooks".
export type { StaffRole };

/**
 * Mensagem por status quando o backend não manda uma própria. `apiRequest`
 * preenche `message` com "Erro 409: Conflict" nesse caso, o que não ajuda
 * ninguém na tela - daí o regex que detecta esse texto genérico.
 */
const INVITE_ERROR_BY_STATUS: Record<number, string> = {
  400: "Convite inválido. Confira o e-mail e a função selecionada.",
  403: "Você não tem permissão para convidar membros para esta equipe.",
  409: "Esse e-mail já está na equipe ou já tem um convite pendente.",
};

const GENERIC_API_MESSAGE = /^Erro \d+:/;

/**
 * Escolhe o que mostrar quando o convite falha: a mensagem do backend tem
 * prioridade, o mapa por status cobre quando ela veio genérica ou nem veio,
 * e o texto final é a rede de segurança (ex.: falha de conexão, sem status).
 */
export function resolveInviteErrorMessage(response: {
  message?: string;
  status?: number;
}): string {
  const fromBackend =
    response.message && !GENERIC_API_MESSAGE.test(response.message)
      ? response.message
      : undefined;
  const byStatus = response.status
    ? INVITE_ERROR_BY_STATUS[response.status]
    : undefined;

  return fromBackend || byStatus || "Não foi possível enviar o convite";
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: "active" | "pending";
  invitedAt: string;
}

interface InviteFormData {
  email: string;
  role: StaffRole;
}

const emptyInvite: InviteFormData = { email: "", role: "cook" };

// TODO(backend): o convite já é real (POST /company/invite), mas ainda não
// existe endpoint de listagem de staff - então esta lista é mock local e não
// persiste entre sessões. Um convite enviado com sucesso é ecoado aqui só
// pra dar retorno visual; quem manda é o servidor.
const MOCK_INITIAL_STAFF: StaffMember[] = [
  {
    id: "mock-1",
    name: "João Cozinha",
    email: "joao.cozinha@exemplo.com",
    role: "cook",
    status: "active",
    invitedAt: "2026-06-02T10:00:00.000Z",
  },
  {
    id: "mock-2",
    name: "Marina Entregas",
    email: "marina.entregas@exemplo.com",
    role: "delivery",
    status: "active",
    invitedAt: "2026-06-10T10:00:00.000Z",
  },
];

/**
 * Hook para gerenciar a equipe da empresa.
 *
 * O convite chama POST /company/invite de verdade. A listagem e a remoção
 * continuam locais (mock) enquanto o backend não expõe os endpoints.
 */
export const useTeamManagement = () => {
  const [staff, setStaff] = useState<StaffMember[]>(MOCK_INITIAL_STAFF);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<InviteFormData>(emptyInvite);
  const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStaff = staff.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleOpenInviteModal = () => {
    setFormData(emptyInvite);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(emptyInvite);
  };

  const updateFormField = (field: keyof InviteFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteStaffRequest) => {
      const response = await apiService.companies.invite(data);
      if (!response.success) {
        throw new Error(resolveInviteErrorMessage(response));
      }
      return response.data;
    },
    onSuccess: (invite, variables) => {
      // Eco local do convite aceito pelo servidor - a lista ainda é mock.
      const newMember: StaffMember = {
        id: invite?.id || `invite-${Date.now()}`,
        name: variables.email.split("@")[0],
        email: variables.email,
        role: variables.staffRole,
        status: "pending",
        invitedAt:
          invite?.invitedAt ||
          invite?.createdAt ||
          invite?.created_at ||
          new Date().toISOString(),
      };

      setStaff((prev) => [...prev, newMember]);
      toast.success(`Convite enviado para ${variables.email}`);
      handleCloseModal();
    },
    onError: (error: Error) =>
      toast.error(error.message || "Não foi possível enviar o convite"),
  });

  // A checagem de duplicado saiu daqui de propósito: ela só enxergava o mock
  // local, e quem sabe de verdade quem já foi convidado é o backend - que
  // responde 409 nesse caso.
  const handleSendInvite = () => {
    const email = formData.email.trim();
    if (!email) {
      toast.error("Informe o e-mail do convidado");
      return;
    }

    // `role` no formulário, `staffRole` no corpo - é o nome que o DTO valida.
    inviteMutation.mutate({ email, staffRole: formData.role });
  };

  const handleRequestRemove = (member: StaffMember) => {
    setRemoveTarget(member);
  };

  const handleCancelRemove = () => {
    setRemoveTarget(null);
  };

  const handleConfirmRemove = () => {
    if (!removeTarget) return;
    setStaff((prev) => prev.filter((member) => member.id !== removeTarget.id));
    toast.success(`${removeTarget.name} removido da equipe`);
    setRemoveTarget(null);
  };

  return {
    staff: filteredStaff,
    allStaff: staff,
    searchQuery,
    setSearchQuery,

    isModalOpen,
    formData,
    removeTarget,
    isInviting: inviteMutation.isPending,

    handleOpenInviteModal,
    handleCloseModal,
    updateFormField,
    handleSendInvite,
    handleRequestRemove,
    handleCancelRemove,
    handleConfirmRemove,
  };
};
