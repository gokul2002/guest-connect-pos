import { useCallback } from "react";
import { useRestaurantSettings } from "./useRestaurantSettings";
import { useToast } from "./use-toast";
import { printBothReceipts, testPrint, OrderData, PrintSettings } from "@/lib/qzTray";
import { useQzConnection } from "@/hooks/useQzConnection";
import { retryQzConnection } from "@/lib/qzConnection";

export function usePrintService() {
  const { settings } = useRestaurantSettings();
  const { toast } = useToast();
  const qzConn = useQzConnection();

  const isConnected = qzConn.isConnected;

  /**
   * Print order to both printers (assumes global QZ connection is already initialized in App).
   */
  const printOrder = useCallback(
    async (order: OrderData, printToKitchen: boolean = true) => {
      if (!settings) {
        toast({ title: "Settings not loaded", description: "Please wait for settings to load", variant: "destructive" });
        return { success: false };
      }

      if (!isConnected) {
        toast({
          title: "QZ Tray not connected",
          description: qzConn.error || "Start QZ Tray and refresh the app.",
          variant: "destructive",
        });
        return { success: false };
      }

      const kitchenPrinter = settings.kitchenPrinterName || "Kitchen Printer";
      const cashPrinter = settings.cashPrinterName || "Cash Printer";

      const printSettings: PrintSettings = {
        restaurantName: settings.restaurantName,
        restaurantAddress: settings.restaurantAddress,
        restaurantLogoUrl: settings.restaurantLogoUrl,
        currencySymbol: settings.currencySymbol,
        taxPercentage: settings.taxPercentage,
      };

      const result = await printBothReceipts(order, kitchenPrinter, cashPrinter, printSettings, printToKitchen);

      if (result.errors.length > 0) {
        toast({ title: "Print Warning", description: result.errors.join("; "), variant: "destructive" });
      }

      return {
        success: result.kitchenSuccess && result.cashSuccess,
        kitchenSuccess: result.kitchenSuccess,
        cashSuccess: result.cashSuccess,
      };
    },
    [settings, toast, isConnected, qzConn.error]
  );

  /**
   * Test print a sample receipt (no connect attempt here).
   */
  const testPrintReceipt = useCallback(
    async (type: "kitchen" | "cash") => {
      if (!settings) {
        toast({ title: "Settings not loaded", description: "Please wait for settings to load", variant: "destructive" });
        return false;
      }

      if (!isConnected) {
        toast({
          title: "QZ Tray not connected",
          description: qzConn.error || "Start QZ Tray and refresh the app.",
          variant: "destructive",
        });
        return false;
      }

      const printerName = type === "kitchen" ? settings.kitchenPrinterName || "Kitchen Printer" : settings.cashPrinterName || "Cash Printer";

      const printSettings: PrintSettings = {
        restaurantName: settings.restaurantName,
        restaurantAddress: settings.restaurantAddress,
        restaurantLogoUrl: settings.restaurantLogoUrl,
        currencySymbol: settings.currencySymbol,
        taxPercentage: settings.taxPercentage,
      };

      const result = await testPrint(printerName, type, printSettings);

      if (result.success) {
        toast({ title: "Test Print Sent", description: `Test ${type} receipt sent to ${printerName}` });
      } else {
        toast({ title: "Print Failed", description: result.error || "Unknown error", variant: "destructive" });
      }

      return result.success;
    },
    [settings, toast, isConnected, qzConn.error]
  );

  const reconnect = useCallback(async () => {
    const success = await retryQzConnection();
    if (success) {
      toast({ title: "Connected", description: "QZ Tray connected successfully" });
    } else {
      toast({ title: "Connection Failed", description: "Make sure QZ Tray is running", variant: "destructive" });
    }
    return success;
  }, [toast]);

  return {
    isConnected,
    status: qzConn.status,
    error: qzConn.error,
    reconnect,
    printOrder,
    testPrintReceipt,
  };
}

