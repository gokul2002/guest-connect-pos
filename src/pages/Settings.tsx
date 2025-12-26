import { useState, useEffect } from 'react';
import { Plus, Minus, Table2, Save, Store, Clock, DollarSign, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePOS } from '@/contexts/POSContext';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { tableCount, setTableCount } = usePOS();
  const { settings, loading, updateSettings } = useRestaurantSettings();
  const { toast } = useToast();
  
  const [localTableCount, setLocalTableCount] = useState(tableCount);
  const [restaurantName, setRestaurantName] = useState('');
  const [taxPercentage, setTaxPercentage] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('');
  const [businessHoursOpen, setBusinessHoursOpen] = useState('');
  const [businessHoursClose, setBusinessHoursClose] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form values when settings load
  useEffect(() => {
    if (settings) {
      setRestaurantName(settings.restaurantName);
      setTaxPercentage(String(settings.taxPercentage));
      setCurrencySymbol(settings.currencySymbol);
      setBusinessHoursOpen(settings.businessHoursOpen);
      setBusinessHoursClose(settings.businessHoursClose);
    }
  }, [settings]);

  const handleIncrement = () => {
    if (localTableCount < 50) {
      setLocalTableCount(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (localTableCount > 1) {
      setLocalTableCount(prev => prev - 1);
    }
  };

  const handleSaveTableCount = () => {
    setTableCount(localTableCount);
    toast({
      title: 'Settings saved',
      description: `Table count updated to ${localTableCount}`,
    });
  };

  const handleSaveRestaurantSettings = async () => {
    setIsSaving(true);
    const { error } = await updateSettings({
      restaurantName,
      taxPercentage: parseFloat(taxPercentage) || 0,
      currencySymbol,
      businessHoursOpen,
      businessHoursClose,
    });
    setIsSaving(false);

    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Settings saved',
        description: 'Restaurant settings have been updated.',
      });
    }
  };

  const hasTableChanges = localTableCount !== tableCount;
  const hasRestaurantChanges = settings && (
    restaurantName !== settings.restaurantName ||
    taxPercentage !== String(settings.taxPercentage) ||
    currencySymbol !== settings.currencySymbol ||
    businessHoursOpen !== settings.businessHoursOpen ||
    businessHoursClose !== settings.businessHoursClose
  );

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your restaurant settings</p>
        </div>

        {/* Restaurant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Restaurant Information
            </CardTitle>
            <CardDescription>
              Basic information about your restaurant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <div className="h-10 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="restaurant-name">Restaurant Name</Label>
                  <Input
                    id="restaurant-name"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Enter restaurant name"
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency-symbol" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Currency Symbol
                    </Label>
                    <Input
                      id="currency-symbol"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      placeholder="₹"
                      className="h-11"
                      maxLength={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax-percentage" className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Tax Percentage
                    </Label>
                    <Input
                      id="tax-percentage"
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(e.target.value)}
                      placeholder="10"
                      className="h-11"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Business Hours
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="hours-open" className="text-xs text-muted-foreground">Opening Time</Label>
                      <Input
                        id="hours-open"
                        type="time"
                        value={businessHoursOpen}
                        onChange={(e) => setBusinessHoursOpen(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="hours-close" className="text-xs text-muted-foreground">Closing Time</Label>
                      <Input
                        id="hours-close"
                        type="time"
                        value={businessHoursClose}
                        onChange={(e) => setBusinessHoursClose(e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveRestaurantSettings} 
                  disabled={!hasRestaurantChanges || isSaving}
                  className="w-full sm:w-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Restaurant Settings'}
                </Button>

                {hasRestaurantChanges && (
                  <p className="text-xs text-orange-500">
                    You have unsaved changes
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Table Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table2 className="h-5 w-5" />
              Table Management
            </CardTitle>
            <CardDescription>
              Configure the number of tables in your restaurant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Number of Tables</Label>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl"
                  onClick={handleDecrement}
                  disabled={localTableCount <= 1}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                
                <div className="flex-1 max-w-[120px]">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={localTableCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1 && val <= 50) {
                        setLocalTableCount(val);
                      }
                    }}
                    className="h-12 text-center text-xl font-bold"
                  />
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl"
                  onClick={handleIncrement}
                  disabled={localTableCount >= 50}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum: 1 table, Maximum: 50 tables
              </p>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 p-4 rounded-xl bg-muted/50 max-h-[200px] overflow-y-auto">
                {Array.from({ length: localTableCount }, (_, i) => i + 1).map((num) => (
                  <div
                    key={num}
                    className="aspect-square rounded-lg border-2 border-green-500 bg-green-500/10 flex items-center justify-center text-xs font-bold text-green-600"
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSaveTableCount} 
              disabled={!hasTableChanges}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Table Count
            </Button>

            {hasTableChanges && (
              <p className="text-xs text-orange-500">
                You have unsaved changes
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
