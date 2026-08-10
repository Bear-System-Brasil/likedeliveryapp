"use client";

import { AdminPageLayout } from "@/components/admin-page-layout";
import { CompanyCoverUpload } from "@/components/company-cover-upload";
import { CompanyLogoUpload } from "@/components/company-logo-upload";
import { DataCard } from "@/components/data-card";
import { FormField } from "@/components/form-field";
import ProtectedRoute from "@/components/protected-route";
import { ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/custom";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RESTAURANT_CATEGORIES } from "@/constants";
import { useCompanyProfileManagement, useSpecialities } from "@/hooks";
import { formatCnpj, formatPhoneDisplay } from "@/utils";
import {
  Building2,
  Edit3,
  IdCard,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Save,
  Star,
  User,
  X,
} from "lucide-react";

export default function CompanyProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      <CompanyProfileContent />
    </ProtectedRoute>
  );
}

function CompanyProfileContent() {
  const {
    // Auth & Loading
    user,
    isMounted,
    isLoadingProfile,
    isLoadingAddresses,
    profileError,

    // Company Profile
    formData,
    isEditing,
    isSaving,
    selectedCategory,
    isSavingSpeciality,
    handleSaveProfile,
    handleSaveSpeciality,
    handleCancelEdit,
    setIsEditing,
    updateFormField,
    setSelectedCategory,

    // Addresses
    addresses,
    newAddress,
    isAddingAddress,
    editingAddressId,
    setIsAddingAddress,
    handleSaveAddress,
    handleEditAddress,
    handleCancelAddressEdit,
    handleDeleteAddress,
    handleSearchZipCode,
    updateAddressField,
    resetAddressForm,
    formatZipCode,

    // Password
    passwordData,
    passwordErrors,
    isChangingPassword,
    setIsChangingPassword,
    handleChangePassword,
    updatePasswordField,
    resetPasswordForm,
  } = useCompanyProfileManagement();

  // Fetch specialities from backend, fallback to RESTAURANT_CATEGORIES
  const { data: specialities } = useSpecialities();
  const specialityOptions =
    specialities && specialities.length > 0
      ? specialities.map((s) => ({ id: s.id, name: s.name }))
      : RESTAURANT_CATEGORIES.map((c) => ({ id: c.id, name: c.name }));

  if (!isMounted || !user) {
    return null;
  }

  const userRoleLabel =
    user.role === "owner"
      ? "Proprietário"
      : user.role === "admin"
        ? "Admin"
        : "Gerente";

  return (
    <AdminPageLayout
      title="Perfil da Empresa"
      icon={Building2}
      mainClassName="px-4 py-8 lg:pl-64 lg:pr-8"
      actions={
        <Badge className="border-0 bg-linear-to-br from-orange-100 to-orange-100 text-orange-700">
          {userRoleLabel}
        </Badge>
      }
    >
      {/* Error State */}
      {profileError && !isLoadingProfile && (
        <div className="max-w-4xl mx-auto">
          <ErrorState message={profileError} />
        </div>
      )}

      {/* Content */}
      {!profileError && (
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Logo Section */}
          <DataCard
            title="Logo do Restaurante"
            icon={<Building2 className="h-5 w-5" />}
          >
            {isLoadingProfile ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Skeleton className="w-48 h-48 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            ) : (
              <CompanyLogoUpload
                value={formData.logo_url}
                onChange={(url) => updateFormField("logo_url", url)}
                companyId={user?.companyId || user?.id || ""}
                companyData={{
                  tradeName: formData.tradeName,
                  legalName: formData.legalName,
                  cnpj: formData.cnpj,
                  email: formData.email,
                  phone: formData.phone,
                }}
                label="Alterar Logo"
              />
            )}
          </DataCard>

          {/* Cover Section */}
          <DataCard
            title="Imagem de Capa"
            icon={<Building2 className="h-5 w-5" />}
          >
            {isLoadingProfile ? (
              <Skeleton className="w-full h-64 rounded-2xl" />
            ) : (
              <CompanyCoverUpload
                value={formData.cover_url}
                onChange={(url) => updateFormField("cover_url", url)}
                companyId={user?.companyId || user?.id || ""}
                companyData={{
                  tradeName: formData.tradeName,
                  legalName: formData.legalName,
                  cnpj: formData.cnpj,
                  email: formData.email,
                  phone: formData.phone,
                }}
                label="Alterar Capa"
              />
            )}
          </DataCard>

          {/* Company Information */}
          <DataCard
            title="Informações da Empresa"
            icon={<Building2 className="h-5 w-5" />}
            actions={
              !isLoadingProfile && !isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl border-gray-200"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              ) : !isLoadingProfile ? (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="rounded-xl border-gray-200"
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <GradientButton
                    size="sm"
                    onClick={handleSaveProfile}
                    isLoading={isSaving}
                    loadingText="Salvando..."
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </GradientButton>
                </div>
              ) : null
            }
          >
            {isLoadingProfile ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-9 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Nome Fantasia"
                    id="tradeName"
                    icon={<User className="h-4 w-4" />}
                    inputProps={{
                      value: formData.tradeName,
                      onChange: (e) =>
                        updateFormField("tradeName", e.target.value),
                      disabled: !isEditing,
                      placeholder: "Nome do seu restaurante",
                      maxLength: 125,
                    }}
                  />

                  <FormField
                    label="Razão Social"
                    id="legalName"
                    icon={<Building2 className="h-4 w-4" />}
                    inputProps={{
                      value: formData.legalName,
                      onChange: (e) =>
                        updateFormField("legalName", e.target.value),
                      disabled: !isEditing,
                      placeholder: "Razão social da empresa",
                      maxLength: 125,
                    }}
                  />

                  <FormField
                    label="CNPJ"
                    id="cnpj"
                    icon={<IdCard className="h-4 w-4" />}
                    inputProps={{
                      value: formatCnpj(formData.cnpj),
                      onChange: (e) =>
                        updateFormField(
                          "cnpj",
                          e.target.value.replace(/\D/g, ""),
                        ),
                      disabled: !isEditing,
                      placeholder: "00.000.000/0000-00",
                      maxLength: 18,
                    }}
                  />

                  <FormField
                    label="E-mail"
                    id="email"
                    icon={<Mail className="h-4 w-4" />}
                    inputProps={{
                      type: "email",
                      value: formData.email,
                      onChange: (e) => updateFormField("email", e.target.value),
                      disabled: !isEditing,
                      placeholder: "contato@restaurante.com",
                    }}
                  />

                  <FormField
                    label="Telefone"
                    id="phone"
                    icon={<Phone className="h-4 w-4" />}
                    inputProps={{
                      type: "tel",
                      value: formatPhoneDisplay(formData.phone),
                      onChange: (e) =>
                        updateFormField(
                          "phone",
                          e.target.value.replace(/\D/g, ""),
                        ),
                      disabled: !isEditing,
                      placeholder: "(00) 00000-0000",
                      maxLength: 15,
                    }}
                  />

                  {/* Tipo de Restaurante - Solução temporária com categorias locais */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="mainCategoryId"
                      className="flex items-center space-x-2"
                    >
                      <Package className="h-4 w-4 text-gray-500" />
                      <span>Tipo de Restaurante</span>
                    </Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) => {
                        setSelectedCategory(value);
                        if (specialities && specialities.length > 0) {
                          handleSaveSpeciality(value);
                        }
                      }}
                      disabled={!isEditing || isSavingSpeciality}
                    >
                      <SelectTrigger className="rounded-xl border-2 border-gray-200 focus:border-orange-400">
                        <SelectValue placeholder="Selecione o tipo de restaurante" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {specialityOptions.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(!specialities || specialities.length === 0) && (
                      <p className="text-xs text-amber-600 font-medium">
                        ⚠️ Especialidades não encontradas no servidor - usando
                        lista local
                      </p>
                    )}
                  </div>
                </form>
              </>
            )}
          </DataCard>

          {/* Company Address */}
          <DataCard
            title="Endereço da Empresa"
            icon={<MapPin className="h-5 w-5" />}
            actions={
              !isLoadingAddresses && !isAddingAddress ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingAddress(true)}
                  className="rounded-xl border-gray-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              ) : null
            }
          >
            {isLoadingAddresses ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            ) : (!Array.isArray(addresses) || addresses.length === 0) &&
              !isAddingAddress ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">Nenhum endereço cadastrado</p>
                <GradientButton onClick={() => setIsAddingAddress(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Endereço
                </GradientButton>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Existing Addresses */}
                {Array.isArray(addresses) &&
                  addresses.map((address) => (
                    <div
                      key={address.id}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">
                              {address.street}, {address.number}
                            </p>
                            {address.isDefault && (
                              <Badge className="bg-linear-to-r from-orange-500 to-orange-500 text-white border-0 text-xs flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current" />
                                Padrão
                              </Badge>
                            )}
                          </div>
                          {address.complement && (
                            <p className="text-sm text-gray-600">
                              {address.complement}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            {address.neighborhood} - {address.city}/
                            {address.state}
                          </p>
                          <p className="text-sm text-gray-600">
                            CEP: {formatZipCode(address.zipCode)}
                          </p>
                          {address.reference && (
                            <p className="text-xs text-gray-500 mt-1">
                              Referência: {address.reference}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAddress(address)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Add/Edit Address Form */}
                {isAddingAddress && (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {editingAddressId ? "Editar Endereço" : "Novo Endereço"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <FormField
                          label="CEP"
                          id="zipCode"
                          icon={<MapPin className="h-4 w-4" />}
                          inputProps={{
                            value: formatZipCode(newAddress.zipCode),
                            onChange: (e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              updateAddressField("zipCode", value);
                              if (value.length === 8)
                                handleSearchZipCode(value);
                            },
                            placeholder: "00000-000",
                            maxLength: 9,
                          }}
                        />
                      </div>
                      <FormField
                        label="Rua"
                        id="street"
                        inputProps={{
                          value: newAddress.street,
                          onChange: (e) =>
                            updateAddressField("street", e.target.value),
                          placeholder: "Nome da rua",
                        }}
                      />
                      <FormField
                        label="Número"
                        id="number"
                        inputProps={{
                          value: newAddress.number,
                          onChange: (e) =>
                            updateAddressField("number", e.target.value),
                          placeholder: "123",
                        }}
                      />
                      <FormField
                        label="Bairro"
                        id="neighborhood"
                        inputProps={{
                          value: newAddress.neighborhood,
                          onChange: (e) =>
                            updateAddressField("neighborhood", e.target.value),
                          placeholder: "Nome do bairro",
                        }}
                      />
                      <FormField
                        label="Cidade"
                        id="city"
                        inputProps={{
                          value: newAddress.city,
                          onChange: (e) =>
                            updateAddressField("city", e.target.value),
                          placeholder: "Nome da cidade",
                        }}
                      />
                      <FormField
                        label="Estado"
                        id="state"
                        inputProps={{
                          value: newAddress.state,
                          onChange: (e) =>
                            updateAddressField("state", e.target.value),
                          placeholder: "UF",
                          maxLength: 2,
                        }}
                      />
                      <FormField
                        label="Complemento"
                        id="complement"
                        inputProps={{
                          value: newAddress.complement,
                          onChange: (e) =>
                            updateAddressField("complement", e.target.value),
                          placeholder: "Apto, sala, etc (opcional)",
                        }}
                      />
                      <div className="md:col-span-2">
                        <FormField
                          label="Referência"
                          id="reference"
                          inputProps={{
                            value: newAddress.reference,
                            onChange: (e) =>
                              updateAddressField("reference", e.target.value),
                            placeholder: "Ponto de referência (opcional)",
                          }}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={newAddress.isDefault}
                            onChange={(e) =>
                              updateAddressField("isDefault", e.target.checked)
                            }
                            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <label
                            htmlFor="isDefault"
                            className="text-sm font-medium text-gray-700 cursor-pointer"
                          >
                            Definir como endereço padrão
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelAddressEdit}
                        className="flex-1 rounded-xl"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <GradientButton
                        onClick={handleSaveAddress}
                        size="sm"
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {editingAddressId
                          ? "Atualizar Endereço"
                          : "Salvar Endereço"}
                      </GradientButton>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DataCard>

          {/* Security - Change Password */}
          <DataCard title="Segurança" icon={<Lock className="h-5 w-5" />}>
            {!isChangingPassword ? (
              <Button
                variant="outline"
                onClick={() => setIsChangingPassword(true)}
                className="w-full justify-start rounded-xl border-gray-200 cursor-pointer"
              >
                <Lock className="h-4 w-4 mr-2" />
                Alterar Senha
              </Button>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Alterar Senha</h3>
                <FormField
                  label="Senha Atual"
                  id="currentPassword"
                  icon={<Lock className="h-4 w-4" />}
                  inputProps={{
                    type: "password",
                    value: passwordData.currentPassword,
                    onChange: (e) =>
                      updatePasswordField("currentPassword", e.target.value),
                    placeholder: "Digite sua senha atual",
                  }}
                />
                <FormField
                  label="Nova Senha"
                  id="newPassword"
                  icon={<Lock className="h-4 w-4" />}
                  inputProps={{
                    type: "password",
                    value: passwordData.newPassword,
                    onChange: (e) =>
                      updatePasswordField("newPassword", e.target.value),
                    placeholder: "Digite a nova senha",
                  }}
                />
                {passwordErrors.length > 0 && (
                  <div className="text-xs text-red-600 space-y-1">
                    <p className="font-medium">Requisitos não atendidos:</p>
                    <ul className="list-disc list-inside">
                      {passwordErrors.map((error: string, i: number) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <FormField
                  label="Confirmar Nova Senha"
                  id="confirmPassword"
                  icon={<Lock className="h-4 w-4" />}
                  inputProps={{
                    type: "password",
                    value: passwordData.confirmPassword,
                    onChange: (e) =>
                      updatePasswordField("confirmPassword", e.target.value),
                    placeholder: "Digite a nova senha novamente",
                  }}
                />
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsChangingPassword(false);
                      resetPasswordForm();
                    }}
                    className="flex-1 rounded-xl"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <GradientButton
                    onClick={handleChangePassword}
                    size="sm"
                    disabled={passwordErrors.length > 0}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </GradientButton>
                </div>
              </div>
            )}
          </DataCard>
        </div>
      )}
    </AdminPageLayout>
  );
}
