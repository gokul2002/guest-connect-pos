import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle2, ChefHat, AlertCircle, Search, XCircle, Calendar, Filter, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { MainLayout } from '@/components/layout/MainLayout';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, isToday } from 'date-fns';

interface OrderItem {
  id: string;
  menuItemName: string;
  menuItemPrice: number;
  quantity: number;
  notes: string | null;
}

interface Order {
  id: string;
  tableNumber: number;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  customerName: string | null;
  total: number;
  isPaid: boolean;
  paymentMethod: string | null;
  createdAt: Date;
  items: OrderItem[];
}

const statusConfig = {
  pending: { label: 'Pending', icon: AlertCircle, color: 'bg-warning/10 text-warning border-warning/30' },
  preparing: { label: 'Preparing', icon: ChefHat, color: 'bg-primary/10 text-primary border-primary/30' },
  ready: { label: 'Ready', icon: CheckCircle2, color: 'bg-success/10 text-success border-success/30' },
  served: { label: 'Served', icon: CheckCircle2, color: 'bg-muted text-muted-foreground border-muted' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

const ITEMS_PER_PAGE = 12;

export default function OrderHistory() {
  const { settings } = useRestaurantSettings();
  const { role } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const isAdmin = role === 'admin';

  const fetchOrders = useCallback(async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*');
      
      if (itemsError) throw itemsError;

      const itemsByOrder = new Map<string, OrderItem[]>();
      (itemsData || []).forEach(item => {
        const orderId = item.order_id;
        if (!itemsByOrder.has(orderId)) {
          itemsByOrder.set(orderId, []);
        }
        itemsByOrder.get(orderId)!.push({
          id: item.id,
          menuItemName: item.menu_item_name,
          menuItemPrice: Number(item.menu_item_price),
          quantity: item.quantity,
          notes: item.notes,
        });
      });

      setOrders((ordersData || []).map(order => ({
        id: order.id,
        tableNumber: order.table_number,
        status: order.status as Order['status'],
        customerName: order.customer_name,
        total: Number(order.total),
        isPaid: order.is_paid,
        paymentMethod: order.payment_method,
        createdAt: new Date(order.created_at),
        items: itemsByOrder.get(order.id) || [],
      })));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // Realtime subscription for auto-refresh
    const channel = supabase
      .channel('order-history-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const currencySymbol = settings?.currencySymbol || '₹';

  // Filter orders based on role - staff/chef only see today's orders
  const roleFilteredOrders = isAdmin 
    ? orders 
    : orders.filter(o => isToday(o.createdAt));

  // Apply date filter (admin only)
  const dateFilteredOrders = dateFilter && isAdmin
    ? roleFilteredOrders.filter(o => {
        const orderDate = startOfDay(o.createdAt);
        const filterDate = startOfDay(dateFilter);
        return orderDate.getTime() === filterDate.getTime();
      })
    : roleFilteredOrders;

  // Apply status filter (admin only)
  const statusFilteredOrders = statusFilter !== 'all' && isAdmin
    ? dateFilteredOrders.filter(o => o.status === statusFilter)
    : dateFilteredOrders;

  const activeOrders = statusFilteredOrders.filter(o => 
    ['pending', 'preparing', 'ready'].includes(o.status)
  );
  
  const completedOrders = statusFilteredOrders.filter(o => 
    ['served', 'cancelled'].includes(o.status)
  );

  const filterOrders = (orderList: Order[]) => {
    if (!searchQuery) return orderList;
    return orderList.filter(order =>
      order.tableNumber.toString().includes(searchQuery) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getDisplayOrders = (orderList: Order[]) => {
    const filtered = filterOrders(orderList);
    return isAdmin ? filtered.slice(0, visibleCount) : filtered;
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  const clearFilters = () => {
    setDateFilter(undefined);
    setStatusFilter('all');
    setSearchQuery('');
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const config = statusConfig[order.status];
    const StatusIcon = config.icon;

    return (
      <Card className={`border ${order.status === 'ready' ? 'border-success/50 shadow-success/10 shadow-lg' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                T{order.tableNumber}
              </div>
              <div>
                <p className="font-medium">Table {order.tableNumber}</p>
                <p className="text-xs text-muted-foreground">
                  {order.customerName || 'Walk-in'} • {format(order.createdAt, 'HH:mm')}
                </p>
              </div>
            </div>
            <Badge className={`${config.color} border`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>

          <div className="space-y-1 mb-3">
            {order.items.slice(0, 3).map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.quantity}x {item.menuItemName}
                </span>
                <span>{currencySymbol}{item.menuItemPrice * item.quantity}</span>
              </div>
            ))}
            {order.items.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{order.items.length - 3} more items
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {format(order.createdAt, 'dd MMM yyyy')}
              </span>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">{currencySymbol}{order.total}</p>
              {order.isPaid && (
                <p className="text-xs text-success">
                  Paid • {order.paymentMethod?.toUpperCase()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
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
          <h1 className="font-display text-2xl md:text-3xl font-bold">Order History</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? 'View all orders with filters' : "Today's orders"}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          <Card>
            <CardContent className="p-3 md:p-4">
              <p className="text-xl md:text-2xl font-bold text-warning">
                {statusFilteredOrders.filter(o => o.status === 'pending').length}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <p className="text-xl md:text-2xl font-bold text-primary">
                {statusFilteredOrders.filter(o => o.status === 'preparing').length}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">Preparing</p>
            </CardContent>
          </Card>
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-3 md:p-4">
              <p className="text-xl md:text-2xl font-bold text-success">
                {statusFilteredOrders.filter(o => o.status === 'ready').length}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">Ready</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <p className="text-xl md:text-2xl font-bold">
                {statusFilteredOrders.filter(o => o.status === 'served').length}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground">Served</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by table, customer, or order ID..."
              className="pl-10 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              {/* Date Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {dateFilter ? format(dateFilter, 'dd MMM yyyy') : 'Date'}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-[130px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="served">Served</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {(dateFilter || statusFilter !== 'all') && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {filterOrders(activeOrders).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No active orders
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {getDisplayOrders(activeOrders).map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
                {isAdmin && filterOrders(activeOrders).length > visibleCount && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={handleLoadMore}>
                      Load More ({filterOrders(activeOrders).length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {filterOrders(completedOrders).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No completed orders
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {getDisplayOrders(completedOrders).map(order => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
                {isAdmin && filterOrders(completedOrders).length > visibleCount && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={handleLoadMore}>
                      Load More ({filterOrders(completedOrders).length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
