import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/utils/format-currency";
import { Edit, Trash2 } from "lucide-react";
import Image from "next/image";

export interface AdminDish {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  isPopular?: boolean;
  discount?: number;
  tags: string[];
  available?: boolean;
  category: string;
}

interface AdminDishCardProps {
  dish: AdminDish;
  onEdit?: (dish: AdminDish) => void;
  onDelete?: (dish: AdminDish) => void;
  onToggleAvailability?: (dish: AdminDish) => void;
}

export function AdminDishCard({
  dish,
  onEdit,
  onDelete,
  onToggleAvailability
}: AdminDishCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <Image
          src={dish.image}
          alt={dish.name}
          width={400}
          height={200}
          className="w-full h-48 object-cover"
        />
        {dish.isPopular && (
          <Badge className="absolute top-2 right-2 bg-red-500">
            Popular
          </Badge>
        )}
        {dish.discount && (
          <Badge className="absolute top-2 left-2 bg-green-500">
            -{dish.discount}%
          </Badge>
        )}
        {dish.available === false && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="secondary">Indisponível</Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{dish.name}</h3>
          <div className="text-right">
            {dish.originalPrice && (
              <p className="text-sm text-muted-foreground line-through">
                {formatCurrency(dish.originalPrice)}
              </p>
            )}
            <p className="font-bold text-lg text-primary">
              {formatCurrency(dish.price)}
            </p>
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {dish.description}
        </p>

        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-1 flex-wrap">
            {dish.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <Badge variant={dish.available !== false ? "default" : "secondary"}>
            {dish.available !== false ? "Disponível" : "Indisponível"}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onEdit?.(dish)}
            size="sm"
            variant="outline"
            className="flex-1 cursor-pointer"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>

          <Button
            onClick={() => onToggleAvailability?.(dish)}
            size="sm"
            variant={dish.available !== false ? "secondary" : "default"}
            className="cursor-pointer"
          >
            {dish.available !== false ? "Desativar" : "Ativar"}
          </Button>

          <Button
            onClick={() => onDelete?.(dish)}
            size="sm"
            variant="destructive"
            className="cursor-pointer text-white"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
