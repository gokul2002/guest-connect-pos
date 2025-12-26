import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OrderSource {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
}

export function useOrderSources() {
  const [orderSources, setOrderSources] = useState<OrderSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderSources = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('order_sources')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (fetchError) throw fetchError;

      setOrderSources((data || []).map(source => ({
        id: source.id,
        name: source.name,
        icon: source.icon || 'package',
        isActive: source.is_active,
        sortOrder: source.sort_order || 0,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order sources');
    } finally {
      setLoading(false);
    }
  }, []);

  const addOrderSource = async (data: { name: string; icon?: string }) => {
    try {
      const { error: insertError } = await supabase
        .from('order_sources')
        .insert({
          name: data.name,
          icon: data.icon || 'package',
          sort_order: orderSources.length + 1,
        });
      
      if (insertError) throw insertError;
      await fetchOrderSources();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to add order source' };
    }
  };

  const updateOrderSource = async (id: string, data: { name?: string; icon?: string; isActive?: boolean }) => {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      const { error: updateError } = await supabase
        .from('order_sources')
        .update(updateData)
        .eq('id', id);
      
      if (updateError) throw updateError;
      await fetchOrderSources();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update order source' };
    }
  };

  const deleteOrderSource = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('order_sources')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      await fetchOrderSources();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete order source' };
    }
  };

  useEffect(() => {
    fetchOrderSources();
  }, [fetchOrderSources]);

  return {
    orderSources,
    activeOrderSources: orderSources.filter(s => s.isActive),
    loading,
    error,
    addOrderSource,
    updateOrderSource,
    deleteOrderSource,
    refetch: fetchOrderSources,
  };
}
