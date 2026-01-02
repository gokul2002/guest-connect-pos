import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePrintService } from "./usePrintService";
import { useRestaurantSettings } from "./useRestaurantSettings";
import { useToast } from "./use-toast";
import { useIsMobile } from "./use-mobile";
import { OrderData } from "@/lib/qzTray";

interface OrderWithItems {
  id: string;
  table_number: string | null;
  customer_name: string | null;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  order_source_id: string | null;
  printed_at: string | null;
  status: string;
}

interface OrderItem {
  menu_item_name: string;
  menu_item_price: number;
  quantity: number;
}

/**
 * Hook for auto-printing new orders on desktop devices with QZ Tray connected.
 * - Only runs on desktop browsers
 * - Listens for new orders via Supabase realtime
 * - Prints KOT + Cash receipt automatically
 * - Marks orders as printed to prevent duplicates
 */
export function useAutoPrint() {
  // Get print service with updated 3-argument printOrder signature
  const { printOrder, isConnected } = usePrintService();
  const { settings } = useRestaurantSettings();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Track orders being processed to prevent race conditions
  const processingOrders = useRef<Set<string>>(new Set());

  const markOrderAsPrinted = useCallback(async (orderId: string) => {
    // Use raw update since printed_at might not be in generated types yet
    const { error } = await supabase
      .from("orders")
      .update({ printed_at: new Date().toISOString() } as any)
      .eq("id", orderId);
    
    if (error) {
      console.error("Failed to mark order as printed:", error);
    }
  }, []);

  const fetchOrderItems = useCallback(async (orderId: string): Promise<OrderItem[]> => {
    const { data, error } = await supabase
      .from("order_items")
      .select("menu_item_name, menu_item_price, quantity")
      .eq("order_id", orderId);
    
    if (error) {
      console.error("Failed to fetch order items:", error);
      return [];
    }
    return data || [];
  }, []);

  const fetchOrderSourceName = useCallback(async (sourceId: string | null): Promise<string | undefined> => {
    if (!sourceId) return undefined;
    
    const { data, error } = await supabase
      .from("order_sources")
      .select("name")
      .eq("id", sourceId)
      .single();
    
    if (error) {
      console.error("Failed to fetch order source:", error);
      return undefined;
    }
    return data?.name;
  }, []);

  const processNewOrder = useCallback(async (order: OrderWithItems) => {
    // Skip if already printed or being processed
    if (order.printed_at || processingOrders.current.has(order.id)) {
      return;
    }

    // Skip if mobile device
    if (isMobile) {
      return;
    }

    // Skip if QZ Tray not connected
    if (!isConnected) {
      return;
    }

    // Skip if settings not loaded
    if (!settings) {
      return;
    }

    // Mark as processing
    processingOrders.current.add(order.id);

    try {
      // Fetch order items
      const items = await fetchOrderItems(order.id);
      if (items.length === 0) {
        console.warn("Order has no items, skipping print:", order.id);
        processingOrders.current.delete(order.id);
        return;
      }

      // Fetch order source name if applicable
      const orderSourceName = await fetchOrderSourceName(order.order_source_id);

      // Determine order type:
      // - Dine-in: has table_number, no order_source_id
      // - Delivery/Takeaway: has order_source_id
      const isDineIn = order.table_number !== null && !order.order_source_id;
      const isDeliveryOrTakeaway = order.order_source_id !== null;

      // Build order data for printing
      const orderData: OrderData = {
        id: order.id,
        tableNumber: order.table_number,
        customerName: order.customer_name || undefined,
        items: items.map(item => ({
          menuItemName: item.menu_item_name,
          menuItemPrice: item.menu_item_price,
          quantity: item.quantity,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        createdAt: new Date(order.created_at),
        orderSourceName,
      };

      // Printing logic based on order type:
      // - Dine-in: Print ONLY KOT (kitchen), cash receipt prints from Billing after payment
      // - Delivery/Takeaway: Print BOTH KOT + Cash immediately
      const printToKitchen = settings.kitchenEnabled !== false;
      const printToCash = isDeliveryOrTakeaway; // Only print cash for delivery/takeaway

      let result;
      if (printToCash) {
        // Delivery/Takeaway: Print both
        result = await printOrder(orderData, printToKitchen);
      } else {
        // Dine-in: Print only KOT (import and use printKitchenOnly)
        result = await printOrder(orderData, printToKitchen, true); // skipCash = true
      }

      if (result.success || result.kitchenSuccess) {
        // Mark as printed in database
        await markOrderAsPrinted(order.id);

        const location = order.table_number 
          ? `Table ${order.table_number}` 
          : orderSourceName || "Order";

        const printerMsg = isDineIn 
          ? "kitchen" 
          : (printToKitchen ? "kitchen & cash" : "cash");

        toast({
          title: "Order Auto-Printed",
          description: `${location} - Sent to ${printerMsg} printer`,
        });
      }
    } catch (error) {
      console.error("Auto-print error:", error);
      toast({
        title: "Auto-Print Failed",
        description: "Failed to print order automatically",
        variant: "destructive",
      });
    } finally {
      processingOrders.current.delete(order.id);
    }
  }, [isMobile, isConnected, settings, fetchOrderItems, fetchOrderSourceName, printOrder, markOrderAsPrinted, toast]);

  // Check for unprinted orders on mount and when connection status changes
  useEffect(() => {
    // Only run on desktop with QZ connected
    if (isMobile || !isConnected || !settings) {
      return;
    }

    const checkUnprintedOrders = async () => {
      // Use raw query since printed_at might not be in generated types yet
      const { data: unprintedOrders, error } = await supabase
        .from("orders")
        .select("*")
        .is("printed_at" as any, null)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to fetch unprinted orders:", error);
        return;
      }

      // Process each unprinted order
      for (const order of unprintedOrders || []) {
        await processNewOrder(order as unknown as OrderWithItems);
      }
    };

    checkUnprintedOrders();
  }, [isMobile, isConnected, settings, processNewOrder]);

  // Subscribe to realtime order inserts
  useEffect(() => {
    // Only subscribe on desktop with QZ connected
    if (isMobile || !isConnected) {
      return;
    }

    const channel = supabase
      .channel("auto-print-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const newOrder = payload.new as OrderWithItems;
          // Small delay to ensure order_items are inserted
          setTimeout(() => {
            processNewOrder(newOrder);
          }, 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMobile, isConnected, processNewOrder]);

  return {
    isAutoPrintEnabled: !isMobile && isConnected,
  };
}
