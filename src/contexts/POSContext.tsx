import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Order, MenuItem } from '@/types/pos';
import { mockOrders, mockMenuItems } from '@/data/mockData';

interface POSContextType {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  tableCount: number;
  setTableCount: React.Dispatch<React.SetStateAction<number>>;
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  getTableStatus: (tableNum: number) => 'free' | 'ordered' | 'preparing' | 'ready';
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function POSProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(mockMenuItems);
  const [tableCount, setTableCount] = useState<number>(10);

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

  return (
    <POSContext.Provider
      value={{
        orders,
        setOrders,
        menuItems,
        setMenuItems,
        tableCount,
        setTableCount,
        addOrder,
        updateOrderStatus,
        getTableStatus,
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
