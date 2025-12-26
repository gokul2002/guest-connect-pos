import { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Table2, Save, Store, Clock, DollarSign, Percent, MapPin, Upload, Key, X, Image, Trash2, Edit2, ShoppingBag, Bike, Utensils, Truck, Package, ChefHat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePOS } from '@/contexts/POSContext';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { useOrderSources } from '@/hooks/useOrderSources';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const { tableCount, updateSettings } = usePOS();
  const { settings, loading } = useRestaurantSettings();
  const { orderSources, addOrderSource, updateOrderSource, deleteOrderSource, loading: orderSourcesLoading } = useOrderSources();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [localTableCount, setLocalTableCount] = useState(10);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [restaurantLogoUrl, setRestaurantLogoUrl] = useState<string | null>(null);
  const [taxPercentage, setTaxPercentage] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('');
  const [businessHoursOpen, setBusinessHoursOpen] = useState('');
  const [businessHoursClose, setBusinessHoursClose] = useState('');
  const [kitchenEnabled, setKitchenEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingKitchen, setIsSavingKitchen] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Order source state
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceIcon, setNewSourceIcon] = useState('package');
  const [isAddingSource, setIsAddingSource] = useState(false);

  const iconOptions = [
    { value: 'shopping-bag', label: 'Bag', Icon: ShoppingBag },
    { value: 'bike', label: 'Bike', Icon: Bike },
    { value: 'utensils', label: 'Utensils', Icon: Utensils },
    { value: 'truck', label: 'Truck', Icon: Truck },
    { value: 'package', label: 'Package', Icon: Package },
  ];

  // Initialize form values when settings load
  useEffect(() => {
    if (settings) {
      setLocalTableCount(settings.tableCount ?? 10);
      setRestaurantName(settings.restaurantName);
      setRestaurantAddress(settings.restaurantAddress);
      setRestaurantLogoUrl(settings.restaurantLogoUrl);
      setTaxPercentage(String(settings.taxPercentage));
      setCurrencySymbol(settings.currencySymbol);
      setBusinessHoursOpen(settings.businessHoursOpen);
      setBusinessHoursClose(settings.businessHoursClose);
      setKitchenEnabled(settings.kitchenEnabled);
    }
  }, [settings]);

  const handleToggleKitchen = async () => {
    setIsSavingKitchen(true);
    const newValue = !kitchenEnabled;
    const { error } = await updateSettings({ kitchenEnabled: newValue });
    setIsSavingKitchen(false);

    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    } else {
      setKitchenEnabled(newValue);
      toast({
        title: newValue ? 'Kitchen Enabled' : 'Kitchen Disabled',
        description: newValue 
          ? 'Orders will go through kitchen workflow (pending → preparing → ready).' 
          : 'Orders will skip kitchen and be ready for billing immediately.',
      });
    }
  };

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

  const handleSaveTableCount = async () => {
    const { error } = await updateSettings({ tableCount: localTableCount });
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Settings saved',
        description: `Table count updated to ${localTableCount}`,
      });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('restaurant-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('restaurant-logos')
        .getPublicUrl(fileName);

      setRestaurantLogoUrl(publicUrl);
      toast({
        title: 'Logo uploaded',
        description: 'Remember to save your settings.',
      });
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Failed to upload logo',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setRestaurantLogoUrl(null);
  };

  const handleSaveRestaurantSettings = async () => {
    setIsSaving(true);
    const { error } = await updateSettings({
      restaurantName,
      restaurantAddress,
      restaurantLogoUrl,
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

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'New password and confirm password do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      // First verify old password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: oldPassword,
      });

      if (signInError) {
        toast({
          title: 'Incorrect password',
          description: 'Your current password is incorrect.',
          variant: 'destructive',
        });
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully.',
      });

      // Clear form
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const hasTableChanges = localTableCount !== (settings?.tableCount ?? 10);
  const hasRestaurantChanges = settings && (
    restaurantName !== settings.restaurantName ||
    restaurantAddress !== settings.restaurantAddress ||
    restaurantLogoUrl !== settings.restaurantLogoUrl ||
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
              Basic information about your restaurant (printed on receipts)
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
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Restaurant Logo
                  </Label>
                  <div className="flex items-center gap-4">
                    {restaurantLogoUrl ? (
                      <div className="relative">
                        <img
                          src={restaurantLogoUrl}
                          alt="Restaurant Logo"
                          className="h-20 w-20 object-contain rounded-lg border bg-muted"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={handleRemoveLogo}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                        <Image className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingLogo}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Max 2MB, PNG or JPG
                      </p>
                    </div>
                  </div>
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="restaurant-address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address (for receipts)
                  </Label>
                  <Textarea
                    id="restaurant-address"
                    value={restaurantAddress}
                    onChange={(e) => setRestaurantAddress(e.target.value)}
                    placeholder="Enter full address for thermal printer receipts"
                    rows={3}
                    className="resize-none"
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

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your account password or contact Zouis Corp admin for assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">Current Password</Label>
              <Input
                id="old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 chars)"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="h-11"
              />
            </div>

            <Button 
              onClick={handleChangePassword}
              disabled={!oldPassword || !newPassword || !confirmPassword || isChangingPassword}
              className="w-full sm:w-auto"
            >
              <Key className="h-4 w-4 mr-2" />
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </Button>

            <Separator />

            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                <strong>Forgot your password?</strong><br />
                Contact Zouis Corp admin at <a href="mailto:admin@zouiscorp.com" className="text-primary hover:underline">admin@zouiscorp.com</a> for password reset assistance.
              </p>
            </div>
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

        {/* Kitchen Panel Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Kitchen Panel
            </CardTitle>
            <CardDescription>
              Enable or disable the kitchen workflow for orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="space-y-1">
                <p className="font-medium">Kitchen Workflow</p>
                <p className="text-sm text-muted-foreground">
                  {kitchenEnabled 
                    ? 'Orders go through kitchen (pending → preparing → ready)' 
                    : 'Orders skip kitchen and are ready for billing immediately'}
                </p>
              </div>
              <Switch
                checked={kitchenEnabled}
                onCheckedChange={handleToggleKitchen}
                disabled={isSavingKitchen}
              />
            </div>
            {!kitchenEnabled && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                <p className="text-sm text-warning">
                  <strong>Kitchen is disabled.</strong> All new orders will skip the kitchen workflow and go directly to "ready" status for billing.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Sources Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Sources (Delivery & Takeaway)
            </CardTitle>
            <CardDescription>
              Manage delivery platforms and takeaway options displayed alongside tables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderSourcesLoading ? (
              <div className="h-20 bg-muted animate-pulse rounded" />
            ) : (
              <>
                {/* Existing Sources */}
                <div className="space-y-2">
                  {orderSources.map((source) => {
                    const IconComponent = iconOptions.find(o => o.value === source.icon)?.Icon || Package;
                    return (
                      <div key={source.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <span className="flex-1 font-medium">{source.name}</span>
                        <Switch
                          checked={source.isActive}
                          onCheckedChange={(checked) => {
                            updateOrderSource(source.id, { isActive: checked });
                            toast({ title: checked ? 'Enabled' : 'Disabled', description: `${source.name} is now ${checked ? 'active' : 'inactive'}` });
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={async () => {
                            const { error } = await deleteOrderSource(source.id);
                            if (error) {
                              toast({ title: 'Error', description: error, variant: 'destructive' });
                            } else {
                              toast({ title: 'Deleted', description: `${source.name} has been removed` });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Add New Source */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Add New Order Source</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Source name (e.g., UberEats)"
                      value={newSourceName}
                      onChange={(e) => setNewSourceName(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={newSourceIcon} onValueChange={setNewSourceIcon}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map(({ value, label, Icon }) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      disabled={!newSourceName.trim() || isAddingSource}
                      onClick={async () => {
                        setIsAddingSource(true);
                        const { error } = await addOrderSource({ name: newSourceName, icon: newSourceIcon });
                        setIsAddingSource(false);
                        if (error) {
                          toast({ title: 'Error', description: error, variant: 'destructive' });
                        } else {
                          toast({ title: 'Added', description: `${newSourceName} has been added` });
                          setNewSourceName('');
                          setNewSourceIcon('package');
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}