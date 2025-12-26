import { 
  TrendingUp, 
  ShoppingCart, 
  Clock, 
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePOS } from '@/contexts/POSContext';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const { orders } = usePOS();
  const { stats, hourlyData, categoryData, loading } = useDashboardStats();
  const { settings } = useRestaurantSettings();
  
  const currencySymbol = settings?.currencySymbol || '₹';
  const recentOrders = orders.slice(0, 5);

  const dashboardStats = [
    {
      title: "Today's Sales",
      value: `${currencySymbol}${stats.todaySales.toLocaleString()}`,
      change: stats.todaySales > 0 ? '+' : '',
      changeType: 'positive' as const,
      icon: IndianRupee,
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      change: '',
      changeType: 'positive' as const,
      icon: ShoppingCart,
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      change: '',
      changeType: stats.pendingOrders > 0 ? 'negative' as const : 'positive' as const,
      icon: Clock,
    },
    {
      title: 'Avg. Order Value',
      value: `${currencySymbol}${stats.averageOrderValue}`,
      change: '',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
  ];

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
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat, index) => (
            <Card key={stat.title} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-xl bg-primary/10">
                    <stat.icon className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                  </div>
                  {stat.change && (
                    <div className={`flex items-center gap-0.5 text-xs md:text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-success' : 'text-destructive'
                    }`}>
                      {stat.changeType === 'positive' ? (
                        <ArrowUpRight className="h-3 w-3 md:h-4 md:w-4" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 md:h-4 md:w-4" />
                      )}
                      <span className="hidden md:inline">{stat.change}</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 md:mt-4">
                  <p className="text-lg md:text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader className="p-3 md:p-6 pb-0 md:pb-0">
              <CardTitle className="font-display text-base md:text-lg">Sales Overview (Today)</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-4">
              <div className="h-[200px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={10} tick={{ fontSize: 10 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tick={{ fontSize: 10 }} width={40} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [`${currencySymbol}${value.toLocaleString()}`, 'Sales']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sales" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorSales)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader className="p-3 md:p-6 pb-0 md:pb-0">
              <CardTitle className="font-display text-base md:text-lg">Orders by Category</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-4">
              <div className="h-[200px] md:h-[300px]">
                {categoryData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No order data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={70} tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
            <CardTitle className="font-display text-base md:text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            {recentOrders.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No orders yet. Create your first order to see it here.
              </div>
            ) : (
              <div className="space-y-2 md:space-y-4">
                {recentOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 md:gap-4">
                      <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-xs md:text-sm">
                        T{order.tableNumber}
                      </div>
                      <div>
                        <p className="font-medium text-xs md:text-sm">Table {order.tableNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items.length} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm md:text-base">{currencySymbol}{order.total}</p>
                      <span className={`inline-flex items-center rounded-full px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-medium ${
                        order.status === 'pending' ? 'bg-warning/10 text-warning' :
                        order.status === 'preparing' ? 'bg-primary/10 text-primary' :
                        order.status === 'ready' ? 'bg-success/10 text-success' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}