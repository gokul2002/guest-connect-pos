import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useKitchenNotifications = (onNewOrder?: () => void) => {
  const { toast } = useToast();
  const isInitialized = useRef(false);

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First ding
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      
      oscillator1.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator1.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
      
      gainNode1.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.4);

      // Second ding after delay
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      
      oscillator2.frequency.setValueAtTime(1100, audioContext.currentTime + 0.25);
      oscillator2.frequency.setValueAtTime(1320, audioContext.currentTime + 0.35);
      
      gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode2.gain.setValueAtTime(0.4, audioContext.currentTime + 0.25);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      
      oscillator2.start(audioContext.currentTime + 0.25);
      oscillator2.stop(audioContext.currentTime + 0.6);

      console.log('Kitchen notification sound played');
    } catch (error) {
      console.error('Audio notification error:', error);
    }
  }, []);

  useEffect(() => {
    // Mark as initialized after a delay to avoid initial load notifications
    const initTimer = setTimeout(() => {
      isInitialized.current = true;
      console.log('Kitchen notifications initialized');
    }, 3000);

    const channel = supabase
      .channel('kitchen-orders-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order INSERT received:', payload);
          
          if (!isInitialized.current) {
            console.log('Skipping notification - not yet initialized');
            return;
          }

          playNotificationSound();
          
          const tableNumber = payload.new.table_number;
          toast({
            title: '🔔 New Order!',
            description: tableNumber 
              ? `New order for Table ${tableNumber}` 
              : 'New delivery/takeaway order',
            duration: 5000,
          });

          onNewOrder?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order UPDATE received:', payload);
          
          if (!isInitialized.current) return;

          // Notify when order status changes to pending (items added to existing order)
          if (payload.new.status === 'pending' && payload.old?.status !== 'pending') {
            playNotificationSound();
            
            const tableNumber = payload.new.table_number;
            toast({
              title: '🔔 Order Updated!',
              description: tableNumber 
                ? `New items added to Table ${tableNumber}` 
                : 'New items added to order',
              duration: 5000,
            });

            onNewOrder?.();
          }
        }
      )
      .subscribe((status) => {
        console.log('Kitchen notifications subscription status:', status);
      });

    return () => {
      clearTimeout(initTimer);
      supabase.removeChannel(channel);
    };
  }, [toast, playNotificationSound, onNewOrder]);

  return { playNotificationSound };
};
