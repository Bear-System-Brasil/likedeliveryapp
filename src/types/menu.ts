export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image?: string;
  category: string;
  discount?: string;
  quantity: number;
  available?: boolean;
  preparationTime?: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
}

export interface MenuSize {
  id: string;
  name: string;
  price: string;
  size: number;
}

export interface MenuIngredient {
  id: string;
  name: string;
  price: string;
  color: string;
  icon: string;
}

export interface CartItem extends MenuItem {
  cartId?: string;
  customizations?: {
    size?: string;
    ingredients?: string[];
    observations?: string;
  };
}

export interface CartSummary {
  itemCount: number;
  total: string;
  subtotal: string;
  deliveryFee?: string; // Opcional para taxa de entrega
}
