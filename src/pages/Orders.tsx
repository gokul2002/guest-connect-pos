import { useState, useMemo } from 'react';
import { Plus, Minus, ShoppingCart, Trash2, Search, Flame, ArrowUpDown, ArrowLeft, Users, UtensilsCrossed, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePOS } from '@/contexts/POSContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TableStatus = 'free' | 'ordered' | 'preparing' | 'ready';

interface CartItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  menuItemPrice: number;
  quantity: number;
  notes?: string;
}

const tableStatusConfig: Record<TableStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  free: { label: 'Available', color: 'text-green-600', bgColor: 'border-green-500 bg-green-500/10 hover:bg-green-500/20', icon: Users },
  ordered: { label: 'Ordered', color: 'text-orange-600', bgColor: 'border-orange-500 bg-orange-500/20 hover:bg-orange-500/30', icon: UtensilsCrossed },
  preparing: { label: 'Preparing', color: 'text-blue-600', bgColor: 'border-blue-500 bg-blue-500/20 hover:bg-blue-500/30', icon: Clock },
  ready: { label: 'Ready', color: 'text-purple-600', bgColor: 'border-purple-500 bg-purple-500/20 hover:bg-purple-500/30', icon: CheckCircle },
};

export default function Orders() {
  const { menuItems, categories, menuLoading, addOrder, tableCount, getTableStatus } = usePOS();
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useRestaurantSettings();
  
  const [step, setStep] = useState<'table' | 'menu'>('table');
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'name' | 'price-low' | 'price-high'>('name');
  const [showCart, setShowCart] = useState(false);

  const categoryNames = ['All', ...categories.map(c => c.name)];

  const filteredAndSortedItems = useMemo(() => {
    let items = menuItems.filter(item => item.available);
    if (selectedCategory !== 'All') {
      items = items.filter(item => item.categoryName === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }
    switch (sortBy) {
      case 'name':
        items = [...items].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        items = [...items].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        items = [...items].sort((a, b) => b.price - a.price);
        break;
    }
    return items;
  }, [menuItems, selectedCategory, searchQuery, sortBy]);

  const addToCart = (item: typeof menuItems[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => 
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { 
        id: `cart-${Date.now()}`, 
        menuItemId: item.id,
        menuItemName: item.name,
        menuItemPrice: item.price,
        quantity: 1 
      }];
    });
    toast({ title: 'Added to cart', description: `${item.name} added` });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return null;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  // Tax-inclusive calculation: prices already include tax
  const taxRate = (settings?.taxPercentage || 10) / 100;
  const total = cart.reduce((sum, item) => sum + (item.menuItemPrice * item.quantity), 0);
  const subtotal = total / (1 + taxRate);
  const tax = total - subtotal;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const currencySymbol = settings?.currencySymbol || '₹';

  const handleSelectTable = (tableNum: number) => {
    setSelectedTable(tableNum);
    setStep('menu');
  };

  const handleBackToTables = () => {
    setStep('table');
    setSelectedTable(null);
    setCart([]);
    setCustomerName('');
    setShowCart(false);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast({ title: 'Cart is empty', description: 'Please add items to the cart first.', variant: 'destructive' });
      return;
    }
    if (!selectedTable) {
      toast({ title: 'Table not selected', description: 'Please select a table first.', variant: 'destructive' });
      return;
    }

    const { error } = await addOrder({
      tableNumber: selectedTable,
      customerName: customerName || undefined,
      subtotal,
      tax,
      total,
      createdBy: user?.id,
      items: cart.map(item => ({
        menuItemId: item.menuItemId,
        menuItemName: item.menuItemName,
        menuItemPrice: item.menuItemPrice,
        quantity: item.quantity,
        notes: item.notes,
      })),
    });

    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
      return;
    }

    toast({ title: 'Order placed!', description: `Order for Table ${selectedTable} has been sent to the kitchen.` });

    setCart([]);
    setCustomerName('');
    setShowCart(false);
    setStep('table');
    setSelectedTable(null);
  };

  if (menuLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  // TABLE SELECTION VIEW
  if (step === 'table') {
    return (
      <MainLayout>
        <div className="flex flex-col h-[calc(100vh-8rem)] md:h-auto animate-fade-in overflow-hidden">
          <div className="flex-shrink-0 space-y-4 pb-4">
            <div>
              <h1 className="font-display text-xl md:text-3xl font-bold">Select Table</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Choose a table to start new order</p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              {(Object.entries(tableStatusConfig) as [TableStatus, typeof tableStatusConfig[TableStatus]][]).map(([status, config]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded border-2 ${config.bgColor.split(' ')[0]}`} />
                  <span className={config.color}>{config.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {Array.from({ length: tableCount }, (_, i) => i + 1).map((tableNum) => {
                const status = getTableStatus(tableNum);
                const config = tableStatusConfig[status];
                const StatusIcon = config.icon;

                return (
                  <button
                    key={tableNum}
                    onClick={() => handleSelectTable(tableNum)}
                    className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-95 ${config.bgColor}`}
                  >
                    <span className="text-2xl md:text-3xl font-bold">{tableNum}</span>
                    <div className={`flex items-center gap-1 text-[10px] md:text-xs ${config.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      <span>{config.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // MENU VIEW
  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)] md:h-auto animate-fade-in overflow-hidden">
        <div className="flex-shrink-0 space-y-3 pb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleBackToTables}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-display text-xl md:text-3xl font-bold">Table {selectedTable}</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Add items to order</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${tableStatusConfig[getTableStatus(selectedTable!)].bgColor} ${tableStatusConfig[getTableStatus(selectedTable!)].color}`}>
              {tableStatusConfig[getTableStatus(selectedTable!)].label}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search food items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <div className="flex gap-2 items-center">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[130px] h-9 text-xs">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">A-Z</SelectItem>
                <SelectItem value="price-low">Price: Low</SelectItem>
                <SelectItem value="price-high">Price: High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categoryNames.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap flex-shrink-0 h-8 text-xs px-3"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 overflow-y-auto overscroll-contain pb-20 md:pb-4">
            <div className="grid gap-2 grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedItems.map((item) => (
                <Card key={item.id} className="cursor-pointer hover:border-primary/50 transition-all duration-200 active:scale-[0.98] relative overflow-hidden" onClick={() => addToCart(item)}>
                  <CardContent className="p-3">
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm line-clamp-1 pr-8">{item.name}</h3>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{item.description}</p>
                      <div className="flex items-center justify-between pt-1">
                        <p className="font-bold text-primary text-sm">{currencySymbol}{item.price}</p>
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {filteredAndSortedItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No items found</p>
                <p className="text-sm">Try a different search or category</p>
              </div>
            )}
          </div>

          {/* Cart - Desktop */}
          <div className="hidden md:block md:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="pb-3 p-4">
                <CardTitle className="font-display flex items-center gap-2 text-base">
                  <ShoppingCart className="h-4 w-4" />
                  Cart ({cartItemCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                <div>
                  <Label htmlFor="customer" className="text-xs">Customer Name</Label>
                  <Input id="customer" placeholder="Name (Optional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-9" />
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">No items in cart</p>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">{item.menuItemName}</p>
                          <p className="text-[10px] text-muted-foreground">{currencySymbol}{item.menuItemPrice} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                          <span className="w-5 text-center text-xs font-medium">{item.quantity}</span>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="space-y-1 pt-3 border-t">
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subtotal (excl. tax)</span><span>{currencySymbol}{subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-muted-foreground">Tax ({settings?.taxPercentage || 10}% incl.)</span><span>{currencySymbol}{tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span className="text-primary">{currencySymbol}{total.toFixed(2)}</span></div>
                  </div>
                )}

                <Button className="w-full h-10" size="lg" onClick={handlePlaceOrder} disabled={cart.length === 0}>
                  Place Order
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Cart Button */}
        <div className="md:hidden fixed bottom-20 left-4 right-4 z-40">
          <Button className="w-full h-12 shadow-lg" onClick={() => setShowCart(true)}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            View Cart ({cartItemCount}) - {currencySymbol}{total.toFixed(2)}
          </Button>
        </div>

        {/* Mobile Cart Sheet */}
        {showCart && (
          <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setShowCart(false)}>
            <div className="absolute bottom-0 left-0 right-0 bg-background border-t rounded-t-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-background pt-2 pb-3 px-4 border-b">
                <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Table {selectedTable} - Cart ({cartItemCount})
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowCart(false)}>Close</Button>
                </div>
              </div>
              
              <div className="p-4 pb-8 space-y-4">
                <div>
                  <Label htmlFor="customer-mobile" className="text-sm font-medium">Customer Name</Label>
                  <Input id="customer-mobile" placeholder="Name (Optional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-12 mt-1" />
                </div>

                <div className="space-y-2 max-h-[35vh] overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No items in cart</p>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.menuItemName}</p>
                          <p className="text-xs text-muted-foreground">{currencySymbol}{item.menuItemPrice} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-4 w-4" /></Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal (excl. tax)</span><span>{currencySymbol}{subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tax ({settings?.taxPercentage || 10}% incl.)</span><span>{currencySymbol}{tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span className="text-primary">{currencySymbol}{total.toFixed(2)}</span></div>
                  </div>
                )}

                <Button className="w-full h-14 text-lg" size="lg" onClick={handlePlaceOrder} disabled={cart.length === 0}>
                  Place Order - {currencySymbol}{total.toFixed(2)}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}