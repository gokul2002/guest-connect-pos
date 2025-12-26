import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useKitchenNotifications = (onNewOrder?: () => void) => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedInitial = useRef(false);

  // Create audio element for notification sound
  useEffect(() => {
    // Using a simple beep sound via Web Audio API
    audioRef.current = new Audio();
    audioRef.current.volume = 0.5;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    // Create an oscillator-based notification sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Create a pleasant "ding" sound
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
      oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1); // Higher pitch
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // Play a second "ding" for emphasis
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        
        osc2.frequency.setValueAtTime(1100, audioContext.currentTime);
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.3);
      }, 200);

    } catch (error) {
      console.log('Audio notification not supported:', error);
    }
  }, []);

  useEffect(() => {
    // Subscribe to new orders via Supabase realtime
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order received:', payload);
          
          // Skip the initial load
          if (!hasPlayedInitial.current) {
            hasPlayedInitial.current = true;
            return;
          }

          // Play notification sound
          playNotificationSound();
          
          // Show toast notification
          const tableNumber = payload.new.table_number;
          toast({
            title: '🔔 New Order!',
            description: tableNumber 
              ? `New order for Table ${tableNumber}` 
              : 'New delivery/takeaway order',
            duration: 5000,
          });

          // Callback for additional actions
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
          // Also notify when order status changes to pending (items added to existing order)
          if (payload.new.status === 'pending' && payload.old.status !== 'pending') {
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
      .subscribe();

    // Mark as ready after a short delay to avoid initial notifications
    setTimeout(() => {
      hasPlayedInitial.current = true;
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, playNotificationSound, onNewOrder]);

  return { playNotificationSound };
};
