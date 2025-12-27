import { useState, useEffect, useCallback } from 'react';
import { ChefHat, DollarSign, Printer, Save, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/components/layout/MainLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  connectQZ, 
  disconnectQZ, 
  isQZConnected, 
  testPrint,
  PrintSettings 
} from '@/lib/qzTray';

interface PrinterSettings {
  kitchenPrinterName: string;
  cashPrinterName: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantLogoUrl: string | null;
  currencySymbol: string;
  taxPercentage: number;
}

export default function PrinterConfig() {
  const { toast } = useToast();
  
  // Connection state - managed locally, no auto-refresh
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Settings state - loaded once on mount
  const [settings, setSettings] = useState<PrinterSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [kitchenPrinterName, setKitchenPrinterName] = useState('Kitchen Printer');
  const [cashPrinterName, setCashPrinterName] = useState('Cash Printer');
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingKitchen, setIsTestingKitchen] = useState(false);
  const [isTestingCash, setIsTestingCash] = useState(false);

  // Load settings once on mount (manual reload only)
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;

      const loadedSettings: PrinterSettings = {
        kitchenPrinterName: data.kitchen_printer_name || 'Kitchen Printer',
        cashPrinterName: data.cash_printer_name || 'Cash Printer',
        restaurantName: data.restaurant_name,
        restaurantAddress: data.restaurant_address || '',
        restaurantLogoUrl: data.restaurant_logo_url,
        currencySymbol: data.currency_symbol,
        taxPercentage: data.tax_percentage,
      };

      setSettings(loadedSettings);
      setKitchenPrinterName(loadedSettings.kitchenPrinterName);
      setCashPrinterName(loadedSettings.cashPrinterName);
    } catch (err) {
      toast({
        title: 'Error loading settings',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Initialize QZ Tray connection once
  useEffect(() => {
    const initConnection = async () => {
      setIsConnecting(true);
      const connected = await connectQZ();
      setIsConnected(connected);
      setIsConnecting(false);
    };

    // Small delay to ensure QZ Tray library is loaded
    const timer = setTimeout(initConnection, 500);
    
    return () => {
      clearTimeout(timer);
      disconnectQZ();
    };
  }, []);

  // Load settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Manual reconnect
  const handleReconnect = async () => {
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
  };

  // Check connection status (manual)
  const handleCheckConnection = () => {
    const connected = isQZConnected();
    setIsConnected(connected);
    toast({
      title: connected ? 'Connected' : 'Disconnected',
      description: connected ? 'QZ Tray is connected' : 'QZ Tray is not connected',
    });
  };

  // Save printer settings
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('restaurant_settings')
        .update({
          kitchen_printer_name: kitchenPrinterName,
          cash_printer_name: cashPrinterName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (await supabase.from('restaurant_settings').select('id').limit(1).single()).data?.id);

      if (error) throw error;

      setSettings(prev => prev ? {
        ...prev,
        kitchenPrinterName,
        cashPrinterName,
      } : null);

      toast({
        title: 'Settings saved',
        description: 'Printer configuration has been updated.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Test print functions
  const handleTestKitchenPrint = async () => {
    if (!settings) return;
    
    setIsTestingKitchen(true);
    const printSettings: PrintSettings = {
      restaurantName: settings.restaurantName,
      restaurantAddress: settings.restaurantAddress,
      restaurantLogoUrl: settings.restaurantLogoUrl,
      currencySymbol: settings.currencySymbol,
      taxPercentage: settings.taxPercentage,
    };

    const result = await testPrint(kitchenPrinterName, 'kitchen', printSettings);
    
    if (result.success) {
      toast({ 
        title: 'Test Print Sent', 
        description: `Test kitchen receipt sent to ${kitchenPrinterName}` 
      });
    } else {
      toast({ 
        title: 'Print Failed', 
        description: result.error || 'Unknown error', 
        variant: 'destructive' 
      });
    }
    
    setIsTestingKitchen(false);
  };

  const handleTestCashPrint = async () => {
    if (!settings) return;
    
    setIsTestingCash(true);
    const printSettings: PrintSettings = {
      restaurantName: settings.restaurantName,
      restaurantAddress: settings.restaurantAddress,
      restaurantLogoUrl: settings.restaurantLogoUrl,
      currencySymbol: settings.currencySymbol,
      taxPercentage: settings.taxPercentage,
    };

    const result = await testPrint(cashPrinterName, 'cash', printSettings);
    
    if (result.success) {
      toast({ 
        title: 'Test Print Sent', 
        description: `Test cash receipt sent to ${cashPrinterName}` 
      });
    } else {
      toast({ 
        title: 'Print Failed', 
        description: result.error || 'Unknown error', 
        variant: 'destructive' 
      });
    }
    
    setIsTestingCash(false);
  };

  const hasChanges = settings && (
    kitchenPrinterName !== settings.kitchenPrinterName ||
    cashPrinterName !== settings.cashPrinterName
  );

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Printer className="h-7 w-7" />
              Printer Configuration
            </h1>
            <p className="text-sm text-muted-foreground">Configure QZ Tray thermal printers</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchSettings}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Reload
          </Button>
        </div>

        {/* QZ Tray Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-destructive" />
              )}
              QZ Tray Connection
            </CardTitle>
            <CardDescription>
              Status of connection to QZ Tray print service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">
                  Status: {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isConnected 
                    ? 'Ready to print receipts' 
                    : 'Install QZ Tray from qz.io and ensure it is running'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCheckConnection}
                >
                  Check
                </Button>
                <Button 
                  variant={isConnected ? 'outline' : 'default'}
                  size="sm" 
                  onClick={handleReconnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Connecting...' : isConnected ? 'Reconnect' : 'Connect'}
                </Button>
              </div>
            </div>

            {!isConnected && (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                <p className="text-sm text-warning">
                  <strong>QZ Tray is not connected.</strong> Make sure QZ Tray is installed and running on this computer.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Printer Names */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Printer Names
            </CardTitle>
            <CardDescription>
              Enter the exact printer names as shown in your system settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-11 bg-muted animate-pulse rounded" />
                <div className="h-11 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <>
                {/* Kitchen Printer */}
                <div className="space-y-2">
                  <Label htmlFor="kitchen-printer" className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4" />
                    Kitchen Printer Name (KOT)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="kitchen-printer"
                      value={kitchenPrinterName}
                      onChange={(e) => setKitchenPrinterName(e.target.value)}
                      placeholder="Enter exact printer name"
                      className="flex-1 h-11"
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleTestKitchenPrint}
                      disabled={!isConnected || isTestingKitchen}
                    >
                      {isTestingKitchen ? 'Printing...' : 'Test Print'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Prints Kitchen Order Tickets (item name + quantity only, no prices)
                  </p>
                </div>

                <Separator />

                {/* Cash Printer */}
                <div className="space-y-2">
                  <Label htmlFor="cash-printer" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cash Counter Printer Name
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="cash-printer"
                      value={cashPrinterName}
                      onChange={(e) => setCashPrinterName(e.target.value)}
                      placeholder="Enter exact printer name"
                      className="flex-1 h-11"
                    />
                    <Button 
                      variant="outline" 
                      onClick={handleTestCashPrint}
                      disabled={!isConnected || isTestingCash}
                    >
                      {isTestingCash ? 'Printing...' : 'Test Print'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Prints full billing receipts with logo, prices, and totals
                  </p>
                </div>

                <Separator />

                <Button 
                  onClick={handleSave} 
                  disabled={!hasChanges || isSaving}
                  className="w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Printer Settings'}
                </Button>

                {hasChanges && (
                  <p className="text-xs text-orange-500">
                    You have unsaved changes
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="font-medium text-sm">1. Install QZ Tray</p>
                <p className="text-xs text-muted-foreground">
                  Download and install from <a href="https://qz.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">qz.io</a>
                </p>
              </div>
              <div>
                <p className="font-medium text-sm">2. Find Printer Names</p>
                <p className="text-xs text-muted-foreground">
                  Open Windows Settings → Printers & Scanners. Copy the exact printer name (case-sensitive).
                </p>
              </div>
              <div>
                <p className="font-medium text-sm">3. Configure & Test</p>
                <p className="text-xs text-muted-foreground">
                  Enter the printer names above and use the Test Print buttons to verify.
                </p>
              </div>
            </div>

            <Separator />

            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium mb-2">Receipt Types:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li><strong>Kitchen (KOT):</strong> Item names and quantities only, no prices or logo</li>
                <li><strong>Cash Counter:</strong> Full receipt with logo, prices, taxes, and totals</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
