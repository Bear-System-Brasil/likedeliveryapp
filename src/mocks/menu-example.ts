import { MenuIngredient, MenuItem, MenuSize } from "@/types/menu";

export const categories = [
  "Destaque",
  "Pratos Principais",
  "Lanches",
  "Bebidas",
  "Sobremesas"
];

export const restaurants = [
  {
    id: "1",
    name: "Pizzaria Bella Vista",
    image: "https://cdn.casaeculinaria.com/wp-content/uploads/2023/11/21140713/Pizza-marguerita.webp",
    cuisine: "Italiana",
    rating: 4.8,
    deliveryTime: "25-35 min",
    deliveryFee: 4.90,
    distance: "1.2 km",
    isOpen: true,
    tags: ["Pizza", "Massa", "Italiana"]
  },
  {
    id: "2",
    name: "Burger House",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add",
    cuisine: "Americana",
    rating: 4.6,
    deliveryTime: "30-40 min",
    deliveryFee: 5.50,
    distance: "2.1 km",
    isOpen: true,
    tags: ["Hamburger", "Batata Frita", "Americana"]
  },
  {
    id: "3",
    name: "Sushi Zen",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351",
    cuisine: "Japonesa",
    rating: 4.9,
    deliveryTime: "35-45 min",
    deliveryFee: 6.00,
    distance: "3.5 km",
    isOpen: false,
    tags: ["Sushi", "Sashimi", "Japonesa"]
  },
  {
    id: "4",
    name: "Cantina da Mama",
    image: "https://images.unsplash.com/photo-1551218808-94e220e084d2",
    cuisine: "Brasileira",
    rating: 4.7,
    deliveryTime: "20-30 min",
    deliveryFee: 3.50,
    distance: "0.8 km",
    isOpen: true,
    tags: ["Caseira", "Brasileira", "Marmita"]
  }
];

export const foodItems: MenuItem[] = [
  {
    id: "1",
    name: "Feijoada Completa",
    description: "Feijoada tradicional com acompanhamentos",
    price: "R$ 32,90",
    category: "Pratos Principais",
    available: true,
    preparationTime: 30,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d"
  },
  {
    id: "2",
    name: "Hambúrguer Artesanal",
    description: "Hambúrguer com carne especial e batata",
    price: "R$ 24,90",
    category: "Lanches",
    available: true,
    preparationTime: 20,
    quantity: 1,
    discount: "15%",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd"
  },
  {
    id: "3",
    name: "Pizza Margherita",
    description: "Pizza com molho de tomate, mussarela e manjericão",
    price: "R$ 29,90",
    category: "Destaque",
    available: true,
    preparationTime: 25,
    quantity: 1,
    image: "https://cdn.casaeculinaria.com/wp-content/uploads/2023/11/21140713/Pizza-marguerita.webp"
  },
  {
    id: "4",
    name: "Refrigerante Lata",
    description: "Coca-Cola, Guaraná ou Sprite",
    price: "R$ 5,50",
    category: "Bebidas",
    available: true,
    preparationTime: 5,
    quantity: 1,
    image: "https://sportlife.com.br/wp-content/uploads/2023/03/Refrigerante-1.jpg"
  },
  {
    id: "5",
    name: "Pudim de Leite",
    description: "Pudim caseiro com calda de caramelo",
    price: "R$ 8,90",
    category: "Sobremesas",
    available: true,
    preparationTime: 10,
    quantity: 1,
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307"
  }
];

export const sizes: MenuSize[] = [
  { id: "small", name: "Pequeno", price: "R$ 0,00", size: 100 },
  { id: "medium", name: "Médio", price: "R$ 5,00", size: 125 },
  { id: "large", name: "Grande", price: "R$ 10,00", size: 150 }
];

export const ingredients: MenuIngredient[] = [
  { id: "cheese", name: "Queijo Extra", price: "R$ 3,00", color: "#FFD700", icon: "cheese" },
  { id: "bacon", name: "Bacon", price: "R$ 5,00", color: "#D2691E", icon: "bacon" },
  { id: "mushroom", name: "Cogumelos", price: "R$ 4,00", color: "#8B4513", icon: "mushroom" }
];
