// Types for main page and restaurants

import { LucideIcon } from "lucide-react";

export interface Coords {
  lng: number;
  lat: number;
}

/** Localizacao escolhida pelo cliente (cookie `userLocation`). */
export interface UserLocation extends Coords {
  city?: string;
}

export interface Specialty {
  id: string;
  name: string;
}

export interface QuickAction {
  label: string;
  icon: LucideIcon;
  subtitle: string;
}

export interface Category {
  id: string;
  name: string;
  companyId: string;
  created_at: string;
  updated_at: string;
  description: string;
}

export interface ProductCategory {
  id: string;
  productId: string;
  categoryId: string;
  created_at: string;
  updated_at: string;
  description?: string;

  category?: Category;
}

export interface Address {
  id: string;
  city: string;
  state: string;
  street: string;
  number: string;
  latitude: string | null;
  longitude: string | null;
  neighborhood: string;
  isDefault?: boolean;
}

export interface Restaurant {
  id: string;
  time: string;
  phone: string;
  logo_url: string;
  cover_url: string;
  tradeName: string;
  description: string;
  deliveryFee: string;

  tags?: string[];

  rating: number;
  discount: number;
  actionRadius: number;
  totalReviews: number;

  // Enviados pela API apenas quando a busca inclui lat/lng do cliente.
  distanceKm?: number;
  actionRadiusKm?: number;
  isWithinRadius?: boolean;

  isOpen: boolean;
  trending: boolean;

  status: "active" | "inactive";

  openingHours: unknown[];
  categories: Category[];
  specialty?: Specialty[];

  /** Enderecos da loja (a API retorna a chave com "A" maiusculo). */
  Address?: Address[];
}
