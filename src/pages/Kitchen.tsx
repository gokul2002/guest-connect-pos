import { Clock, CheckCircle2, ChefHat, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePOS } from '@/contexts/POSContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export default function Kitchen() {
  const { orders, updateOrderStatus } = usePOS();
  const { toast } = useToast();

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const handleStatusChange = (orderId: string, newStatus: 'preparing' | 'ready' | 'served') => {
    updateOrderStatus(orderId, newStatus);
    toast({
      title: 'Order Updated',
      description: `Order ${orderId} is now ${newStatus}.`,
    });
  };

  const OrderCard = ({ order, showActions = true }: { order: typeof orders[0]; showActions?: boolean }) => (
    <Card className="animate-scale-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
              T{order.tableNumber}
            </span>
            {order.id}
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
                <p className="font-medium">{item.menuItem.name}</p>
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
            {order.status === 'ready' && (
              <Button 
                variant="secondary"
                className="flex-1"
                onClick={() => handleStatusChange(order.id, 'served')}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Served
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl font-bold">Kitchen Display</h1>
          <p className="text-muted-foreground">Manage incoming orders and track preparation</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingOrders.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <ChefHat className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{preparingOrders.length}</p>
                <p className="text-sm text-muted-foreground">Preparing</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-success/50 bg-success/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{readyOrders.length}</p>
                <p className="text-sm text-muted-foreground">Ready</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Pending */}
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

          {/* Preparing */}
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

          {/* Ready */}
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
    </MainLayout>
  );
}
