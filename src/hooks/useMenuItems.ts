import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface DbMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string | null;
  categoryName: string;
  imageUrl: string | null;
  available: boolean;
}

export function useMenuItems() {
  const [menuItems, setMenuItems] = useState<DbMenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    setCategories((data || []).map(c => ({
      id: c.id,
      name: c.name,
      sortOrder: c.sort_order || 0,
    })));
    return data || [];
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const cats = await fetchCategories();
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      const catMap = new Map(cats.map(c => [c.id, c.name]));
      
      setMenuItems((data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        categoryId: item.category_id,
        categoryName: item.category_id ? catMap.get(item.category_id) || 'Uncategorized' : 'Uncategorized',
        imageUrl: item.image_url,
        available: item.available,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (name: string) => {
    const { data, error } = await supabase
      .from('menu_categories')
      .insert({ name, sort_order: categories.length })
      .select()
      .single();
    
    if (error) return { error: error.message, data: null };
    
    await fetchCategories();
    return { error: null, data };
  };

  const addMenuItem = async (item: {
    name: string;
    price: number;
    categoryId: string | null;
    description?: string;
    available?: boolean;
  }) => {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        name: item.name,
        price: item.price,
        category_id: item.categoryId,
        description: item.description || null,
        available: item.available ?? true,
      })
      .select()
      .single();
    
    if (error) return { error: error.message };
    
    await fetchMenuItems();
    return { error: null, data };
  };

  const updateMenuItem = async (id: string, updates: Partial<{
    name: string;
    price: number;
    categoryId: string | null;
    description: string;
    available: boolean;
  }>) => {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.available !== undefined) dbUpdates.available = updates.available;

    const { error } = await supabase
      .from('menu_items')
      .update(dbUpdates)
      .eq('id', id);
    
    if (error) return { error: error.message };
    
    await fetchMenuItems();
    return { error: null };
  };

  const deleteMenuItem = async (id: string) => {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    
    if (error) return { error: error.message };
    
    await fetchMenuItems();
    return { error: null };
  };

  const toggleAvailability = async (id: string, available: boolean) => {
    return updateMenuItem(id, { available });
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  return {
    menuItems,
    categories,
    loading,
    error,
    addCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleAvailability,
    refetch: fetchMenuItems,
  };
}