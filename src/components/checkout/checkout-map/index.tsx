"use client";

import { useEffect, useState } from "react";

import { GoogleMap, OverlayView, useLoadScript } from "@react-google-maps/api";

type Coords = {
  lat: number;
  lng: number;
};

type Props = {
  updateCoords: (key: "latitude" | "longitude", coord: number) => void;
};

export function CheckoutMap({ updateCoords }: Props) {
  const [currentCoords, setCurrentCoords] = useState<Coords>({
    lat: -15.7942,
    lng: -47.8822,
  });

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        console.log("Erro pegando localização:", err);
      },
    );
  }, []);

  useEffect(() => {
    updateCoords("latitude", currentCoords.lat);
    updateCoords("longitude", currentCoords.lng);
  }, [currentCoords]);

  if (loadError) return <div>Erro ao carregar o mapa</div>;
  if (!isLoaded) return <div>Carregando mapa...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{
        width: "100%",
        height: "400px",
        borderRadius: "8px",
      }}
      center={currentCoords}
      zoom={15}
      onClick={(e) => {
        const lat = e.latLng?.lat() ?? 0;
        const lng = e.latLng?.lng() ?? 0;

        setCurrentCoords({ lat, lng });
      }}
    >
      <OverlayView
        position={currentCoords}
        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute rounded-full h-3 w-3 bg-emerald-700" />
          <span className="absolute inline-flex h-6 w-6 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
        </div>
      </OverlayView>
    </GoogleMap>
  );
}
