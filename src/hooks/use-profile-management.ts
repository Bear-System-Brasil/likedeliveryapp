import { apiService } from "@/services/api";
import { useAuthStore } from "@/stores";
import { onlyNumbers } from "@/utils";
import { isCompanyRole } from "@/utils/role-helpers";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useProfile } from "./use-api";
import {
  AddressFormData,
  ProfileFormData,
  useAddressForm,
  useProfileForm,
} from "./use-form-validation";
import { useToggle } from "./use-toggle";

interface Address extends AddressFormData {
  id: string;
  type?: string;
}

/**
 * Hook para gerenciar perfil do usuário (cliente)
 * Inclui: dados pessoais, foto, endereços
 */
export const useProfileManagement = () => {
  const router = useRouter();
  const { user, isAuthenticated, updateUser, _hasHydrated } = useAuthStore();
  const { updateProfile } = useProfile();

  // Profile state
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // CEP state
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [lastFetchedCep, setLastFetchedCep] = useState<string | null>(null);

  // Form management with validation
  const profileForm = useProfileForm({
    name: user?.name || "",
    email: user?.email || "",
    cpf: user?.cpf || "",
    phone: user?.phone || "",
    birthDate: user?.birthDate || "",
  });
  const addressForm = useAddressForm();

  // UI state management with custom hooks
  const editingState = useToggle();
  const addingAddressState = useToggle();

  // Watch CEP field changes
  const watchedZipCode = addressForm.watch("zipCode");

  /**
   * Prevent SSR issues
   */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Fetch user profile data
   */
  useEffect(() => {
    if (!isMounted) return;

    const fetchUserProfile = async () => {
      if (!isAuthenticated) {
        router.push("/?auth=required");
        return;
      }

      if (isCompanyRole(user?.role)) {
        router.push("/company-profile");
        return;
      }

      setIsLoadingProfile(true);
      setProfileError(null);

      try {
        const response = await apiService.getMe();
        if (response.success && response.data) {
          updateUser(response.data);
        } else {
          setProfileError(response.message || "Erro ao carregar perfil");
        }
      } catch (error) {
        setProfileError("Erro de conexão ao carregar perfil");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, router, updateUser, user?.id, user?.role, isMounted]);

  /**
   * Função para buscar endereços do backend
   */
  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoadingAddresses(true);
    try {
      const response = await apiService.address.getUserAddresses();
      if (response.success && response.data) {
        const addressesData = Array.isArray(response.data) ? response.data : [];

        const userAddresses = addressesData.filter((addr) => {
          // Soft delete: isActive: false não some do banco, então precisa
          // ser filtrado aqui pra não reaparecer endereço "removido".
          if (addr.isActive === false) return false;
          if (addr.customerId === user.id) return true;
          if (!addr.customerId && !addr.companyId) return true;
          return false;
        });

        setAddresses(
          userAddresses.map((addr) => ({
            id: addr.id,
            type: "Endereço",
            street: addr.street,
            number: addr.number,
            complement: addr.complement || "",
            neighborhood: addr.neighborhood,
            longitude: addr.longitude,
            latitude: addr.latitude,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode,
            isDefault: (addr as any).isDefault ?? false,
          })),
        );
      } else if (!response.success) {
        setAddresses([]);
      }
    } catch (error) {
      setAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [isAuthenticated, user]);

  /**
   * Fetch user addresses on mount
   */
  useEffect(() => {
    if (!isMounted) return;
    fetchAddresses();
  }, [isMounted, fetchAddresses]);

  /**
   * Auto-fetch CEP when complete (8 digits)
   */
  useEffect(() => {
    if (watchedZipCode) {
      const cleanCep = onlyNumbers(watchedZipCode);
      if (cleanCep.length === 8 && cleanCep !== lastFetchedCep) {
        fetchCepData(watchedZipCode);
        setLastFetchedCep(cleanCep);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedZipCode]);

  /**
   * Buscar CEP na BrasilAPI
   */
  const fetchCepData = async (cep: string) => {
    const cleanCep = onlyNumbers(cep);
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cep/v2/${cleanCep}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("CEP não encontrado");
        } else {
          toast.error("Erro ao buscar CEP");
        }
        return;
      }

      const data = await response.json();
      addressForm.setValue("street", data.street || "");
      addressForm.setValue("neighborhood", data.neighborhood || "");
      addressForm.setValue("city", data.city || "");
      addressForm.setValue("state", data.state || "");
      toast.success("CEP encontrado! Campos preenchidos automaticamente");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP. Verifique sua conexão.");
    } finally {
      setIsLoadingCep(false);
    }
  };

  /**
   * Formatar CEP com máscara
   */
  const formatCep = (value: string) => {
    const cleanValue = onlyNumbers(value);
    if (cleanValue.length <= 5) {
      return cleanValue;
    }
    return `${cleanValue.slice(0, 5)}-${cleanValue.slice(5, 8)}`;
  };

  /**
   * Salvar alterações do perfil
   */
  const handleSaveProfile = async (data: ProfileFormData) => {
    if (!user?.id) return;

    try {
      await updateProfile.mutateAsync({ id: user.id, ...data });
      updateUser({ ...user, ...data });
      editingState.close();
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar perfil");
    }
  };

  /**
   * Cancelar edição do perfil
   */
  const handleCancelEdit = () => {
    profileForm.reset();
    editingState.close();
  };

  /**
   * Atualizar foto do perfil
   */
  const handleUpdatePhoto = (url: string) => {
    if (!user) return;
    updateUser({ ...user, photoUrl: url });
  };

  /**
   * Abrir modal para editar endereço
   */
  const handleEditAddress = (address: Address) => {
    addressForm.reset({
      street: address.street,
      number: address.number,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      type: address.type,
      complement: address.complement || "",
      longitude: address.longitude,
      latitude: address.latitude,
      isDefault: address.isDefault ?? false,
    });

    setEditingAddressId(address.id);
    setLastFetchedCep(onlyNumbers(address.zipCode));
    addingAddressState.open();
  };

  /**
   * Salvar endereço (cria ou atualiza)
   */
  const handleAddAddress = async (data: AddressFormData) => {
    // No PATCH (diferente do POST), complement exige mínimo de 5 caracteres
    // quando preenchido (ver adress.md) - um endereço criado com complemento
    // curto (ex: "301") ficaria impossível de editar sem esse aviso.
    const trimmedComplement = data.complement?.trim() ?? "";
    if (
      editingAddressId &&
      trimmedComplement.length > 0 &&
      trimmedComplement.length < 5
    ) {
      toast.error("Complemento deve ter pelo menos 5 caracteres (ou ficar vazio)");
      return;
    }

    setIsSavingAddress(true);
    try {
      const payload = {
        street: data.street,
        number: data.number,
        complement: data.complement || undefined,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        longitude: data.longitude,
        latitude: data.latitude,
        zipCode: onlyNumbers(data.zipCode),
        isDefault: data.isDefault ?? false,
      };

      // Se for marcado como padrão, desmarca os outros
      if (payload.isDefault) {
        const currentAddresses = await apiService.address.getUserAddresses();
        if (currentAddresses.success && currentAddresses.data) {
          const backendAddresses = Array.isArray(currentAddresses.data)
            ? currentAddresses.data
            : [];

          const backendDefaults = backendAddresses.filter(
            (addr) => (addr as any).isDefault,
          );

          for (const addr of backendDefaults) {
            if (editingAddressId && addr.id === editingAddressId) continue;

            try {
              await apiService.address.updateUserAddress(addr.id, {
                isDefault: false,
                latitude: addr.latitude,
                longitude: addr.longitude,
              });
            } catch (error) {
              console.error("Erro ao desmarcar endereço padrão:", error);
            }
          }
        }
      }

      let response;

      if (editingAddressId) {
        // UPDATE
        response = await apiService.address.updateUserAddress(
          editingAddressId,
          payload,
        );
      } else {
        // CREATE
        response = await apiService.address.createUserAddress(payload);
      }

      if (response.success) {
        await fetchAddresses();
        addressForm.reset();
        setEditingAddressId(null);
        addingAddressState.close();
        setLastFetchedCep(null);

        toast.success(
          editingAddressId
            ? "Endereço atualizado com sucesso!"
            : "Endereço adicionado com sucesso!",
        );
      } else {
        toast.error(
          response.message ||
            (editingAddressId
              ? "Erro ao atualizar endereço"
              : "Erro ao adicionar endereço"),
        );
      }
    } catch (error) {
      toast.error(
        editingAddressId
          ? "Erro ao atualizar endereço"
          : "Erro ao adicionar endereço",
      );
    } finally {
      setIsSavingAddress(false);
    }
  };

  /**
   * Fechar modal de endereço
   */
  const handleCloseAddressModal = () => {
    addressForm.reset();
    setLastFetchedCep(null);
    setEditingAddressId(null);
    addingAddressState.close();
  };

  /**
   * Deletar endereço
   */
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Tem certeza que deseja excluir este endereço?")) return;

    try {
      const response = await apiService.address.deleteUserAddress(addressId);
      if (response.success) {
        setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
        toast.success("Endereço excluído com sucesso!");
      } else {
        toast.error(response.message || "Erro ao excluir endereço");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Erro ao excluir endereço");
    }
  };

  return {
    // Auth & Loading
    user,
    isMounted,
    isAuthenticated,
    hasHydrated: _hasHydrated,
    isLoadingProfile,
    profileError,
    // Profile
    profileForm,
    editingState,
    updateProfile,
    handleSaveProfile,
    handleCancelEdit,
    handleUpdatePhoto,
    // Addresses
    addresses,
    isLoadingAddresses,
    addressForm,
    addingAddressState,
    isSavingAddress,
    handleAddAddress,
    handleCloseAddressModal,
    handleDeleteAddress,
    handleEditAddress,
    editingAddressId,
    // CEP
    isLoadingCep,
    formatCep,
    watchedZipCode,
  };
};
