import { OrderInfo, OrderStatus } from "@/hooks";
import { Clock } from "lucide-react";

type Props = {
  order: OrderInfo | null;
  getStatusMessage: (status: OrderStatus) => string;
};

export function StatusComponent({ order, getStatusMessage }: Props) {
  if (!order) return;

  return (
    <div className="mt-6 p-4 bg-linear-to-r from-orange-50 to-orange-50 rounded-lg border border-orange-100 transition-all duration-500">
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
  );
}
