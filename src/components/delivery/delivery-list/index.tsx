"use client";

import { io, Socket } from "socket.io-client";

import { Button } from "@/components/ui/button";
import { useDeliveries } from "@/hooks/use-deliveries";
import { cn } from "@/lib/utils";
import { Delivery } from "@/services/api";
import { MapPinIcon, PackageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CancelForm } from "../cancel-form";
import { DeliveryMap } from "../delivery-map";

type Props = {
  items: Delivery[];
  token: string | null;
};

type Coors = {
  lat: number | undefined;
  lng: number | undefined;
  currentDeliveryId: string;
};

type NumericCoords = {
  lat: number;
  lng: number;
};

export function DeliveryList({ items, token }: Props) {
  const [coordinates, setCoordinates] = useState({
    lng: 0,
    lat: 0,
  });

  const [currentCoords, setCurrentCoords] = useState<NumericCoords>({
    lat: 0,
    lng: 0,
  });

  const [deliverySelected, setDeliverySelected] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deliveryCanceling, setDeliveryCanceling] = useState("");

  const { changeStatus, getDeliveryStatus } = useDeliveries({
    companyId: items[0]?.order.companyId,
  });

  const handleChangeStatus = (id: string) => {
    changeStatus(id, "PICKED_UP");
  };

  const handleChangeCoordinates = ({ lat, lng, currentDeliveryId }: Coors) => {
    if (lat && lng) {
      setCoordinates({
        lat,
        lng,
      });
    }

    setDeliverySelected(currentDeliveryId);
  };

  const handleCancel = (id: string) => {
    setDeliveryCanceling(id);

    setIsFormOpen(true);
  };

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords: NumericCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        setCurrentCoords(newCoords);
      },
      (err) => {
        console.error("Erro na geolocalização :", err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (!token) return null;

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketBaseUrl = `${process.env.NEXT_PUBLIC_API_URL}/delivery-tracking`;

    const socket = io(socketBaseUrl, {
      auth: {
        token: token,
      },
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (!socketRef.current || !deliverySelected) return;

    const currentStatus = getDeliveryStatus(deliverySelected);

    if (currentStatus !== "PICKED_UP") return;

    socketRef.current.emit("updateLocation", {
      deliveryId: deliverySelected,
      lat: currentCoords.lat,
      lng: currentCoords.lng,
    });
  }, [currentCoords.lat, currentCoords.lng]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center w-full mb-4">
        <DeliveryMap
          userToken={token}
          deliveryCoord={{
            lat: coordinates.lat.toString(),
            lng: coordinates.lng.toString(),
          }}
        />
      </div>

      <div className="flex items-center justify-end w-full">
        <h1 className=" px-2 mt-4 mr-4 text-[#109f70] bg-gray-100 rounded-lg">
          {items.length} pendentes
        </h1>
      </div>

      <div className="overflow-y-scroll max-h-96 flex flex-col gap-4 my-4 w-full px-4 ">
        {items.map((product) => {
          return (
            <div
              key={product.id}
              className={cn(
                "flex flex-col gap-8 cursor-pointer items-start border-2 border-gray-300 p-4 rounded-lg",
                deliverySelected === product.id && "border-gray-900",
              )}
              onClick={() =>
                handleChangeCoordinates({
                  lng: product.deliveryAddress.longitude,
                  lat: product.deliveryAddress.latitude,
                  currentDeliveryId: product.id,
                })
              }
            >
              <div className="flex items-start">
                <div className="p-2 bg-gray-300 text-gray-700 rounded-lg">
                  <PackageIcon className="size-4" />
                </div>

                <div className="ml-4">
                  <div className="flex items-center gap-4">
                    <h2>Novo pedido</h2>
                  </div>

                  <span className="flex items-center gap-2">
                    <MapPinIcon className="size-4 text-gray-400" />
                    <span className="text-gray-500">
                      {product.deliveryAddress.street},{" "}
                      {product.deliveryAddress.number} -{" "}
                      {product.deliveryAddress.neighborhood}
                    </span>
                  </span>
                </div>
              </div>

              {deliverySelected === product.id && (
                <div className="flex justify-between items-center w-full">
                  <Button
                    disabled={product.status !== "PICKED_UP" ? false : true}
                    onClick={() => handleChangeStatus(product.id)}
                  >
                    {product.status !== "PICKED_UP"
                      ? "Iniciar entrega"
                      : "Rota iniciada"}
                  </Button>

                  {product.status === "PICKED_UP" && (
                    <Button
                      onClick={() => handleCancel(product.id)}
                      variant={"destructive"}
                      className="text-white"
                    >
                      Cancelar Rota
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {deliveryCanceling.length && (
        <div>
          <CancelForm
            isOpen={isFormOpen}
            setIsOpen={setIsFormOpen}
            deliveryId={deliveryCanceling}
          />
        </div>
      )}
    </div>
  );
}
