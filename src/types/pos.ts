export type UserRole = 'admin' | 'staff' | 'chef';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  createdAt: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  available: boolean;
  image?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  menuItemPrice: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableNumber?: number;
  customerName?: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'served';
  subtotal: number;
  tax: number;
  total: number;
  isPaid: boolean;
  paymentMethod?: 'cash' | 'card' | 'upi';
  createdAt: Date;
  createdBy?: string;
}

export interface RestaurantSettings {
  id: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLogoUrl: string | null;
  taxPercentage: number;
  currencySymbol: string;
  businessHoursOpen: string;
  businessHoursClose: string;
  kitchenEnabled: boolean;
  tableCount: number;
}
