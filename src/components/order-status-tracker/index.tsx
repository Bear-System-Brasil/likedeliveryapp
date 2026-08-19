"use client";

import { OrderInfo, OrderStatus } from "@/hooks";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { DeliveringMap } from "./steps-components/delivering";

import { Socket, io } from "socket.io-client";

const DELIVERY_TRACKING_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/delivery-tracking`
  : "";
const DEBUG_DELIVERY_TRACKING =
  process.env.NEXT_PUBLIC_DELIVERY_TRACKING_DEBUG === "true";

/**
 * A linha do tempo tem 4 marcos. O status "ready" (pedido pronto) e
 * "delivering" (saiu para entrega) compartilham o terceiro - o que muda entre
 * eles e o rotulo, ja que pedido de retirada nunca fica "a caminho".
 */
const STEP_INDEX_BY_STATUS: Record<OrderStatus, number> = {
  confirmed: 0,
  preparing: 1,
  ready: 2,
  delivering: 2,
  delivered: 3,
};

type Props = {
  data: {
    order: OrderInfo | null;
    isRefreshing: boolean;
    getStatusMessage: (status: OrderStatus) => string;
  };
};

export function OrderStatusTracker({ data }: Props) {
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const socketRef = useRef<Socket | null>(null);

  const order = data.order;
  const deliveryId = order?.delivery?.id;
  const isTrackable = order?.status === "delivering";

  useEffect(() => {
    if (!deliveryId || !isTrackable || !DELIVERY_TRACKING_URL) {
      return;
    }

    let socket: Socket | null = null;
    let cancelled = false;

    // O JWT não fica no client - busca no BFF (cookie httpOnly) só na hora
    // de abrir o handshake do socket, que conecta direto no NestJS.
    fetch("/api/auth/socket-token")
      .then((res) => res.json())
      .then(({ token }: { token: string | null }) => {
        if (cancelled || !token) return;

        socket = io(DELIVERY_TRACKING_URL, { auth: { token } });
        socketRef.current = socket;

        socket.on("connect", () => {
          socket!.emit("joinDelivery", { deliveryId });
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
            setCoordinates({ lat, lng });
          },
        );

        socket.on("trackingFinished", () => {
          if (DEBUG_DELIVERY_TRACKING) {
            console.log("Entrega finalizada");
          }
          socket!.disconnect();
        });
      });

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [deliveryId, isTrackable]);

  if (!order) return null;

  const currentIndex = STEP_INDEX_BY_STATUS[order.status] ?? 0;
  const stepLabels = [
    "Confirmado",
    "Preparando",
    order.delivery ? "A caminho" : "Pronto",
    "Entregue",
  ];

  const showLiveMap = order.status === "delivering" && Boolean(order.delivery);

  return (
    <div>
      <div className="flex items-start">
        {stepLabels.map((label, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={label}
              className="relative flex flex-1 flex-col items-center"
            >
              {/* Conector entre os marcos */}
              <span
                className={cn(
                  "absolute left-0 right-0 top-[14px] z-0 h-0.5",
                  isDone ? "bg-[#1b7f4c]" : "bg-[#e9eaee]",
                )}
              />

              <span
                className={cn(
                  "relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-2 text-sm transition-colors duration-500",
                  isDone && "border-[#1b7f4c] bg-[#1b7f4c] text-white",
                  isCurrent && "border-[#1b7f4c] bg-white text-[#1b7f4c]",
                  !isDone && !isCurrent && "border-[#e4e6ea] bg-white",
                )}
              >
                {(isDone || isCurrent) && "✓"}
              </span>

              <span
                className={cn(
                  "mt-1.5 text-center text-[10.5px]",
                  isCurrent && "font-extrabold text-[#1b7f4c]",
                  isDone && "font-bold text-[#3d4149]",
                  !isDone && !isCurrent && "font-semibold text-[#a2a7b0]",
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-[10px] bg-[#fff7ed] px-[13px] py-[11px]">
        <p className="text-[12.5px] font-bold text-[#7a4a16]">
          {data.getStatusMessage(order.status)}
        </p>

        {order.status !== "delivered" && (
          <p className="mt-[5px] flex items-center gap-1.5 text-[11.5px] font-semibold text-[#b45309]">
            <span aria-hidden>⏱</span>
            Tempo estimado: {order.estimatedTime}
          </p>
        )}
      </div>

      {showLiveMap && (
        <div className="mt-3">
          <DeliveringMap
            order={order}
            lat={coordinates.lat}
            lng={coordinates.lng}
          />
        </div>
      )}
    </div>
  );
}
