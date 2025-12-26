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
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl font-bold">New Order</h1>
          <p className="text-muted-foreground">Select items and create a new order</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Menu Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Menu Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.filter(item => item.available).map((item, index) => (
                <Card 
                  key={item.id} 
                  className="cursor-pointer hover:border-primary/50 transition-all duration-200 animate-slide-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => addToCart(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{item.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">₹{item.price}</p>
                        <Button size="icon" variant="ghost" className="h-8 w-8 mt-1">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="font-display flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Current Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="table">Table No.</Label>
                    <Input
                      id="table"
                      type="number"
                      placeholder="1"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer">Customer</Label>
                    <Input
                      id="customer"
                      placeholder="Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Cart Items */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No items in cart
                    </p>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.menuItem.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ₹{item.menuItem.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-destructive"
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
                  className="w-full" 
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
