import { useSound } from "@/hooks/use-sound";
import { apiService, type Delivery } from "@/services/api";
import { useAuthStore } from "@/stores";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";
import { toast } from "sonner";

const POLL_INTERVAL = 15_000; // mesmo ritmo do painel da cozinha (use-order-management)

const DELIVERY_TRACKING_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/delivery-tracking`
  : "";

/**
 * Painel do entregador: uma corrida por vez.
 *
 * `GET /delivery/delivery-person/me` devolve tanto as entregas PENDING
 * (disponíveis pra aceitar) quanto as já atribuídas a este entregador -
 * o filtro entre "lista pra aceitar" e "corrida ativa" é feito aqui.
 */
export const useDeliveryDriver = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const { play, loop, stopLoop, muted, toggleMuted } = useSound("courier");
  const soundEnabled = !muted;

  const prevPendingIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);
  const socketRef = useRef<Socket | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-deliveries"],
    queryFn: async () => {
      const response = await apiService.deliveries.getMyDeliveries();
      if (!response.success) {
        throw new Error(response.message || "Erro ao carregar entregas");
      }
      return response.data ?? [];
    },
    refetchInterval: POLL_INTERVAL,
    enabled: !!isAuthenticated,
    staleTime: 10_000,
  });

  const deliveries = data ?? [];

  // Corrida em andamento - simplificação deliberada de "um job por vez":
  // se por algum motivo o backend devolver mais de uma, mostra só a primeira.
  const activeDelivery: Delivery | null =
    deliveries.find(
      (d) => d.status === "ACCEPTED" || d.status === "PICKED_UP",
    ) ?? null;

  // Disponíveis pra aceitar.
  const pendingDeliveries = deliveries.filter((d) => d.status === "PENDING");

  // ─── Alerta sonoro pra corrida nova disponível ────────────────────────────
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      prevPendingIdsRef.current = new Set(pendingDeliveries.map((d) => d.id));
      return;
    }

    const currentIds = new Set(pendingDeliveries.map((d) => d.id));
    const hasNew = [...currentIds].some(
      (id) => !prevPendingIdsRef.current.has(id),
    );

    // Só toca se o entregador não estiver no meio de uma corrida - não faz
    // sentido chamar atenção pra uma corrida nova enquanto ele já tá com uma.
    if (
      hasNew &&
      pendingDeliveries.length > 0 &&
      soundEnabled &&
      !activeDelivery
    ) {
      loop("new-job");
    }
    if (pendingDeliveries.length === 0 || activeDelivery) {
      stopLoop("new-job");
    }

    prevPendingIdsRef.current = currentIds;
  }, [pendingDeliveries, activeDelivery, soundEnabled, loop, stopLoop]);

  // ─── Rastreamento ao vivo enquanto PICKED_UP ──────────────────────────────
  // O backend só considera o tracking "ativo" nesse status (ver
  // tracking-gateway.md) - fora dele nem vale abrir o socket.
  useEffect(() => {
    const deliveryId = activeDelivery?.id;
    const isTracking = activeDelivery?.status === "PICKED_UP";
    if (!deliveryId || !isTracking || !DELIVERY_TRACKING_URL) return;

    let socket: Socket | null = null;
    let cancelled = false;
    let watchId: number | null = null;

    fetch("/api/auth/socket-token")
      .then((res) => res.json())
      .then(({ token }: { token: string | null }) => {
        if (cancelled || !token) return;

        socket = io(DELIVERY_TRACKING_URL, { auth: { token } });
        socketRef.current = socket;

        socket.on("connect", () => {
          socket!.emit("joinDelivery", { deliveryId });
        });

        if (navigator.geolocation) {
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              socketRef.current?.emit("updateLocation", {
                deliveryId,
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
            },
            () => {
              // Sem permissão de localização - não quebra o resto do fluxo,
              // o cliente só fica sem ver a posição ao vivo.
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
          );
        }
      });

    return () => {
      cancelled = true;
      socket?.disconnect();
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [activeDelivery?.id, activeDelivery?.status]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["my-deliveries"] });

  const acceptMutation = useMutation({
    mutationFn: (id: string) =>
      apiService.deliveries.updateStatus(id, "ACCEPTED"),
    onSuccess: (response) => {
      invalidate();
      if (response.success) {
        stopLoop("new-job");
        play("success");
        toast.success("Entrega aceita!");
      } else {
        toast.error(
          response.message ||
            "Não foi possível aceitar - talvez outro entregador já tenha pegado essa.",
        );
      }
    },
    onError: () => toast.error("Erro de conexão ao aceitar entrega"),
  });

  const pickupMutation = useMutation({
    mutationFn: (id: string) =>
      apiService.deliveries.updateStatus(id, "PICKED_UP"),
    onSuccess: (response) => {
      invalidate();
      if (response.success) {
        play("success");
      } else {
        toast.error(response.message || "Erro ao marcar como coletado");
      }
    },
    onError: () => toast.error("Erro de conexão"),
  });

  const deliverMutation = useMutation({
    mutationFn: (id: string) =>
      apiService.deliveries.updateStatus(id, "DELIVERED"),
    onSuccess: (response) => {
      invalidate();
      if (response.success) {
        play("success");
        toast.success("Entrega concluída!");
      } else {
        toast.error(response.message || "Erro ao marcar como entregue");
      }
    },
    onError: () => toast.error("Erro de conexão"),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiService.deliveries.cancel(id, reason),
    onSuccess: (response) => {
      invalidate();
      if (response.success) {
        toast.success("Entrega cancelada");
      } else {
        toast.error(response.message || "Erro ao cancelar entrega");
      }
    },
    onError: () => toast.error("Erro de conexão"),
  });

  return {
    isLoading,
    isError,
    refetch,
    activeDelivery,
    pendingDeliveries,
    soundEnabled,
    toggleSound: toggleMuted,
    acceptDelivery: acceptMutation.mutate,
    isAccepting: acceptMutation.isPending,
    pickupDelivery: pickupMutation.mutate,
    isPickingUp: pickupMutation.isPending,
    deliverDelivery: deliverMutation.mutate,
    isDelivering: deliverMutation.isPending,
    cancelDelivery: cancelMutation.mutate,
    isCanceling: cancelMutation.isPending,
  };
};
