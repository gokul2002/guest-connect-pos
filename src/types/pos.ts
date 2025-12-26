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
  image?: string;
  available: boolean;
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface Order {
  id: string;
  items: OrderItem[];
  tableNumber: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  customerName?: string;
  total: number;
  tax: number;
  subtotal: number;
  paymentMethod?: 'cash' | 'card' | 'upi';
  isPaid: boolean;
}

export interface DashboardStats {
  todaySales: number;
  totalOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
}
