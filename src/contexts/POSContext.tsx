import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Order, MenuItem, UserRole } from '@/types/pos';
import { mockUsers, mockOrders, mockMenuItems } from '@/data/mockData';

interface POSContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  tableCount: number;
  setTableCount: React.Dispatch<React.SetStateAction<number>>;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  removeUser: (id: string) => void;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  getTableStatus: (tableNum: number) => 'free' | 'ordered' | 'preparing' | 'ready';
  login: (email: string, role: UserRole) => boolean;
  logout: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function POSProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [tableCount, setTableCount] = useState<number>(10);

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date(),
    };
    setUsers(prev => [...prev, newUser]);
  };

  const removeUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `ORD${String(orders.length + 1).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setOrders(prev => [...prev, newOrder]);
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date() }
          : order
      )
    );
  };

  const getTableStatus = (tableNum: number): 'free' | 'ordered' | 'preparing' | 'ready' => {
    const tableOrders = orders.filter(
      o => o.tableNumber === tableNum && !o.isPaid && o.status !== 'served' && o.status !== 'cancelled'
    );
    if (tableOrders.length === 0) return 'free';
    if (tableOrders.some(o => o.status === 'ready')) return 'ready';
    if (tableOrders.some(o => o.status === 'preparing')) return 'preparing';
    return 'ordered';
  };

  const login = (email: string, role: UserRole): boolean => {
    const user = users.find(u => u.email === email && u.role === role);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <POSContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        setUsers,
        orders,
        setOrders,
        menuItems,
        setMenuItems,
        tableCount,
        setTableCount,
        addUser,
        removeUser,
        addOrder,
        updateOrderStatus,
        getTableStatus,
        login,
        logout,
      }}
    >
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
}
