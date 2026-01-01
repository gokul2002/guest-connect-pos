import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DbOrderItem {
  id: string;
  menuItemId: string | null;
  menuItemName: string;
  menuItemPrice: number;
  quantity: number;
  notes: string | null;
}

export interface DbOrder {
  id: string;
  tableNumber: number | null;
  orderSourceId: string | null;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  customerName: string | null;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'upi' | null;
  isPaid: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: DbOrderItem[];
}

export function useOrders() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      // Limit to recent orders (last 30 days) to avoid hitting 1000 row limit
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;

      // Get order IDs to fetch only relevant items
      const orderIds = (ordersData || []).map(o => o.id);
      
      // Fetch items only for these orders (avoids 1000 row limit issue)
      let allItems: any[] = [];
      if (orderIds.length > 0) {
        // Batch fetch items in chunks to handle large datasets
        const chunkSize = 100;
        for (let i = 0; i < orderIds.length; i += chunkSize) {
          const chunk = orderIds.slice(i, i + chunkSize);
          const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .in('order_id', chunk);
          
          if (itemsError) throw itemsError;
          allItems = [...allItems, ...(itemsData || [])];
        }
      }

      const itemsByOrder = new Map<string, DbOrderItem[]>();
      allItems.forEach(item => {
        const orderId = item.order_id;
        if (!itemsByOrder.has(orderId)) {
          itemsByOrder.set(orderId, []);
        }
        itemsByOrder.get(orderId)!.push({
          id: item.id,
          menuItemId: item.menu_item_id,
          menuItemName: item.menu_item_name,
          menuItemPrice: Number(item.menu_item_price),
          quantity: item.quantity,
          notes: item.notes,
        });
      });

      setOrders((ordersData || []).map(order => ({
        id: order.id,
        tableNumber: order.table_number,
        orderSourceId: order.order_source_id,
        status: order.status as DbOrder['status'],
        customerName: order.customer_name,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        total: Number(order.total),
        paymentMethod: order.payment_method as DbOrder['paymentMethod'],
        isPaid: order.is_paid,
        createdBy: order.created_by,
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at),
        items: itemsByOrder.get(order.id) || [],
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const addOrder = async (orderData: {
    tableNumber?: number | null;
    orderSourceId?: string | null;
    customerName?: string;
    subtotal: number;
    tax: number;
    total: number;
    createdBy?: string;
    status?: 'pending' | 'ready'; // Allow specifying initial status
    items: Array<{
      menuItemId?: string;
      menuItemName: string;
      menuItemPrice: number;
      quantity: number;
      notes?: string;
    }>;
  }) => {
    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          table_number: orderData.tableNumber ?? null,
          order_source_id: orderData.orderSourceId ?? null,
          customer_name: orderData.customerName || null,
          subtotal: orderData.subtotal,
          tax: orderData.tax,
          total: orderData.total,
          created_by: orderData.createdBy || null,
          status: orderData.status || 'pending',
        })
        .select()
        .single();
      
      if (orderError) throw orderError;

      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItemId || null,
        menu_item_name: item.menuItemName,
        menu_item_price: item.menuItemPrice,
        quantity: item.quantity,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;

      await fetchOrders();
      return { error: null, orderId: order.id };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to create order' };
    }
  };

  const addItemsToOrder = async (orderId: string, items: Array<{
    menuItemId?: string;
    menuItemName: string;
    menuItemPrice: number;
    quantity: number;
    notes?: string;
  }>) => {
    try {
      // First get the existing order
      const existingOrder = orders.find(o => o.id === orderId);
      if (!existingOrder) throw new Error('Order not found');

      // Calculate new totals
      const newItemsTotal = items.reduce((sum, item) => sum + (item.menuItemPrice * item.quantity), 0);
      const newTotal = existingOrder.total + newItemsTotal;
      // Assume tax is already included in prices
      const taxRate = existingOrder.tax / existingOrder.subtotal;
      const newSubtotal = newTotal / (1 + taxRate);
      const newTax = newTotal - newSubtotal;

      // Insert new items
      const orderItems = items.map(item => ({
        order_id: orderId,
        menu_item_id: item.menuItemId || null,
        menu_item_name: item.menuItemName,
        menu_item_price: item.menuItemPrice,
        quantity: item.quantity,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;

      // Update order totals and set back to pending if was ready
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          subtotal: newSubtotal,
          tax: newTax,
          total: newTotal,
          status: 'pending' // Reset to pending so kitchen sees new items
        })
        .eq('id', orderId);
      
      if (updateError) throw updateError;

      await fetchOrders();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to add items to order' };
    }
  };

  const getActiveOrderForTable = useCallback((tableNum: number): DbOrder | null => {
    return orders.find(
      o => o.tableNumber === tableNum && !o.isPaid && o.status !== 'served' && o.status !== 'cancelled'
    ) || null;
  }, [orders]);

  const getActiveOrdersForSource = useCallback((sourceId: string): DbOrder[] => {
    return orders.filter(
      o => o.orderSourceId === sourceId && !o.isPaid && o.status !== 'served' && o.status !== 'cancelled'
    );
  }, [orders]);

  const updateOrderStatus = async (orderId: string, status: DbOrder['status']) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    
    if (error) return { error: error.message };
    
    await fetchOrders();
    return { error: null };
  };

  const processPayment = async (orderId: string, paymentMethod: 'cash' | 'card' | 'upi') => {
    const { error } = await supabase
      .from('orders')
      .update({ 
        is_paid: true, 
        payment_method: paymentMethod,
        status: 'served'
      })
      .eq('id', orderId);
    
    if (error) return { error: error.message };
    
    await fetchOrders();
    return { error: null };
  };

  const getTableStatus = useCallback((tableNum: number): 'free' | 'ordered' | 'preparing' | 'ready' => {
    const tableOrders = orders.filter(
      o => o.tableNumber === tableNum && !o.isPaid && o.status !== 'served' && o.status !== 'cancelled'
    );
    if (tableOrders.length === 0) return 'free';
    if (tableOrders.some(o => o.status === 'ready')) return 'ready';
    if (tableOrders.some(o => o.status === 'preparing')) return 'preparing';
    return 'ordered';
  }, [orders]);

  // Set up realtime subscription
  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    addOrder,
    addItemsToOrder,
    updateOrderStatus,
    processPayment,
    getTableStatus,
    getActiveOrderForTable,
    getActiveOrdersForSource,
    refetch: fetchOrders,
  };
}