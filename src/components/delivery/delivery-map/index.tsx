"use client";

import {
  DirectionsRenderer,
  DirectionsService,
  GoogleMap,
  Marker,
  OverlayView,
  useLoadScript,
} from "@react-google-maps/api";

import { useEffect, useRef, useState } from "react";

type Coordinates = {
  lat: string;
  lng: string;
};

type NumericCoords = {
  lat: number;
  lng: number;
};

type Props = {
  userToken: string | null;
  deliveryCoord: Coordinates;
};

const ROUTE_UPDATE_DISTANCE = 30;

function distanceInMeters(a: NumericCoords, b: NumericCoords) {
  const R = 6371000;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * y;
}

export function DeliveryMap({ userToken, deliveryCoord }: Props) {
  if (!userToken) return null;

  const deliveryCoordsNumeric: NumericCoords = {
    lat: Number(deliveryCoord.lat),
    lng: Number(deliveryCoord.lng),
  };

  const [currentCoords, setCurrentCoords] = useState<NumericCoords>({
    lat: 0,
    lng: 0,
  });

  const [mapCenter, setMapCenter] = useState<NumericCoords>({
    lat: -15.7942,
    lng: -47.8822,
  });

  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);

  const lastRoutePoint = useRef<NumericCoords | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords: NumericCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setCurrentCoords(newCoords);

        if (!lastRoutePoint.current) {
          lastRoutePoint.current = newCoords;
          setMapCenter(newCoords);
          return;
        }

        const moved = distanceInMeters(lastRoutePoint.current, newCoords);

        if (moved > ROUTE_UPDATE_DISTANCE) {
          lastRoutePoint.current = newCoords;
          setDirections(null);
        }
      },
      (err) => {
        console.error("Erro na geolocalização:", err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (loadError) return <div>Erro ao carregar mapa</div>;
  if (!isLoaded) return <div>Carregando mapa...</div>;

  return (
    <div className="border-b-4 h-96 w-full">
      <GoogleMap
        mapContainerStyle={{
          width: "100%",
          height: "400px",
          borderRadius: "8px",
        }}
        center={mapCenter}
        zoom={14}
      >
        {!directions && (
          <DirectionsService
            options={{
              origin: currentCoords,
              destination: deliveryCoordsNumeric,
              travelMode: google.maps.TravelMode.DRIVING,
            }}
            callback={(result, status) => {
              if (status === "OK" && result) {
                setDirections(result);
              }
            }}
          />
        )}

        {directions && (
          <DirectionsRenderer
            options={{
              directions,
              suppressMarkers: true,
              preserveViewport: true,
            }}
          />
        )}

        <Marker position={deliveryCoordsNumeric} />

        <OverlayView
          position={currentCoords}
          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute rounded-full h-3 w-3 bg-emerald-400" />
            <span className="absolute inline-flex h-6 w-6 rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
          </div>
        </OverlayView>
      </GoogleMap>
    </div>
  );
}
