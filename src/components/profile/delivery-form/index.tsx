"use client";
import { formatCep } from "@/utils";
import { X, Search, Save } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressForm, HandleAddAddress } from "@/components/profile/addresses";

type Props = {
  handleCloseAddressModal: () => void;
  handleAddAddress: HandleAddAddress;
  addressForm: AddressForm;
  isSavingAddress: boolean;
  isLoadingCep: boolean;
  isEditing?: boolean;
};

export function DeliveryForm({
  handleCloseAddressModal,
  handleAddAddress,
  addressForm,
  isSavingAddress,
  isLoadingCep,
  isEditing = false,
}: Props) {
  return (
    <div className="inset-0 bg-black/50 flex items-center justify-center z-50 p-4 mt-8 rounded-md">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              {isEditing ? "Editar Endereço" : "Adicionar Novo Endereço"}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseAddressModal}
              disabled={isSavingAddress}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          <form
            onSubmit={addressForm.handleSubmit(handleAddAddress)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CEP */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP *
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    {...addressForm.register("zipCode")}
                    placeholder="00000-000"
                    maxLength={9}
                    className="rounded-xl pl-10 pr-10"
                    onChange={(e) => {
                      const formatted = formatCep(e.target.value);
                      addressForm.setValue("zipCode", formatted, {
                        shouldValidate: true,
                      });
                    }}
                    disabled={isLoadingCep}
                  />
                  {isLoadingCep && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {addressForm.formState.errors.zipCode && (
                  <p className="text-red-500 text-sm mt-1">
                    {addressForm.formState.errors.zipCode.message}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  🔍 Digite o CEP e os campos serão preenchidos automaticamente
                </p>
              </div>

              {/* Rua */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rua *
                </label>
                <Input
                  {...addressForm.register("street")}
                  placeholder="Nome da rua"
                  className="rounded-xl"
                />
              </div>

              {/* Número */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número *
                </label>
                <Input
                  {...addressForm.register("number")}
                  placeholder="123"
                  className="rounded-xl"
                />
              </div>

              {/* Complemento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complemento
                </label>
                <Input
                  {...addressForm.register("complement")}
                  placeholder="Apto, bloco, etc"
                  className="rounded-xl"
                />
              </div>

              {/* Bairro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bairro *
                </label>
                <Input
                  {...addressForm.register("neighborhood")}
                  placeholder="Nome do bairro"
                  className="rounded-xl"
                />
              </div>

              {/* Cidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade *
                </label>
                <Input
                  {...addressForm.register("city")}
                  placeholder="Nome da cidade"
                  className="rounded-xl"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <Input
                  {...addressForm.register("state")}
                  placeholder="SP"
                  maxLength={2}
                  className="rounded-xl"
                />
              </div>

              {/* Checkbox Padrão */}
              <div className="md:col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    {...addressForm.register("isDefault")}
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

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseAddressModal}
                disabled={isSavingAddress}
              >
                Cancelar
              </Button>
              <GradientButton
                type="submit"
                size="sm"
                isLoading={isSavingAddress}
                loadingText={isEditing ? "Atualizando..." : "Salvando..."}
                disabled={isSavingAddress}
              >
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? "Atualizar Endereço" : "Salvar Endereço"}
              </GradientButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
