import { useState, useMemo } from 'react';
import { Plus, Minus, ShoppingCart, Trash2, Search, Flame, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePOS } from '@/contexts/POSContext';
import { categories } from '@/data/mockData';
import { OrderItem, MenuItem } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Orders() {
  const { menuItems, addOrder, currentUser } = usePOS();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'name' | 'price-low' | 'price-high'>('popular');
  const [showCart, setShowCart] = useState(false);

  // Mock popularity data (in real app, this would come from order history)
  const popularityMap: Record<string, number> = {
    '1': 150, // Butter Chicken
    '2': 120, // Paneer Tikka
    '3': 80,  // Dal Makhani
    '5': 200, // Biryani
    '6': 90,  // Naan
    '9': 180, // Masala Dosa
    '11': 140, // Mango Lassi
    '13': 110, // Gulab Jamun
  };

  const filteredAndSortedItems = useMemo(() => {
    let items = menuItems.filter(item => item.available);
    
    // Filter by category
    if (selectedCategory !== 'All') {
      items = items.filter(item => item.category === selectedCategory);
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }
    
    // Sort items
    switch (sortBy) {
      case 'popular':
        items = [...items].sort((a, b) => (popularityMap[b.id] || 0) - (popularityMap[a.id] || 0));
        break;
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

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => 
          i.menuItem.id === item.id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { id: `cart-${Date.now()}`, menuItem: item, quantity: 1 }];
    });
    toast({
      title: 'Added to cart',
      description: `${item.name} added`,
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return null;
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) as OrderItem[];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to the cart first.',
        variant: 'destructive',
      });
      return;
    }

    if (!tableNumber) {
      toast({
        title: 'Table number required',
        description: 'Please enter a table number.',
        variant: 'destructive',
      });
      return;
    }

    addOrder({
      items: cart,
      tableNumber: parseInt(tableNumber),
      status: 'pending',
      createdBy: currentUser?.id || '',
      customerName: customerName || undefined,
      subtotal,
      tax,
      total,
      isPaid: false,
    });

    toast({
      title: 'Order placed!',
      description: `Order for Table ${tableNumber} has been sent to the kitchen.`,
    });

    setCart([]);
    setTableNumber('');
    setCustomerName('');
    setShowCart(false);
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)] md:h-auto animate-fade-in overflow-hidden">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 space-y-3 pb-3">
          <div>
            <h1 className="font-display text-xl md:text-3xl font-bold">New Order</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Select items to create order</p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search food items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          {/* Sort & Categories Row */}
          <div className="flex gap-2 items-center">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[130px] h-9 text-xs">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-orange-500" /> Popular
                  </span>
                </SelectItem>
                <SelectItem value="name">A-Z</SelectItem>
                <SelectItem value="price-low">Price: Low</SelectItem>
                <SelectItem value="price-high">Price: High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Categories - Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(category => (
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

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden grid md:grid-cols-3 gap-4">
          {/* Menu Grid - Scrollable */}
          <div className="md:col-span-2 overflow-y-auto overscroll-contain pb-20 md:pb-4">
            <div className="grid gap-2 grid-cols-2 lg:grid-cols-3">
              {filteredAndSortedItems.map((item) => {
                const isPopular = (popularityMap[item.id] || 0) >= 100;
                return (
                  <Card 
                    key={item.id} 
                    className="cursor-pointer hover:border-primary/50 transition-all duration-200 active:scale-[0.98] relative overflow-hidden"
                    onClick={() => addToCart(item)}
                  >
                    {isPopular && (
                      <div className="absolute top-1 right-1 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Flame className="h-2.5 w-2.5" />
                        Hot
                      </div>
                    )}
                    <CardContent className="p-3">
                      <div className="space-y-1">
                        <h3 className="font-medium text-sm line-clamp-1 pr-8">{item.name}</h3>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{item.description}</p>
                        <div className="flex items-center justify-between pt-1">
                          <p className="font-bold text-primary text-sm">₹{item.price}</p>
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <Plus className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {filteredAndSortedItems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No items found</p>
                <p className="text-sm">Try a different search or category</p>
              </div>
            )}
          </div>

          {/* Cart Section - Desktop */}
          <div className="hidden md:block md:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="pb-3 p-4">
                <CardTitle className="font-display flex items-center gap-2 text-base">
                  <ShoppingCart className="h-4 w-4" />
                  Cart ({cartItemCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                {/* Order Details */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="table" className="text-xs">Table No.</Label>
                    <Input
                      id="table"
                      type="number"
                      placeholder="1"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer" className="text-xs">Customer</Label>
                    <Input
                      id="customer"
                      placeholder="Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Cart Items */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 text-sm">
                      No items in cart
                    </p>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">{item.menuItem.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            ₹{item.menuItem.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-5 text-center text-xs font-medium">{item.quantity}</span>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                {cart.length > 0 && (
                  <div className="space-y-1 pt-3 border-t">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Tax (5%)</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full h-10" 
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={cart.length === 0}
                >
                  Place Order
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Cart Button - Fixed at bottom */}
        <div className="md:hidden fixed bottom-20 left-4 right-4 z-40">
          <Button 
            className="w-full h-12 shadow-lg"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            View Cart ({cartItemCount}) - ₹{total.toFixed(2)}
          </Button>
        </div>

        {/* Mobile Cart Sheet */}
        {showCart && (
          <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setShowCart(false)}>
            <div 
              className="absolute bottom-0 left-0 right-0 bg-background border-t rounded-t-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="sticky top-0 bg-background pt-2 pb-3 px-4 border-b">
                <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Cart ({cartItemCount})
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowCart(false)}>
                    Close
                  </Button>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Order Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="table-mobile" className="text-sm">Table No.</Label>
                    <Input
                      id="table-mobile"
                      type="number"
                      placeholder="1"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-mobile" className="text-sm">Customer</Label>
                    <Input
                      id="customer-mobile"
                      placeholder="Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Cart Items */}
                <div className="space-y-2">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No items in cart
                    </p>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.menuItem.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ₹{item.menuItem.price} × {item.quantity} = ₹{(item.menuItem.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-8 w-8 rounded-full"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive ml-1"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                {cart.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (5%)</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full h-12 text-base" 
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={cart.length === 0}
                >
                  Place Order
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
