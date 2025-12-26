import { MenuItem, Order, User, DashboardStats } from '@/types/pos';

export const mockMenuItems: MenuItem[] = [
  { id: '1', name: 'Butter Chicken', price: 350, category: 'Main Course', description: 'Creamy tomato-based curry', available: true },
  { id: '2', name: 'Paneer Tikka', price: 280, category: 'Starters', description: 'Grilled cottage cheese', available: true },
  { id: '3', name: 'Biryani', price: 320, category: 'Main Course', description: 'Aromatic rice dish', available: true },
  { id: '4', name: 'Naan', price: 50, category: 'Breads', description: 'Tandoori bread', available: true },
  { id: '5', name: 'Dal Makhani', price: 220, category: 'Main Course', description: 'Creamy lentils', available: true },
  { id: '6', name: 'Masala Chai', price: 40, category: 'Beverages', description: 'Spiced tea', available: true },
  { id: '7', name: 'Lassi', price: 80, category: 'Beverages', description: 'Sweet yogurt drink', available: true },
  { id: '8', name: 'Gulab Jamun', price: 120, category: 'Desserts', description: 'Sweet milk dumplings', available: true },
  { id: '9', name: 'Samosa', price: 60, category: 'Starters', description: 'Crispy pastry', available: true },
  { id: '10', name: 'Chicken Tikka', price: 300, category: 'Starters', description: 'Grilled chicken', available: true },
  { id: '11', name: 'Roti', price: 30, category: 'Breads', description: 'Whole wheat bread', available: true },
  { id: '12', name: 'Raita', price: 60, category: 'Sides', description: 'Yogurt side dish', available: true },
];

export const mockUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@hotel.com', role: 'admin', phone: '+91 9876543210', createdAt: new Date('2024-01-01') },
  { id: '2', name: 'John Smith', email: 'john@hotel.com', role: 'staff', phone: '+91 9876543211', createdAt: new Date('2024-01-15') },
  { id: '3', name: 'Chef Ramesh', email: 'ramesh@hotel.com', role: 'chef', phone: '+91 9876543212', createdAt: new Date('2024-02-01') },
  { id: '4', name: 'Sarah Wilson', email: 'sarah@hotel.com', role: 'staff', phone: '+91 9876543213', createdAt: new Date('2024-02-15') },
  { id: '5', name: 'Chef Priya', email: 'priya@hotel.com', role: 'chef', phone: '+91 9876543214', createdAt: new Date('2024-03-01') },
];

export const mockOrders: Order[] = [
  {
    id: 'ORD001',
    items: [
      { id: '1', menuItem: mockMenuItems[0], quantity: 2, notes: 'Less spicy' },
      { id: '2', menuItem: mockMenuItems[3], quantity: 4 },
    ],
    tableNumber: 5,
    status: 'preparing',
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
    updatedAt: new Date(),
    createdBy: '2',
    customerName: 'Mr. Sharma',
    subtotal: 900,
    tax: 45,
    total: 945,
    isPaid: false,
  },
  {
    id: 'ORD002',
    items: [
      { id: '3', menuItem: mockMenuItems[2], quantity: 1 },
      { id: '4', menuItem: mockMenuItems[6], quantity: 2 },
    ],
    tableNumber: 3,
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
    updatedAt: new Date(),
    createdBy: '4',
    customerName: 'Ms. Patel',
    subtotal: 480,
    tax: 24,
    total: 504,
    isPaid: false,
  },
  {
    id: 'ORD003',
    items: [
      { id: '5', menuItem: mockMenuItems[9], quantity: 2 },
      { id: '6', menuItem: mockMenuItems[7], quantity: 2 },
    ],
    tableNumber: 8,
    status: 'ready',
    createdAt: new Date(Date.now() - 1000 * 60 * 25),
    updatedAt: new Date(),
    createdBy: '2',
    subtotal: 840,
    tax: 42,
    total: 882,
    isPaid: false,
  },
];

export const mockDashboardStats: DashboardStats = {
  todaySales: 45670,
  totalOrders: 67,
  pendingOrders: 12,
  averageOrderValue: 682,
};

export const categories = ['All', 'Starters', 'Main Course', 'Breads', 'Sides', 'Beverages', 'Desserts'];
