"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { useProfileManagement } from "@/hooks";

import { User } from "lucide-react";

import { GradientButton } from "@/components/ui/custom";
import { Skeleton } from "@/components/ui/skeleton";

import { DataCard } from "@/components/data-card";
import { PageHeader } from "@/components/page-header";
import { Addresses } from "@/components/profile/addresses";
import { OrderHistory } from "@/components/profile/order-history";
import { PersonalInformation } from "@/components/profile/personal-information";
import { Security } from "@/components/profile/security";
import { UserPhotoUpload } from "@/components/user-photo-upload";
import { BottomBar } from "@/components/ui/bottom-bar";

export function ProfileWrapper() {
  const router = useRouter();
  const {
    // Auth & Loading
    user,
    isMounted,
    isAuthenticated,
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
    handleSetDefaultAddress,
    settingDefaultAddressId,

    // CEP
    isLoadingCep,
  } = useProfileManagement();

  // Redirect if not authenticated (must be before early returns)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/?openAuth=true");
    }
  }, [isAuthenticated, user, router]);

  // Prevent rendering during SSR/SSG
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Mostrar loading enquanto busca perfil
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-4 w-64 rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Mostrar erro se falhou ao carregar
  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Erro ao Carregar Perfil
          </h2>
          <p className="text-gray-600 mb-4">{profileError}</p>
          <GradientButton onClick={() => router.refresh()}>
            Tentar Novamente
          </GradientButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Meu Perfil"
          description="Gerencie suas informações pessoais"
          showBackButton
        />

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Profile Picture */}
          <DataCard title="Foto de Perfil" icon={<User className="h-5 w-5" />}>
            <UserPhotoUpload
              value={user.photoUrl || ""}
              onChange={handleUpdatePhoto}
              userId={user.id}
              userData={{
                name: user.name,
                email: user.email,
                cpf: user.cpf,
                phone: user.phone,
              }}
              label="Alterar Foto"
              maxSizeMB={2}
            />
          </DataCard>

          {/* Personal Information */}
          <PersonalInformation
            handleSaveProfile={handleSaveProfile}
            handleCancelEdit={handleCancelEdit}
            updateProfile={updateProfile}
            editingState={editingState}
            profileForm={profileForm}
            user={user}
          />

          {/* Order History */}
          <OrderHistory />

          {/* Addresses */}
          <Addresses
            handleCloseAddressModal={handleCloseAddressModal}
            handleDeleteAddress={handleDeleteAddress}
            handleAddAddress={handleAddAddress}
            handleSetDefaultAddress={handleSetDefaultAddress}
            addingAddressState={addingAddressState}
            isLoadingAddresses={isLoadingAddresses}
            isSavingAddress={isSavingAddress}
            isLoadingCep={isLoadingCep}
            addressForm={addressForm}
            addresses={addresses}
            settingDefaultAddressId={settingDefaultAddressId}
          />

          {/* Payment Methods - TODO: Integrar com backend */}
          {/* <DataCard
          title="Métodos de Pagamento"
          icon={<CreditCard className="h-5 w-5" />}
        >
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
            <p className="text-sm text-gray-500 mt-2">Em breve você poderá gerenciar seus métodos de pagamento</p>
          </div>
        </DataCard> */}

          {/* Order History - TODO: Integrar com backend */}
          {/* <DataCard
          title="Histórico de Pedidos"
          icon={<MapPin className="h-5 w-5" />}
        >
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nenhum pedido encontrado</p>
            <p className="text-sm text-gray-500 mt-2">Seus pedidos anteriores aparecerão aqui</p>
          </div>
        </DataCard> */}

          {/* Security */}
          <Security />
        </div>
      </div>
      <BottomBar activeTab="profile" />
    </>
  );
}
