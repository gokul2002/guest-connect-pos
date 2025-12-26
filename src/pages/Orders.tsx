import { useState } from 'react';
import { Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePOS } from '@/contexts/POSContext';
import { categories } from '@/data/mockData';
import { OrderItem, MenuItem } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';

export default function Orders() {
  const { menuItems, addOrder, currentUser } = usePOS();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');

  const filteredItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

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
  };

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">New Order</h1>
          <p className="text-sm text-muted-foreground">Select items to create order</p>
        </div>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          {/* Menu Section */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap flex-shrink-0"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Menu Grid */}
            <div className="grid gap-2 md:gap-3 grid-cols-2 lg:grid-cols-3">
              {filteredItems.filter(item => item.available).map((item, index) => (
                <Card 
                  key={item.id} 
                  className="cursor-pointer hover:border-primary/50 transition-all duration-200 active:scale-[0.98]"
                  onClick={() => addToCart(item)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm md:text-base line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1 hidden md:block">{item.description}</p>
                      <div className="flex items-center justify-between pt-1">
                        <p className="font-bold text-primary text-sm md:text-base">₹{item.price}</p>
                        <Button size="icon" variant="ghost" className="h-7 w-7 md:h-8 md:w-8">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart Section - Fixed on mobile */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-6">
              <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
                <CardTitle className="font-display flex items-center gap-2 text-base md:text-lg">
                  <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                  Cart ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4 p-3 md:p-6 pt-0 md:pt-0">
                {/* Order Details */}
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div>
                    <Label htmlFor="table" className="text-xs md:text-sm">Table No.</Label>
                    <Input
                      id="table"
                      type="number"
                      placeholder="1"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="h-9 md:h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer" className="text-xs md:text-sm">Customer</Label>
                    <Input
                      id="customer"
                      placeholder="Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-9 md:h-10"
                    />
                  </div>
                </div>

                {/* Cart Items */}
                <div className="space-y-2 max-h-[200px] md:max-h-[300px] overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6 md:py-8 text-sm">
                      No items in cart
                    </p>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs md:text-sm truncate">{item.menuItem.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ₹{item.menuItem.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 md:gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 md:h-7 md:w-7"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-5 md:w-6 text-center text-xs md:text-sm font-medium">{item.quantity}</span>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 md:h-7 md:w-7"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 md:h-7 md:w-7 text-destructive"
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
                  <div className="space-y-1 md:space-y-2 pt-3 md:pt-4 border-t">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Tax (5%)</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base md:text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full h-10 md:h-11" 
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
      </div>
    </MainLayout>
  );
}
