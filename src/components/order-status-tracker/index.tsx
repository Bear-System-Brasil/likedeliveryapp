"use client";

import { OrderInfo } from "@/hooks";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle, Clock, Truck } from "lucide-react";
import { JSX, ReactNode, useEffect, useRef, useState } from "react";
import { DeliveringMap } from "./steps-components/delivering";
import { StatusComponent } from "./steps-components/status";

import { Socket, io } from "socket.io-client";

const DELIVERY_TRACKING_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/delivery-tracking`
  : "";
const DEBUG_DELIVERY_TRACKING =
  process.env.NEXT_PUBLIC_DELIVERY_TRACKING_DEBUG === "true";

type OrderStatus =
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivering"
  | "delivered";

type StatusStep = {
  key: OrderStatus;
  label: string;
  icon: ReactNode;
  component: JSX.Element;
};

type Props = {
  data: {
    order: OrderInfo | null;
    isRefreshing: boolean;
    getStatusMessage: (status: OrderStatus) => string;
  };
  token: string;
};

export function OrderStatusTracker({ data, token }: Props) {
  const [coordinates, setCoordinates] = useState({
    lat: 0,
    lng: 0,
  });

  const steps: StatusStep[] = [
    {
      key: "confirmed",
      label: "Pedido Confirmado",
      icon: <CheckCircle className="w-6 h-6" />,
      component: (
        <StatusComponent
          getStatusMessage={() => data.getStatusMessage("confirmed")}
          order={data.order}
        />
      ),
    },
    {
      key: "preparing",
      label: "Preparando",
      icon: <Clock className="w-6 h-6" />,
      component: (
        <StatusComponent
          getStatusMessage={() => data.getStatusMessage("preparing")}
          order={data.order}
        />
      ),
    },
    {
      key: "ready",
      label: "Pronto",
      icon: <CheckCircle className="w-6 h-6" />,
      component: (
        <StatusComponent
          getStatusMessage={() => data.getStatusMessage("ready")}
          order={data.order}
        />
      ),
    },
    {
      key: "delivering",
      label: "A Caminho",
      icon: <Truck className="w-6 h-6" />,
      component: (
        <DeliveringMap
          getStatusMessage={() => data.getStatusMessage("delivering")}
          order={data.order}
          lat={coordinates.lat}
          lng={coordinates.lng}
        />
      ),
    },
    {
      key: "delivered",
      label: "Entregue",
      icon: <CheckCircle className="w-6 h-6" />,
      component: (
        <StatusComponent
          getStatusMessage={() => data.getStatusMessage("delivered")}
          order={data.order}
        />
      ),
    },
  ];

  const getStepIndex = (status: OrderStatus): number => {
    return steps.findIndex((step) => step.key === status);
  };

  const socketRef = useRef<Socket | null>(null);

  const order = data.order;
  const deliveryId = order?.delivery?.id;
  const isTrackable = order?.status === "delivering";

  useEffect(() => {
    if (!token || !deliveryId || !isTrackable || !DELIVERY_TRACKING_URL) {
      return;
    }

    const socket = io(DELIVERY_TRACKING_URL, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinDelivery", {
        deliveryId,
      });
    });

    socket.on("connect_error", (err) => {
      if (DEBUG_DELIVERY_TRACKING) {
        console.log("Erro socket:", err);
      }
    });

    socket.on("trackingStarted", () => {
      if (DEBUG_DELIVERY_TRACKING) {
        console.log("Tracking iniciado");
      }
    });

    socket.on(
      "locationUpdate",
      ({ lat, lng }: { lat: number; lng: number }) => {
        setCoordinates({
          lat,
          lng,
        });
      },
    );

    socket.on("trackingFinished", () => {
      if (DEBUG_DELIVERY_TRACKING) {
        console.log("Entrega finalizada");
      }
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
    };
  }, [deliveryId, isTrackable, token]);

  if (!order) return null;

  const currentIndex = getStepIndex(order.status);

  const CurrentComponent =
    order.status === "delivering" && !order.delivery ? (
      <StatusComponent
        getStatusMessage={() => data.getStatusMessage("delivering")}
        order={order}
      />
    ) : (
      steps[currentIndex].component
    );

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Linha conectora */}
      <div className="relative mb-8">
        <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full">
          <div
            className="h-full bg-linear-to-r from-green-400 via-green-500 to-green-600 transition-all duration-500 rounded-full shadow-sm"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex flex-col justify-between">
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const isCompleted = index <= currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <div key={step.key}>
                  <div
                    className="flex flex-col items-center"
                    style={{ flex: "0 0 auto" }}
                  >
                    <div
                      className={cn(
                        "rounded-full p-3 transition-all duration-500 relative z-10 bg-white shadow-md",
                        isCompleted
                          ? "ring-4 ring-green-500 text-green-600"
                          : "ring-4 ring-gray-200 text-gray-400",
                      )}
                    >
                      {isCompleted ? step.icon : <Circle className="w-6 h-6" />}
                    </div>

                    <span
                      className={cn(
                        "text-xs sm:text-sm mt-2 text-center transition-all duration-500 max-w-20",
                        isCurrent
                          ? "font-semibold text-green-600"
                          : isCompleted
                            ? "font-medium text-green-600"
                            : "text-gray-500",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div>{CurrentComponent}</div>
        </div>
      </div>
    </div>
  );
}
