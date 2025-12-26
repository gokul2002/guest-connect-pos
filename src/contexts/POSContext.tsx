import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useOrders, DbOrder } from '@/hooks/useOrders';
import { useMenuItems, DbMenuItem, MenuCategory } from '@/hooks/useMenuItems';
import { useOrderSources, OrderSource } from '@/hooks/useOrderSources';

interface POSContextType {
  // Orders
  orders: DbOrder[];
  ordersLoading: boolean;
  addOrder: (orderData: {
    tableNumber?: number | null;
    orderSourceId?: string | null;
    customerName?: string;
    subtotal: number;
    tax: number;
    total: number;
    createdBy?: string;
    status?: 'pending' | 'ready';
    items: Array<{
      menuItemId?: string;
      menuItemName: string;
      menuItemPrice: number;
      quantity: number;
      notes?: string;
    }>;
  }) => Promise<{ error: string | null; orderId?: string }>;
  addItemsToOrder: (orderId: string, items: Array<{
    menuItemId?: string;
    menuItemName: string;
    menuItemPrice: number;
    quantity: number;
    notes?: string;
  }>) => Promise<{ error: string | null }>;
  updateOrderStatus: (orderId: string, status: DbOrder['status']) => Promise<{ error: string | null }>;
  processPayment: (orderId: string, method: 'cash' | 'card' | 'upi') => Promise<{ error: string | null }>;
  getTableStatus: (tableNum: number) => 'free' | 'ordered' | 'preparing' | 'ready';
  getActiveOrderForTable: (tableNum: number) => DbOrder | null;
  getActiveOrdersForSource: (sourceId: string) => DbOrder[];
  refetchOrders: () => Promise<void>;

  // Order Sources
  orderSources: OrderSource[];
  activeOrderSources: OrderSource[];
  orderSourcesLoading: boolean;

  // Menu Items
  menuItems: DbMenuItem[];
  categories: MenuCategory[];
  menuLoading: boolean;
  addCategory: (name: string) => Promise<{ error: string | null; data?: unknown }>;
  addMenuItem: (item: {
    name: string;
    price: number;
    categoryId: string | null;
    description?: string;
    available?: boolean;
  }) => Promise<{ error: string | null }>;
  updateMenuItem: (id: string, updates: Partial<{
    name: string;
    price: number;
    categoryId: string | null;
    description: string;
    available: boolean;
  }>) => Promise<{ error: string | null }>;
  deleteMenuItem: (id: string) => Promise<{ error: string | null }>;
  toggleMenuItemAvailability: (id: string, available: boolean) => Promise<{ error: string | null }>;
  refetchMenu: () => Promise<void>;

  // Settings
  tableCount: number;
  setTableCount: React.Dispatch<React.SetStateAction<number>>;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export function POSProvider({ children }: { children: ReactNode }) {
  const [tableCount, setTableCount] = useState<number>(10);
  
  const {
    orders,
    loading: ordersLoading,
    addOrder,
    addItemsToOrder,
    updateOrderStatus,
    processPayment,
    getTableStatus,
    getActiveOrderForTable,
    getActiveOrdersForSource,
    refetch: refetchOrders,
  } = useOrders();

  const {
    orderSources,
    activeOrderSources,
    loading: orderSourcesLoading,
  } = useOrderSources();

  const {
    menuItems,
    categories,
    loading: menuLoading,
    addCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleAvailability,
    refetch: refetchMenu,
  } = useMenuItems();

  return (
    <POSContext.Provider
      value={{
        // Orders
        orders,
        ordersLoading,
        addOrder,
        addItemsToOrder,
        updateOrderStatus,
        processPayment,
        getTableStatus,
        getActiveOrderForTable,
        getActiveOrdersForSource,
        refetchOrders,

        // Order Sources
        orderSources,
        activeOrderSources,
        orderSourcesLoading,

        // Menu
        menuItems,
        categories,
        menuLoading,
        addCategory,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleMenuItemAvailability: toggleAvailability,
        refetchMenu,

        // Settings
        tableCount,
        setTableCount,
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