import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

export type CardState = "increasing" | "decreasing" | "stable";
export type CardType = "moneyType" | "default";

interface ManagementCardProps {
  title: string;
  icon: React.ReactNode;
  midValue: number | string;
  bottomValue: string;
  bottomColor: string;
  cardState: CardState;
  cardType: CardType;
}

export function ManagementCard({
  title,
  icon,
  midValue,
  bottomValue,
  bottomColor,
  cardState,
  cardType,
}: ManagementCardProps) {
  const formatValue = (value: number | string): string => {
    if (cardType === "moneyType" && typeof value === "number") {
      return value.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return String(value);
  };

  const getTrendIcon = () => {
    switch (cardState) {
      case "increasing":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "decreasing":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {cardType === "moneyType" && "R$ "}
          {formatValue(midValue)}
        </div>
        <div className={`flex items-center text-xs ${bottomColor}`}>
          {getTrendIcon()}
          <span className="ml-1">{bottomValue}</span>
        </div>
      </CardContent>
    </Card>
  );
}

