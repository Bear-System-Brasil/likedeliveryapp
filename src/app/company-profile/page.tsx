"use client";

import { AdminPageLayout } from "@/components/admin-page-layout";
import { CompanyCoverUpload } from "@/components/company-cover-upload";
import { CompanyLogoUpload } from "@/components/company-logo-upload";
import ProtectedRoute from "@/components/protected-route";
import { Badge } from "@/components/ui/badge";
import { GradientButton } from "@/components/ui/custom";
import { Skeleton } from "@/components/ui/skeleton";
import { RESTAURANT_CATEGORIES } from "@/constants";
import { useCompanyProfileManagement, useSpecialities } from "@/hooks";
import { cn } from "@/lib/utils";
import { formatCnpj, formatPhoneDisplay } from "@/utils";
import {
  Building2,
  CreditCard,
  ExternalLink,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Save,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

export default function CompanyProfilePage() {
  return (
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      <CompanyProfileContent />
    </ProtectedRoute>
  );
}

function SectionCard({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[13px] border border-[#E9EAEE] bg-white p-4",
        className,
      )}
    >
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <div>
          <div className="text-[13px] font-extrabold text-[#14161A]">
            {title}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-[#A2A7B0]">
            {subtitle}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function IconInput({
  label,
  icon: Icon,
  ...inputProps
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <div className="mb-[5px] text-[11px] font-bold text-[#3D4149]">
        {label}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-[11px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[#A0A6B0]" />
        <input
          {...inputProps}
          className="h-[37px] w-full rounded-[9px] border border-[#E9EAEE] bg-white pl-[33px] pr-3 text-[12.5px] text-[#14161A] outline-none disabled:cursor-default disabled:text-[#3D4149]"
        />
      </div>
    </div>
  );
}

function CompactButton({
  children,
  variant = "ghost",
  ...props
}: {
  children: ReactNode;
  variant?: "ghost" | "outline";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "h-8 shrink-0 rounded-[9px] px-3.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "ghost" && "bg-[#F4F5F7] text-[#3D4149] hover:bg-[#E9EAEE]",
        variant === "outline" &&
          "border border-[#E9EAEE] bg-white text-[#3D4149] hover:bg-[#F4F5F7]",
      )}
    >
      {children}
    </button>
  );
}

function CompanyProfileContent() {
  const {
    user,
    isMounted,
    isLoadingProfile,
    isLoadingAddresses,
    profileError,

    formData,
    isEditing,
    isSaving,
    isOpen,
    selectedCategory,
    isSavingSpeciality,
    handleSaveProfile,
    handleSaveSpeciality,
    handleCancelEdit,
    setIsEditing,
    updateFormField,
    setSelectedCategory,

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
    formatZipCode,

    passwordData,
    passwordErrors,
    isChangingPassword,
    setIsChangingPassword,
    handleChangePassword,
    updatePasswordField,
    resetPasswordForm,
  } = useCompanyProfileManagement();

  const { data: specialities } = useSpecialities();
  const specialityOptions =
    specialities && specialities.length > 0
      ? specialities.map((s) => ({ id: s.id, name: s.name }))
      : RESTAURANT_CATEGORIES.map((c) => ({ id: c.id, name: c.name }));
  const selectedSpecialityName = specialityOptions.find(
    (s) => s.id === selectedCategory,
  )?.name;

  if (!isMounted || !user) {
    return null;
  }

  const companyId = user.companyId || user.id;
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
      mainClassName="p-4 pb-10 sm:p-6 lg:pl-64 lg:pr-8"
      actions={
        <Badge className="border-0 bg-linear-to-br from-orange-100 to-orange-100 text-orange-700">
          {userRoleLabel}
        </Badge>
      }
    >
      <div className="mx-auto max-w-[920px]">
        {profileError && !isLoadingProfile ? (
          <div className="rounded-[13px] border border-[#E9EAEE] bg-white p-6 text-center text-sm text-[#3D4149]">
            {profileError}
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="mb-4 flex items-start justify-between gap-4">
              <p className="text-[12.5px] font-medium text-[#8A8F99]">
                A identidade que aparece para o cliente no app
              </p>
              <Link href={`/restaurant/${companyId}`} target="_blank">
                <CompactButton variant="outline">
                  <span className="flex items-center gap-1.5">
                    Ver página pública
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </CompactButton>
              </Link>
            </div>

            {/* Hero card: cover + logo + summary */}
            <div className="mb-3 overflow-hidden rounded-[14px] border border-[#E9EAEE] bg-white">
              {isLoadingProfile ? (
                <Skeleton className="h-[150px] w-full rounded-none" />
              ) : (
                <CompanyCoverUpload
                  value={formData.cover_url}
                  onChange={(url) => updateFormField("cover_url", url)}
                  companyId={companyId}
                  companyData={{
                    tradeName: formData.tradeName,
                    legalName: formData.legalName,
                    cnpj: formData.cnpj,
                    email: formData.email,
                    phone: formData.phone,
                  }}
                />
              )}

              <div className="flex items-start gap-3.5 px-[18px] pb-4">
                {isLoadingProfile ? (
                  <Skeleton className="-mt-[30px] h-[76px] w-[76px] shrink-0 rounded-full border-[3px] border-white" />
                ) : (
                  <CompanyLogoUpload
                    value={formData.logo_url}
                    onChange={(url) => updateFormField("logo_url", url)}
                    companyId={companyId}
                    companyData={{
                      tradeName: formData.tradeName,
                      legalName: formData.legalName,
                      cnpj: formData.cnpj,
                      email: formData.email,
                      phone: formData.phone,
                    }}
                  />
                )}

                <div className="min-w-0 flex-1 pt-3">
                  {isLoadingProfile ? (
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-3.5 w-56" />
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[17px] font-extrabold tracking-tight text-[#14161A]">
                          {formData.tradeName || "Sua Empresa"}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-extrabold",
                            isOpen
                              ? "bg-[#E9F7EF] text-[#1B7F4C]"
                              : "bg-[#FDEEEE] text-[#D64545]",
                          )}
                        >
                          {isOpen ? "Aberto" : "Fechado"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1.5 text-[11.5px] font-semibold text-[#8A8F99]">
                        {selectedSpecialityName && (
                          <span className="whitespace-nowrap">
                            {selectedSpecialityName}
                          </span>
                        )}
                        <span className="whitespace-nowrap">
                          CNPJ {formatCnpj(formData.cnpj) || "—"}
                        </span>
                        <span className="whitespace-nowrap">
                          {formatPhoneDisplay(formData.phone) || "—"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t border-[#F4F5F7] bg-[#FAFAFB] px-[18px] py-2.5 text-[11px] font-semibold text-[#A2A7B0]">
                Clique nas imagens para enviar · capa 1200×400, logo quadrada ·
                até 5MB (JPG, PNG, GIF)
              </div>
            </div>

            {/* Informações da Empresa */}
            <SectionCard
              title="Informações da Empresa"
              subtitle="Dados fiscais e de contato"
              className="mb-3"
              actions={
                isLoadingProfile ? null : !isEditing ? (
                  <CompactButton onClick={() => setIsEditing(true)}>
                    Editar
                  </CompactButton>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <CompactButton
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      Cancelar
                    </CompactButton>
                    <GradientButton
                      size="sm"
                      onClick={handleSaveProfile}
                      isLoading={isSaving}
                      loadingText="Salvando..."
                      className="h-8 rounded-[9px] px-3.5 text-xs"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Salvar
                    </GradientButton>
                  </div>
                )
              }
            >
              {isLoadingProfile ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-[37px] w-full rounded-[9px]" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                  <IconInput
                    label="Nome Fantasia"
                    icon={User}
                    value={formData.tradeName}
                    onChange={(e) =>
                      updateFormField("tradeName", e.target.value)
                    }
                    disabled={!isEditing}
                    placeholder="Nome do seu restaurante"
                    maxLength={125}
                  />
                  <IconInput
                    label="Razão Social"
                    icon={Building2}
                    value={formData.legalName}
                    onChange={(e) =>
                      updateFormField("legalName", e.target.value)
                    }
                    disabled={!isEditing}
                    placeholder="Razão social da empresa"
                    maxLength={125}
                  />
                  <IconInput
                    label="CNPJ"
                    icon={CreditCard}
                    value={formatCnpj(formData.cnpj)}
                    onChange={(e) =>
                      updateFormField(
                        "cnpj",
                        e.target.value.replace(/\D/g, ""),
                      )
                    }
                    disabled={!isEditing}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                  <IconInput
                    label="E-mail"
                    icon={Mail}
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormField("email", e.target.value)}
                    disabled={!isEditing}
                    placeholder="contato@restaurante.com"
                  />
                  <IconInput
                    label="Telefone"
                    icon={Phone}
                    type="tel"
                    value={formatPhoneDisplay(formData.phone)}
                    onChange={(e) =>
                      updateFormField(
                        "phone",
                        e.target.value.replace(/\D/g, ""),
                      )
                    }
                    disabled={!isEditing}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                  <div>
                    <div className="mb-[5px] text-[11px] font-bold text-[#3D4149]">
                      Tipo de Restaurante
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        if (specialities && specialities.length > 0) {
                          handleSaveSpeciality(e.target.value);
                        }
                      }}
                      disabled={!isEditing || isSavingSpeciality}
                      className="h-[37px] w-full rounded-[9px] border border-[#E9EAEE] bg-white px-2.5 text-[12.5px] font-semibold text-[#14161A] outline-none disabled:cursor-default"
                    >
                      <option value="">Selecione o tipo de restaurante</option>
                      {specialityOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    {(!specialities || specialities.length === 0) && (
                      <p className="mt-1 text-[11px] font-medium text-amber-600">
                        ⚠️ Especialidades não encontradas no servidor - usando
                        lista local
                      </p>
                    )}
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Endereço da Empresa */}
            <SectionCard
              title="Endereço da Empresa"
              subtitle="O endereço padrão define o raio de entrega"
              className="mb-3"
              actions={
                !isLoadingAddresses && !isAddingAddress ? (
                  <CompactButton onClick={() => setIsAddingAddress(true)}>
                    <span className="flex items-center gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar
                    </span>
                  </CompactButton>
                ) : null
              }
            >
              {isLoadingAddresses ? (
                <Skeleton className="h-[62px] w-full rounded-[10px]" />
              ) : (!Array.isArray(addresses) || addresses.length === 0) &&
                !isAddingAddress ? (
                <div className="py-6 text-center">
                  <MapPin className="mx-auto mb-2 h-8 w-8 text-[#D8DBE0]" />
                  <p className="mb-3 text-[12.5px] text-[#8A8F99]">
                    Nenhum endereço cadastrado
                  </p>
                  <CompactButton onClick={() => setIsAddingAddress(true)}>
                    <span className="flex items-center gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar Endereço
                    </span>
                  </CompactButton>
                </div>
              ) : (
                <div className="space-y-2">
                  {Array.isArray(addresses) &&
                    addresses.map((address) => (
                      <div
                        key={address.id}
                        className="flex items-center gap-3 rounded-[10px] border border-[#E9EAEE] px-3 py-[11px]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[#FFF1E7] text-[#E05A00]">
                          <MapPin className="h-[15px] w-[15px]" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-bold text-[#14161A]">
                              {address.street}, {address.number}
                            </span>
                            {address.isDefault && (
                              <span className="flex shrink-0 items-center gap-1 rounded-md bg-[#FFF1E7] px-2 py-0.5 text-[10px] font-extrabold text-[#E05A00]">
                                <Star className="h-2.5 w-2.5 fill-current" />
                                Padrão
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 truncate text-[11.5px] font-medium text-[#8A8F99]">
                            {address.neighborhood} - {address.city}/
                            {address.state} · CEP{" "}
                            {formatZipCode(address.zipCode)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEditAddress(address)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F4F5F7] text-[#3D4149] hover:bg-[#E9EAEE]"
                        >
                          <Pencil className="h-[13px] w-[13px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(address.id)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FDEEEE] text-[#D64545] hover:bg-[#FBDEDE]"
                        >
                          <Trash2 className="h-[13px] w-[13px]" />
                        </button>
                      </div>
                    ))}

                  {isAddingAddress && (
                    <div className="rounded-[10px] border border-dashed border-[#D8DBE0] bg-[#FAFAFB] p-4">
                      <h3 className="mb-3 text-[13px] font-extrabold text-[#14161A]">
                        {editingAddressId ? "Editar Endereço" : "Novo Endereço"}
                      </h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <IconInput
                            label="CEP"
                            icon={MapPin}
                            value={formatZipCode(newAddress.zipCode)}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              updateAddressField("zipCode", value);
                              if (value.length === 8)
                                handleSearchZipCode(value);
                            }}
                            placeholder="00000-000"
                            maxLength={9}
                          />
                        </div>
                        <IconInput
                          label="Rua"
                          icon={MapPin}
                          value={newAddress.street}
                          onChange={(e) =>
                            updateAddressField("street", e.target.value)
                          }
                          placeholder="Nome da rua"
                        />
                        <IconInput
                          label="Número"
                          icon={MapPin}
                          value={newAddress.number}
                          onChange={(e) =>
                            updateAddressField("number", e.target.value)
                          }
                          placeholder="123"
                        />
                        <IconInput
                          label="Bairro"
                          icon={MapPin}
                          value={newAddress.neighborhood}
                          onChange={(e) =>
                            updateAddressField("neighborhood", e.target.value)
                          }
                          placeholder="Nome do bairro"
                        />
                        <IconInput
                          label="Cidade"
                          icon={MapPin}
                          value={newAddress.city}
                          onChange={(e) =>
                            updateAddressField("city", e.target.value)
                          }
                          placeholder="Nome da cidade"
                        />
                        <IconInput
                          label="Estado"
                          icon={MapPin}
                          value={newAddress.state}
                          onChange={(e) =>
                            updateAddressField("state", e.target.value)
                          }
                          placeholder="UF"
                          maxLength={2}
                        />
                        <IconInput
                          label="Complemento"
                          icon={MapPin}
                          value={newAddress.complement}
                          onChange={(e) =>
                            updateAddressField("complement", e.target.value)
                          }
                          placeholder="Apto, sala, etc (opcional)"
                        />
                        <div className="sm:col-span-2">
                          <IconInput
                            label="Referência"
                            icon={MapPin}
                            value={newAddress.reference}
                            onChange={(e) =>
                              updateAddressField("reference", e.target.value)
                            }
                            placeholder="Ponto de referência (opcional)"
                          />
                        </div>
                        <div className="flex items-center gap-2 sm:col-span-2">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={newAddress.isDefault}
                            onChange={(e) =>
                              updateAddressField(
                                "isDefault",
                                e.target.checked,
                              )
                            }
                            className="h-4 w-4 rounded border-[#E9EAEE] text-orange-500 focus:ring-orange-500"
                          />
                          <label
                            htmlFor="isDefault"
                            className="cursor-pointer text-[12.5px] font-semibold text-[#3D4149]"
                          >
                            Definir como endereço padrão
                          </label>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <CompactButton
                          variant="outline"
                          onClick={handleCancelAddressEdit}
                          className="flex-1"
                        >
                          <span className="flex items-center justify-center gap-1.5">
                            <X className="h-3.5 w-3.5" />
                            Cancelar
                          </span>
                        </CompactButton>
                        <GradientButton
                          onClick={handleSaveAddress}
                          size="sm"
                          className="h-8 flex-1 rounded-[9px] text-xs"
                        >
                          <Save className="h-3.5 w-3.5" />
                          {editingAddressId
                            ? "Atualizar Endereço"
                            : "Salvar Endereço"}
                        </GradientButton>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* Segurança */}
            <SectionCard title="Segurança" subtitle="Alterar sua senha de acesso">
              {!isChangingPassword ? (
                <CompactButton
                  variant="outline"
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full"
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Alterar Senha
                  </span>
                </CompactButton>
              ) : (
                <div className="space-y-3">
                  <IconInput
                    label="Senha Atual"
                    icon={Lock}
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      updatePasswordField("currentPassword", e.target.value)
                    }
                    placeholder="Digite sua senha atual"
                  />
                  <IconInput
                    label="Nova Senha"
                    icon={Lock}
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      updatePasswordField("newPassword", e.target.value)
                    }
                    placeholder="Digite a nova senha"
                  />
                  {passwordErrors.length > 0 && (
                    <div className="space-y-1 text-[11.5px] text-red-600">
                      <p className="font-bold">Requisitos não atendidos:</p>
                      <ul className="list-inside list-disc">
                        {passwordErrors.map((error: string, i: number) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <IconInput
                    label="Confirmar Nova Senha"
                    icon={Lock}
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      updatePasswordField("confirmPassword", e.target.value)
                    }
                    placeholder="Digite a nova senha novamente"
                  />
                  <div className="flex gap-2">
                    <CompactButton
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        resetPasswordForm();
                      }}
                      className="flex-1"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <X className="h-3.5 w-3.5" />
                        Cancelar
                      </span>
                    </CompactButton>
                    <GradientButton
                      onClick={handleChangePassword}
                      size="sm"
                      disabled={passwordErrors.length > 0}
                      className="h-8 flex-1 rounded-[9px] text-xs"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Alterar Senha
                    </GradientButton>
                  </div>
                </div>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </AdminPageLayout>
  );
}
