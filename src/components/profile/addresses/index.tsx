"use client";

import { Dispatch, SetStateAction } from "react";

import { UseFormReturn } from "react-hook-form";

import { AddressFormData } from "@/hooks";

import { MapPin, Plus, Star, X, Search, Save } from "lucide-react";

import { GradientButton } from "@/components/ui/gradient-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { DataCard } from "@/components/data-card";
import { DeliveryForm } from "../delivery-form";
import { cn } from "@/lib/utils";

type AddingAddressState = {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export type AddressForm = UseFormReturn<
  {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    type?: string | undefined;
    complement?: string | undefined;
    longitude?: number | undefined;
    latitude?: number | undefined;
    isDefault?: boolean | undefined;
  },
  any,
  {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    type?: string | undefined;
    complement?: string | undefined;
    longitude?: number | undefined;
    latitude?: number | undefined;
    isDefault?: boolean | undefined;
  }
>;

export type HandleAddAddress = (data: {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  type?: string | undefined;
  complement?: string | undefined;
  longitude?: number | undefined;
  latitude?: number | undefined;
  isDefault?: boolean | undefined;
}) => Promise<void>;

interface Address extends AddressFormData {
  id: string;
  type?: string;
}

type Props = {
  handleDeleteAddress: (addressId: string) => Promise<void>;
  handleCloseAddressModal: () => void;
  handleAddAddress: HandleAddAddress;
  addressForm: AddressForm;
  addingAddressState: AddingAddressState;
  isLoadingAddresses: boolean;
  isSavingAddress: boolean;
  addresses: Address[];
  isLoadingCep: boolean;
};

export function Addresses({
  handleDeleteAddress,
  handleCloseAddressModal,
  handleAddAddress,
  addingAddressState,
  isLoadingAddresses,
  isSavingAddress,
  isLoadingCep,
  addressForm,
  addresses,
}: Props) {
  return (
    <DataCard
      title="Meus Endereços"
      icon={<MapPin className="h-5 w-5" />}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={addingAddressState.open}
          className="rounded-xl border-gray-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      }
    >
      {isLoadingAddresses ? (
        <div className={"space-y-4"}>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : !Array.isArray(addresses) || addresses.length === 0 ? (
        <div
          className={cn(
            "text-center py-8",
            addingAddressState.isOpen ? "hidden" : "block",
          )}
        >
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Nenhum endereço cadastrado</p>
          <GradientButton onClick={addingAddressState.open}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Primeiro Endereço
          </GradientButton>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.isArray(addresses) &&
            addresses.map((address) => (
              <div
                key={address.id}
                className="border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {address.type}
                    </Badge>
                    {address.isDefault && (
                      <Badge className="bg-linear-to-r from-orange-500 to-orange-500 text-white border-0 text-xs flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Padrão
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAddress(address.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900">
                    {address.street}, {address.number}
                    {address.complement && ` - ${address.complement}`}
                  </p>
                  <p>
                    {address.neighborhood} - {address.city}/{address.state}
                  </p>
                  <p>CEP: {address.zipCode}</p>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Modal para adicionar endereço */}
      {addingAddressState.isOpen && (
        <DeliveryForm
          handleCloseAddressModal={handleCloseAddressModal}
          handleDeleteAddress={handleDeleteAddress}
          handleAddAddress={handleAddAddress}
          isSavingAddress={isSavingAddress}
          addressForm={addressForm}
          isLoadingCep={isLoadingCep}
        />
      )}
    </DataCard>
  );
}
