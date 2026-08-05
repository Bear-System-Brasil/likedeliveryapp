export interface User {
  id?: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  role: "admin" | "owner" | "manager" | "cook" | "delivery" | "client";
  companyId?: string;
  photoUrl?: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  role: "admin" | "client";
}
