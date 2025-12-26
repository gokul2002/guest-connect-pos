import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  todaySales: number;
  totalOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
}

export interface HourlyData {
  time: string;
  sales: number;
}

export interface CategoryData {
  name: string;
  orders: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    averageOrderValue: 0,
  });
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch all orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');
      
      if (ordersError) throw ordersError;

      const allOrders = orders || [];
      
      // Today's paid orders
      const todayPaidOrders = allOrders.filter(o => 
        o.is_paid && new Date(o.updated_at) >= today
      );
      
      const todaySales = todayPaidOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const totalOrders = allOrders.length;
      const pendingOrders = allOrders.filter(o => 
        !o.is_paid && o.status !== 'cancelled' && o.status !== 'served'
      ).length;
      const paidOrders = allOrders.filter(o => o.is_paid);
      const averageOrderValue = paidOrders.length > 0 
        ? paidOrders.reduce((sum, o) => sum + Number(o.total), 0) / paidOrders.length 
        : 0;

      setStats({
        todaySales,
        totalOrders,
        pendingOrders,
        averageOrderValue: Math.round(averageOrderValue),
      });

      // Generate hourly data for today
      const hourlyMap = new Map<string, number>();
      for (let h = 9; h <= 22; h++) {
        const timeLabel = h <= 12 ? `${h}AM` : `${h - 12}PM`;
        if (h === 12) hourlyMap.set('12PM', 0);
        else hourlyMap.set(timeLabel, 0);
      }

      todayPaidOrders.forEach(order => {
        const hour = new Date(order.updated_at).getHours();
        const timeLabel = hour <= 12 ? `${hour}AM` : `${hour - 12}PM`;
        const normalizedLabel = hour === 12 ? '12PM' : timeLabel;
        if (hourlyMap.has(normalizedLabel)) {
          hourlyMap.set(normalizedLabel, (hourlyMap.get(normalizedLabel) || 0) + Number(order.total));
        }
      });

      setHourlyData(Array.from(hourlyMap.entries()).map(([time, sales]) => ({ time, sales })));

      // Fetch order items for category stats
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('menu_item_id, quantity');
      
      if (itemsError) throw itemsError;

      // Fetch menu items with categories
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, category_id');
      
      if (menuError) throw menuError;

      const { data: categoriesData, error: catError } = await supabase
        .from('menu_categories')
        .select('id, name');
      
      if (catError) throw catError;

      const catMap = new Map((categoriesData || []).map(c => [c.id, c.name]));
      const menuCatMap = new Map((menuItems || []).map(m => [m.id, m.category_id]));
      
      const categoryOrders = new Map<string, number>();
      (orderItems || []).forEach(item => {
        const catId = menuCatMap.get(item.menu_item_id || '');
        const catName = catId ? catMap.get(catId) || 'Other' : 'Other';
        categoryOrders.set(catName, (categoryOrders.get(catName) || 0) + item.quantity);
      });

      setCategoryData(
        Array.from(categoryOrders.entries())
          .map(([name, orders]) => ({ name, orders }))
          .sort((a, b) => b.orders - a.orders)
          .slice(0, 5)
      );

    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, hourlyData, categoryData, loading, refetch: fetchStats };
}