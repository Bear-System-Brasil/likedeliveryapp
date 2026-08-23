"use client";

import { OrderInfo, OrderStatus } from "@/hooks";
import { useEffect, useRef, useState } from "react";
import { DeliveringMap } from "./steps-components/delivering";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper";
import { CheckIcon } from "lucide-react";

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
      {/* Marco atual conta como "alcançado" - mesma leitura da versão
          anterior, que já marcava o passo em andamento com check. */}
      <Stepper
        value={currentIndex + 1}
        indicators={{
          completed: <CheckIcon className="size-3.5" />,
          active: <CheckIcon className="size-3.5" />,
        }}
      >
        <StepperNav>
          {stepLabels.map((label, index) => {
            const step = index + 1;
            return (
              <StepperItem
                key={label}
                step={step}
                className="relative flex-1 flex-col items-center"
              >
                <StepperSeparator className="absolute inset-x-0 top-3.5 z-0 m-0 h-0.5 w-full bg-[#e9eaee] data-[state=completed]:bg-success" />

                <StepperTrigger className="flex flex-col items-center gap-1.5">
                  <StepperIndicator className="relative z-10 size-[30px] border-2 border-[#e4e6ea] bg-white text-transparent duration-500 data-[state=active]:border-success data-[state=active]:bg-white data-[state=active]:text-success data-[state=completed]:border-success data-[state=completed]:bg-success data-[state=completed]:text-white" />

                  <StepperTitle className="text-center text-[10.5px] font-semibold text-[#a2a7b0] data-[state=active]:font-extrabold data-[state=active]:text-success data-[state=completed]:font-bold data-[state=completed]:text-[#3d4149]">
                    {label}
                  </StepperTitle>
                </StepperTrigger>
              </StepperItem>
            );
          })}
        </StepperNav>
      </Stepper>

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
