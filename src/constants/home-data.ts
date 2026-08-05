import { Category, QuickAction, Restaurant } from "@/types/restaurant";
import { Award, ChefHat, TrendingUp, Zap } from "lucide-react";

/**
 * Ações rápidas para navegação
 */
export const QUICK_ACTIONS: QuickAction[] = [
  { icon: Zap, label: "Entrega Rápida", subtitle: "Em 20 min" },
  { icon: Award, label: "Melhores Avaliados", subtitle: "4.5+ estrelas" },
  { icon: TrendingUp, label: "Mais Pedidos", subtitle: "Top da semana" },
  { icon: ChefHat, label: "Chefs Especiais", subtitle: "Pratos únicos" },
];

/**
 * Mapeamento de categorias para URLs
 */
export const CATEGORY_MAP: Record<string, string> = {
  Pizza: "pizza",
  Burger: "burger",
  Sushi: "sushi",
  Brasileira: "brasileira",
  Doces: "doces",
  Bebidas: "bebidas",
};
