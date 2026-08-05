import { LoadingPage } from "@/components/order-status/loading";
import { OrderInfo, OrderStatus as OrderStatusType } from "@/hooks";
import { formatCurrency, formatPhoneDisplay } from "@/utils";
import {
  Clock,
  Loader2,
  MapPin,
  Package,
  Phone,
  Star,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrderStatusTracker } from "../order-status-tracker";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { GradientButton } from "../ui/gradient-button";

type Props = {
  data: {
    order: OrderInfo | null;
    isRefreshing: boolean;
    getStatusMessage: (status: OrderStatusType) => string;
  };
  token: string | null;
};

export function OrderStatus({ data, token }: Props) {
  const router = useRouter();

  if (!token) return null;

  if (!data.order) {
    return <LoadingPage />;
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-linear-to-r from-orange-500 to-orange-500 bg-clip-text text-transparent mb-2">
          Acompanhe seu Pedido
        </h1>
        <p className="text-muted-foreground">
          Pedido #{data.order.orderNumber}
        </p>
        {data.isRefreshing && (
          <div className="flex items-center justify-center gap-1 mt-2">
            <Loader2 className="h-3 w-3 animate-spin text-orange-600" />
            <span className="text-xs text-orange-600 font-medium">
              Atualizando...
            </span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Status do Pedido e Delivery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Tracker */}
          <Card
            className={`border-t-4 border-t-orange-500 transition-all duration-500 ${data.isRefreshing ? "ring-2 ring-orange-200 ring-opacity-50" : ""}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Status do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="transition-all duration-500 ">
                <OrderStatusTracker data={data} token={token} />
              </div>
            </CardContent>
          </Card>

          {/* Informações de Entrega */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-500" />
                Informações de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-orange-500 mt-1 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">
                    {data.order.customerInfo.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {data.order.customerInfo.address}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-orange-500 shrink-0" />
                <span className="text-sm text-gray-900">
                  {formatPhoneDisplay(data.order.customerInfo.phone)}
                </span>
              </div>

              {data.order.delivery && data.order.delivery.observations && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Observações:
                  </p>
                  <p className="text-sm text-gray-600">
                    {data.order.delivery.observations}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumo do Pedido */}
        <div className="space-y-6">
          {/* Itens do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-500" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {data.order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">
                        {item.quantity}x {item.name}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(data.order.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card className="bg-linear-to-br from-orange-50 to-orange-50 border-orange-100">
            <CardContent className="pt-6 space-y-3">
              <Link href="/restaurants" className="block cursor-pointer">
                <Button
                  variant="default"
                  className="w-full bg-linear-to-r from-orange-500 to-orange-500 hover:from-orange-600 hover:to-orange-600 text-white shadow-lg cursor-pointer"
                >
                  Fazer Novo Pedido
                </Button>
              </Link>

              {data.order.status === "delivered" && (
                <Button
                  variant="outline"
                  className="w-full border-orange-300 hover:bg-orange-50 cursor-pointer"
                >
                  <Star className="h-4 w-4 text-yellow-600 mr-2" />
                  Avaliar Pedido
                </Button>
              )}

              <GradientButton onClick={() => router.push("/profile")}>
                Ver Meus Pedidos
              </GradientButton>
            </CardContent>
          </Card>

          {/* Informação de Atualização */}
          <div className="text-center text-xs text-gray-500">
            {data.order.status === "delivered" ? (
              <p>✅ Pedido entregue - Atualização automática desativada</p>
            ) : (
              <p>
                🔄{" "}
                {data.isRefreshing
                  ? "Atualizando..."
                  : "Próxima atualização em 30 segundos"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
