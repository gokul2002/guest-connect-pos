import { useEffect, useState, useCallback } from 'react';
import { useRestaurantSettings } from './useRestaurantSettings';
import { useToast } from './use-toast';
import { 
  connectQZ, 
  disconnectQZ, 
  isQZConnected, 
  printBothReceipts, 
  testPrint,
  OrderData, 
  PrintSettings 
} from '@/lib/qzTray';

export function usePrintService() {
  const { settings } = useRestaurantSettings();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize QZ Tray connection
  useEffect(() => {
    const initConnection = async () => {
      setIsConnecting(true);
      const connected = await connectQZ();
      setIsConnected(connected);
      setIsConnecting(false);
    };

    // Small delay to ensure QZ Tray library is loaded
    const timer = setTimeout(initConnection, 1000);
    
    return () => {
      clearTimeout(timer);
      disconnectQZ();
    };
  }, []);

  // Check connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(isQZConnected());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  /**
   * Reconnect to QZ Tray
   */
  const reconnect = useCallback(async () => {
    setIsConnecting(true);
    const connected = await connectQZ();
    setIsConnected(connected);
    setIsConnecting(false);
    
    if (connected) {
      toast({ title: 'Connected', description: 'QZ Tray connected successfully' });
    } else {
      toast({ 
        title: 'Connection Failed', 
        description: 'Make sure QZ Tray is running on your computer', 
        variant: 'destructive' 
      });
    }
    
    return connected;
  }, [toast]);

  /**
   * Print order to both printers
   */
  const printOrder = useCallback(async (
    order: OrderData,
    printToKitchen: boolean = true
  ) => {
    if (!settings) {
      toast({ 
        title: 'Settings not loaded', 
        description: 'Please wait for settings to load', 
        variant: 'destructive' 
      });
      return { success: false };
    }

    const kitchenPrinter = settings.kitchenPrinterName || 'Kitchen Printer';
    const cashPrinter = settings.cashPrinterName || 'Cash Printer';
    
    const printSettings: PrintSettings = {
      restaurantName: settings.restaurantName,
      restaurantAddress: settings.restaurantAddress,
      restaurantLogoUrl: settings.restaurantLogoUrl,
      currencySymbol: settings.currencySymbol,
      taxPercentage: settings.taxPercentage,
    };

    const result = await printBothReceipts(
      order,
      kitchenPrinter,
      cashPrinter,
      printSettings,
      printToKitchen
    );

    if (result.errors.length > 0) {
      toast({
        title: 'Print Warning',
        description: result.errors.join('; '),
        variant: 'destructive',
      });
    }

    return { 
      success: result.kitchenSuccess && result.cashSuccess,
      kitchenSuccess: result.kitchenSuccess,
      cashSuccess: result.cashSuccess,
    };
  }, [settings, toast]);

  /**
   * Test print a sample receipt
   */
  const testPrintReceipt = useCallback(async (type: 'kitchen' | 'cash') => {
    if (!settings) {
      toast({ 
        title: 'Settings not loaded', 
        description: 'Please wait for settings to load', 
        variant: 'destructive' 
      });
      return false;
    }

    const printerName = type === 'kitchen' 
      ? (settings.kitchenPrinterName || 'Kitchen Printer')
      : (settings.cashPrinterName || 'Cash Printer');
    
    const printSettings: PrintSettings = {
      restaurantName: settings.restaurantName,
      restaurantAddress: settings.restaurantAddress,
      restaurantLogoUrl: settings.restaurantLogoUrl,
      currencySymbol: settings.currencySymbol,
      taxPercentage: settings.taxPercentage,
    };

    const result = await testPrint(printerName, type, printSettings);
    
    if (result.success) {
      toast({ 
        title: 'Test Print Sent', 
        description: `Test ${type} receipt sent to ${printerName}` 
      });
    } else {
      toast({ 
        title: 'Print Failed', 
        description: result.error || 'Unknown error', 
        variant: 'destructive' 
      });
    }
    
    return result.success;
  }, [settings, toast]);

  return {
    isConnected,
    isConnecting,
    reconnect,
    printOrder,
    testPrintReceipt,
  };
}
