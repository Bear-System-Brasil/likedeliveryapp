// Types for main page and restaurants

import { LucideIcon } from "lucide-react";

export interface Coords {
  lng: number;
  lat: number;
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

interface Address {
  id: string;
  zipCode: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string;
  reference?: string;
  latitude?: string;
  longitude?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Restaurant {
  id: string;
  tradeName: string;
  legalName: string;
  description: string;
  logo_url: string;
  cover_url: string;
  phone: string;
  email?: string;
  cnpj?: string;
  rating: number;
  totalReviews: number;
  isOpen: boolean;
  status: "active" | "inactive";
  openingHours: unknown[];
  Address?: Address[];
  speciality?: Specialty[];

  // Campos que só existem na listagem
  time?: string;
  deliveryFee?: string;
  tags?: string[];
  discount?: number;
  distanceKm?: number;
  actionRadius?: number;
  actionRadiusKm?: number;
  trending?: boolean;
  isWithinRadius?: boolean;
  categories?: Category[];
}
