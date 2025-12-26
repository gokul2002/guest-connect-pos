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
import { mockDashboardStats } from '@/data/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const chartData = [
  { time: '9AM', sales: 2400 },
  { time: '10AM', sales: 4500 },
  { time: '11AM', sales: 6200 },
  { time: '12PM', sales: 12800 },
  { time: '1PM', sales: 15600 },
  { time: '2PM', sales: 11200 },
  { time: '3PM', sales: 8900 },
  { time: '4PM', sales: 7200 },
  { time: '5PM', sales: 9800 },
  { time: '6PM', sales: 13400 },
  { time: '7PM', sales: 18200 },
  { time: '8PM', sales: 16800 },
];

const categoryData = [
  { name: 'Main Course', orders: 45 },
  { name: 'Starters', orders: 32 },
  { name: 'Beverages', orders: 28 },
  { name: 'Desserts', orders: 18 },
  { name: 'Breads', orders: 42 },
];

const stats = [
  {
    title: "Today's Sales",
    value: `₹${mockDashboardStats.todaySales.toLocaleString()}`,
    change: '+12.5%',
    changeType: 'positive' as const,
    icon: IndianRupee,
  },
  {
    title: 'Total Orders',
    value: mockDashboardStats.totalOrders,
    change: '+8.2%',
    changeType: 'positive' as const,
    icon: ShoppingCart,
  },
  {
    title: 'Pending Orders',
    value: mockDashboardStats.pendingOrders,
    change: '-5.1%',
    changeType: 'negative' as const,
    icon: Clock,
  },
  {
    title: 'Avg. Order Value',
    value: `₹${mockDashboardStats.averageOrderValue}`,
    change: '+3.2%',
    changeType: 'positive' as const,
    icon: TrendingUp,
  },
];

export default function Dashboard() {
  const { orders } = usePOS();
  
  const recentOrders = orders.slice(0, 5);

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
          {stats.map((stat, index) => (
            <Card key={stat.title} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-xl bg-primary/10">
                    <stat.icon className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                  </div>
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
              <CardTitle className="font-display text-base md:text-lg">Sales Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-4">
              <div className="h-[200px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
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
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Sales']}
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
                      <p className="font-medium text-xs md:text-sm">{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.length} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm md:text-base">₹{order.total}</p>
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
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
