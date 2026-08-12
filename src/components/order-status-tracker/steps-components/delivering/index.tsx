"use client";

import { OrderInfo } from "@/hooks";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useMemo } from "react";

type Props = {
  order: OrderInfo | null;
  lat: number;
  lng: number;
};

/**
 * Mapa do entregador em tempo real. A mensagem de status fica no tracker, para
 * nao duplicar o mesmo bloco em cima do mapa.
 */
export function DeliveringMap({ order, lat, lng }: Props) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey ?? "",
  });

  const center = useMemo(() => ({ lat, lng }), [lat, lng]);

  if (!order) return null;

  if (!googleMapsApiKey) {
    return (
      <div className="rounded-[10px] border border-[#e9eaee] bg-white p-3 text-[11.5px] font-medium text-[#8a8f99]">
        Mapa indisponivel no momento. Configuracao do Google Maps ausente.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-[10px] border border-[#e9eaee] bg-white p-3 text-[11.5px] font-medium text-[#8a8f99]">
        Erro ao carregar o mapa
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[220px] animate-pulse rounded-[10px] bg-[#f0f1f4]" />
    );
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#e9eaee]">
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "220px" }}
        center={center}
        zoom={18}
        options={{
          disableDefaultUI: true,
          draggable: false,
          zoomControl: false,
          scrollwheel: false,
          disableDoubleClickZoom: true,
          gestureHandling: "none",
        }}
      >
        <Marker position={center} />
      </GoogleMap>
    </div>
  );
}
