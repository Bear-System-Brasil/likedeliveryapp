import { Dispatch, SetStateAction, useState } from "react";

import { toast } from "sonner";

import { DeliveryInfo } from "@/hooks";
import { formatCep } from "@/utils";

import { MapPin, Phone, Plus, User } from "lucide-react";

import { AddressList } from "@/components/ui/address-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { CheckoutMap } from "@/components/checkout/checkout-map";
import { Address } from "@/services/api";

type Props = {
  handleInputChange: (field: string, value: string | number) => void;
  setSelectedAddressId: Dispatch<SetStateAction<string | null>>;
  setAddressMode: Dispatch<SetStateAction<"select" | "new">>;
  handleAddressSelect: (addressId: string) => void;
  setSaveAddress: Dispatch<SetStateAction<boolean>>;
  addressMode: "select" | "new";
  deliveryInfo: DeliveryInfo;
  loadingAddresses: boolean;
  saveAddress: boolean;
  userAddresses: Address[];
  selectedAddressId: string | null;
};

export function DeliveryForm({
  handleInputChange,
  setSelectedAddressId,
  setAddressMode,
  handleAddressSelect,
  setSaveAddress,
  addressMode,
  deliveryInfo,
  loadingAddresses,
  userAddresses,
  saveAddress,
  selectedAddressId,
}: Props) {
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const handleGetData = async (zipCode: string) => {
    setIsLoadingCep(true);
    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cep/v2/${zipCode}`,
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

      handleInputChange("street", data.street || "");
      handleInputChange("neighborhood", data.neighborhood || "");
      handleInputChange("city", data.city || "");
      handleInputChange("state", data.state || "");

      toast.success("CEP encontrado! Campos preenchidos automaticamente");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast.error("Erro ao buscar CEP. Verifique sua conexão.");
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleZipCode = (zipCode: string) => {
    handleInputChange("zipCode", zipCode);

    const cleanedZipCode = zipCode.replace(/\D/g, "");
    if (cleanedZipCode.length >= 8) {
      handleGetData(cleanedZipCode);
    }
  };

  const handleNewAddress = () => {
    setAddressMode((prev) => (prev === "select" ? "new" : "select"));

    if (addressMode === "select") {
      setSelectedAddressId(null);
    }
  };

  return (
    <GlassCard>
      <GlassCardContent className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <MapPin className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-bold text-gray-900">Dados de Entrega</h2>
        </div>

        <form>
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-semibold text-gray-700"
              >
                Nome Completo *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  value={deliveryInfo.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="pl-10 rounded-xl border-2 border-gray-200 focus:border-orange-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-semibold text-gray-700"
              >
                Telefone *
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={deliveryInfo.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="pl-10 rounded-xl border-2 border-gray-200 focus:border-orange-400"
                />
              </div>
            </div>
          </div>

          {/* Address Selection/Creation */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Endereço de Entrega
              </h3>
              {!loadingAddresses && userAddresses.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewAddress}
                  className="rounded-xl border-2 border-orange-300 text-orange-600 hover:bg-linear-to-br hover:from-orange-50 hover:to-orange-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {addressMode === "select"
                    ? "Novo Endereço"
                    : "Meus Endereços"}
                </Button>
              )}
            </div>

            {/* Loading state */}
            {loadingAddresses && (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            )}

            {/* Address Mode: Select from saved */}
            {!loadingAddresses &&
              addressMode === "select" &&
              userAddresses.length > 0 && (
                <RadioGroup
                  value={selectedAddressId || ""}
                  onValueChange={handleAddressSelect}
                >
                  <AddressList
                    addresses={userAddresses}
                    selectedId={selectedAddressId || undefined}
                    selectable
                    onSelect={handleAddressSelect}
                  />
                </RadioGroup>
              )}

            {/* Address Mode: Create new */}
            {!loadingAddresses &&
              (addressMode === "new" || userAddresses.length === 0) && (
                <div>
                  {userAddresses.length === 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm text-blue-700">
                        Você ainda não tem endereços cadastrados. Preencha os
                        dados abaixo:
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="zipCode"
                        className="text-sm font-semibold text-gray-700"
                      >
                        CEP *
                      </Label>

                      <div>
                        <Input
                          id="zipCode"
                          placeholder="00000-000"
                          value={deliveryInfo.zipCode}
                          maxLength={9}
                          onChange={(e) => {
                            const formatted = formatCep(e.target.value);

                            handleZipCode(formatted);
                          }}
                          disabled={isLoadingCep}
                          className="rounded-xl border-2 border-gray-200 focus:border-orange-400"
                        />
                        {deliveryInfo.zipCode.length <= 8 &&
                          deliveryInfo.zipCode.length >= 1 && (
                            <p className="text-red-500 text-sm mt-1">
                              CEP deve ter 8 dígitos
                            </p>
                          )}
                        <p className="text-xs text-gray-500 mt-1">
                          🔍 Digite o CEP e os campos serão preenchidos
                          automaticamente
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="state"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Estado *
                      </Label>
                      <Input
                        id="state"
                        placeholder="SP"
                        value={deliveryInfo.state}
                        onChange={(e) =>
                          handleInputChange("state", e.target.value)
                        }
                        className="rounded-xl border-2 border-gray-200 focus:border-orange-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="city"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Cidade *
                      </Label>
                      <Input
                        id="city"
                        placeholder="São Paulo"
                        value={deliveryInfo.city}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                        className="rounded-xl border-2 border-gray-200 focus:border-orange-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="neighborhood"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Bairro *
                      </Label>
                      <Input
                        id="neighborhood"
                        placeholder="Centro"
                        value={deliveryInfo.neighborhood}
                        onChange={(e) =>
                          handleInputChange("neighborhood", e.target.value)
                        }
                        className="rounded-xl border-2 border-gray-200 focus:border-orange-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="street"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Rua *
                      </Label>
                      <Input
                        id="street"
                        placeholder="Rua das Flores"
                        value={deliveryInfo.street}
                        onChange={(e) =>
                          handleInputChange("street", e.target.value)
                        }
                        className="rounded-xl border-2 border-gray-200 focus:border-orange-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="number"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Número *
                      </Label>
                      <Input
                        id="number"
                        placeholder="123"
                        value={deliveryInfo.number}
                        onChange={(e) =>
                          handleInputChange("number", e.target.value)
                        }
                        className="rounded-xl border-2 border-gray-200 focus:border-orange-400"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label
                        htmlFor="complement"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Complemento (opcional)
                      </Label>
                      <Input
                        id="complement"
                        placeholder="Apartamento, bloco, etc"
                        value={deliveryInfo.complement}
                        onChange={(e) =>
                          handleInputChange("complement", e.target.value)
                        }
                        className="rounded-xl border-2 border-gray-200 focus:border-orange-400"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label
                        htmlFor="reference"
                        className="text-sm font-semibold text-gray-700"
                      >
                        Ponto de Referência (opcional)
                      </Label>
                      <Input
                        id="reference"
                        placeholder="Próximo ao mercado, em frente à praça..."
                        value={deliveryInfo.reference}
                        onChange={(e) =>
                          handleInputChange("reference", e.target.value)
                        }
                        className="rounded-xl border-2 border-gray-200 focus:border-orange-400"
                      />
                    </div>
                  </div>

                  <div className="h-full w-full my-8">
                    <span className="text-sm font-semibold text-gray-700">
                      Marque sua localização no mapa para maior precisão.
                    </span>
                    <CheckoutMap
                      updateCoords={(key, value) =>
                        handleInputChange(key, value)
                      }
                    />
                  </div>

                  <div className="md:col-span-2 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="saveAddress"
                        checked={saveAddress}
                        onCheckedChange={(checked) =>
                          setSaveAddress(checked as boolean)
                        }
                      />
                      <Label
                        htmlFor="saveAddress"
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        Salvar este endereço para pedidos futuros
                      </Label>
                    </div>
                  </div>
                </div>
              )}

            <div className="space-y-2 pt-4 border-t">
              <Label
                htmlFor="observations"
                className="text-sm font-semibold text-gray-700"
              >
                Observações do Pedido (opcional)
              </Label>
              <Textarea
                id="observations"
                placeholder="Observações sobre o pedido..."
                value={deliveryInfo.observations}
                onChange={(e) =>
                  handleInputChange("observations", e.target.value)
                }
                className="rounded-xl border-2 border-gray-200 focus:border-orange-400"
              />
            </div>
          </div>
        </form>
      </GlassCardContent>
    </GlassCard>
  );
}
