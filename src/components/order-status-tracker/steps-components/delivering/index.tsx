"use client";

import { OrderInfo, OrderStatus } from "@/hooks";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { Clock } from "lucide-react";
import { useMemo } from "react";

type Props = {
  order: OrderInfo | null;
  getStatusMessage: (status: OrderStatus) => string;
  lat: number;
  lng: number;
};

export function DeliveringMap({ order, getStatusMessage, lat, lng }: Props) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey ?? "",
  });

  const center = useMemo(() => ({ lat, lng }), [lat, lng]);

  if (!googleMapsApiKey) {
    return (
      <div>
        <div className="my-6 p-4 bg-linear-to-r from-orange-50 to-orange-50 rounded-lg border border-orange-100 transition-all duration-500">
          <p className="font-medium text-gray-900">
            {order ? getStatusMessage(order.status) : null}
          </p>

          {order?.status !== "delivered" && (
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <p className="text-sm text-gray-600">
                Tempo estimado:{" "}
                <span className="font-semibold">{order?.estimatedTime}</span>
              </p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm text-gray-600">
          Mapa indisponivel no momento. Configuracao do Google Maps ausente.
        </div>
      </div>
    );
  }

  if (loadError) return <div>Erro ao carregar o mapa</div>;
  if (!isLoaded) return <div>Carregando mapa...</div>;
  if (!order) return null;

  return (
    <div>
      <div className="my-6 p-4 bg-linear-to-r from-orange-50 to-orange-50 rounded-lg border border-orange-100 transition-all duration-500">
        <p className="font-medium text-gray-900">
          {getStatusMessage(order.status)}
        </p>

        {order.status !== "delivered" && (
          <div className="flex items-center gap-2 mt-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <p className="text-sm text-gray-600">
              Tempo estimado:{" "}
              <span className="font-semibold">{order.estimatedTime}</span>
            </p>
          </div>
        )}
      </div>

      <div className="p-2 rounded-xl bg-linear-to-r from-orange-500 to-orange-500">
        <GoogleMap
          mapContainerStyle={{
            width: "100%",
            height: "400px",
            borderRadius: "8px",
          }}
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
    </div>
  );
}
