import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RestaurantSettings } from '@/types/pos';

export function useRestaurantSettings() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('restaurant_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      if (data) {
        setSettings({
          id: data.id,
          restaurantName: data.restaurant_name,
          restaurantAddress: data.restaurant_address || '',
          restaurantLogoUrl: data.restaurant_logo_url,
          taxPercentage: Number(data.tax_percentage),
          currencySymbol: data.currency_symbol,
          businessHoursOpen: data.business_hours_open,
          businessHoursClose: data.business_hours_close,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<RestaurantSettings>) => {
    if (!settings?.id) return { error: 'No settings found' };

    try {
      const updateData: Record<string, unknown> = {};
      if (newSettings.restaurantName !== undefined) updateData.restaurant_name = newSettings.restaurantName;
      if (newSettings.restaurantAddress !== undefined) updateData.restaurant_address = newSettings.restaurantAddress;
      if (newSettings.restaurantLogoUrl !== undefined) updateData.restaurant_logo_url = newSettings.restaurantLogoUrl;
      if (newSettings.taxPercentage !== undefined) updateData.tax_percentage = newSettings.taxPercentage;
      if (newSettings.currencySymbol !== undefined) updateData.currency_symbol = newSettings.currencySymbol;
      if (newSettings.businessHoursOpen !== undefined) updateData.business_hours_open = newSettings.businessHoursOpen;
      if (newSettings.businessHoursClose !== undefined) updateData.business_hours_close = newSettings.businessHoursClose;

      const { error: updateError } = await supabase
        .from('restaurant_settings')
        .update(updateData)
        .eq('id', settings.id);

      if (updateError) throw updateError;

      // Refresh settings after update
      await fetchSettings();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update settings' };
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, error, updateSettings, refetch: fetchSettings };
}
