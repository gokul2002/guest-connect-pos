import { Clock, CheckCircle2, ChefHat, Timer, Volume2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePOS } from '@/contexts/POSContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { DbOrder } from '@/hooks/useOrders';
import { useKitchenNotifications } from '@/hooks/useKitchenNotifications';

export default function Kitchen() {
  const { orders, ordersLoading, updateOrderStatus, refetchOrders } = usePOS();
  const { toast } = useToast();
  
  // Enable sound notifications for new orders
  const { playNotificationSound } = useKitchenNotifications(() => {
    refetchOrders();
  });

  // Filter only today's orders for kitchen display
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });

  const pendingOrders = todayOrders.filter(o => o.status === 'pending');
  const preparingOrders = todayOrders.filter(o => o.status === 'preparing');
  const readyOrders = todayOrders.filter(o => o.status === 'ready');

  const handleStatusChange = async (orderId: string, newStatus: DbOrder['status']) => {
    const { error } = await updateOrderStatus(orderId, newStatus);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Order Updated', description: `Order is now ${newStatus}.` });
    }
  };

  const OrderCard = ({ order, showActions = true }: { order: DbOrder; showActions?: boolean }) => (
    <Card className="animate-scale-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
              T{order.tableNumber}
            </span>
            Order
          </CardTitle>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Timer className="h-4 w-4" />
            <span className="text-sm">
              {formatDistanceToNow(new Date(order.createdAt), { addSuffix: false })}
            </span>
          </div>
        </div>
        {order.customerName && (
          <p className="text-sm text-muted-foreground">{order.customerName}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between items-start p-2 rounded bg-muted/50">
              <div>
                <p className="font-medium">{item.menuItemName}</p>
                {item.notes && (
                  <p className="text-sm text-warning">Note: {item.notes}</p>
                )}
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {item.quantity}
              </span>
            </div>
          ))}
        </div>

        {showActions && (
          <div className="pt-2 flex gap-2">
            {order.status === 'pending' && (
              <Button 
                className="flex-1"
                onClick={() => handleStatusChange(order.id, 'preparing')}
              >
                <ChefHat className="h-4 w-4 mr-2" />
                Start Preparing
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button 
                variant="success"
                className="flex-1"
                onClick={() => handleStatusChange(order.id, 'ready')}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Ready
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (ordersLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Kitchen Display</h1>
          <p className="text-sm text-muted-foreground">Manage orders and track preparation</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-4">
              <div className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-xl bg-warning/20">
                <Clock className="h-4 w-4 md:h-6 md:w-6 text-warning" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">{pendingOrders.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-4">
              <div className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-xl bg-primary/20">
                <ChefHat className="h-4 w-4 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">{preparingOrders.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Preparing</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-success/50 bg-success/5">
            <CardContent className="p-3 md:p-4 flex items-center gap-2 md:gap-4">
              <div className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-xl bg-success/20">
                <CheckCircle2 className="h-4 w-4 md:h-6 md:w-6 text-success" />
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">{readyOrders.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Ready</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders */}
        <div className="space-y-4">
          {/* Mobile: Stacked sections */}
          <div className="space-y-6 lg:hidden">
            {pendingOrders.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2 sticky top-0 bg-background py-2">
                  <Clock className="h-4 w-4 text-warning" />
                  Pending ({pendingOrders.length})
                </h2>
                <div className="space-y-3">
                  {pendingOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}
            
            {preparingOrders.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2 sticky top-0 bg-background py-2">
                  <ChefHat className="h-4 w-4 text-primary" />
                  Preparing ({preparingOrders.length})
                </h2>
                <div className="space-y-3">
                  {preparingOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}
            
            {readyOrders.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2 sticky top-0 bg-background py-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Ready ({readyOrders.length})
                </h2>
                <div className="space-y-3">
                  {readyOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </div>
            )}
            
            {pendingOrders.length === 0 && preparingOrders.length === 0 && readyOrders.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  No active orders
                </CardContent>
              </Card>
            )}
          </div>

          {/* Desktop: 3-column grid */}
          <div className="hidden lg:grid gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Pending Orders
              </h2>
              <div className="space-y-4">
                {pendingOrders.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No pending orders
                    </CardContent>
                  </Card>
                ) : (
                  pendingOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary" />
                Preparing
              </h2>
              <div className="space-y-4">
                {preparingOrders.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No orders being prepared
                    </CardContent>
                  </Card>
                ) : (
                  preparingOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Ready to Serve
              </h2>
              <div className="space-y-4">
                {readyOrders.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No orders ready
                    </CardContent>
                  </Card>
                ) : (
                  readyOrders.map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}