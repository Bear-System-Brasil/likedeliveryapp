import { MenuItem } from "./menu";

export interface CartCustomization {
  size?: string;
  ingredients?: string[];
  observations?: string;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  customizations?: CartCustomization;
  totalPrice: number;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  total: number;
  itemCount: number;
}

export interface CouponCode {
  code: string;
  discount: number;
  type: "percentage" | "fixed";
  isValid: boolean;
}
