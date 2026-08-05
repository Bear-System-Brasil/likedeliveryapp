// Types barrel export
export type { User } from "@/services/api";

// Address interface
export interface Address {
  id: string;
  type: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

// Payment method interface
export interface PaymentMethod {
  id: string;
  type: "credit" | "debit" | "pix";
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  isDefault: boolean;
}

// Order interface
export interface Order {
  id: string;
  restaurantName: string;
  items: string[];
  total: number;
  status: "pending" | "preparing" | "delivered" | "cancelled";
  date: string;
}
