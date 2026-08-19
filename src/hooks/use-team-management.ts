import { useState } from "react";
import { toast } from "sonner";

export type StaffRole = "admin" | "manager" | "cook" | "delivery";

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

// TODO(backend): sem endpoint de listagem de staff ainda - dado mock local,
// não persiste entre sessões. POST /company/invite (já documentado) resolve
// só o convite, não a listagem de quem já está na equipe.
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
 * MOCK: estado local, sem chamada de API - aguardando endpoint de listagem
 * de staff no backend.
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

  const handleSendInvite = () => {
    if (!formData.email.trim()) {
      toast.error("Informe o e-mail do convidado");
      return;
    }

    const alreadyInvited = staff.some(
      (member) => member.email.toLowerCase() === formData.email.toLowerCase(),
    );
    if (alreadyInvited) {
      toast.error("Esse e-mail já foi convidado");
      return;
    }

    const newMember: StaffMember = {
      id: `mock-${Date.now()}`,
      name: formData.email.split("@")[0],
      email: formData.email.trim(),
      role: formData.role,
      status: "pending",
      invitedAt: new Date().toISOString(),
    };

    setStaff((prev) => [...prev, newMember]);
    toast.success(`Convite enviado para ${formData.email}`);
    handleCloseModal();
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

    handleOpenInviteModal,
    handleCloseModal,
    updateFormField,
    handleSendInvite,
    handleRequestRemove,
    handleCancelRemove,
    handleConfirmRemove,
  };
};
