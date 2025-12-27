import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ChefHat, 
  Users, 
  UtensilsCrossed,
  Receipt,
  LogOut,
  Hotel,
  Settings,
  ClipboardList,
  Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { Button } from '@/components/ui/button';

const adminNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/kitchen', icon: ChefHat, label: 'Kitchen' },
  { to: '/order-history', icon: ClipboardList, label: 'Order History' },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/staff', icon: Users, label: 'Staff' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
  { to: '/printer-config', icon: Printer, label: 'Printers' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const staffNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/order-history', icon: ClipboardList, label: 'Order History' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
];

const chefNavItems = [
  { to: '/kitchen', icon: ChefHat, label: 'Kitchen' },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();
  const { settings } = useRestaurantSettings();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const kitchenEnabled = settings?.kitchenEnabled !== false;

  const getNavItems = () => {
    let items: typeof adminNavItems = [];
    switch (role) {
      case 'admin':
        items = adminNavItems;
        break;
      case 'staff':
        items = staffNavItems;
        break;
      case 'chef':
        items = chefNavItems;
        break;
      default:
        items = [];
    }
    
    // Filter out kitchen if disabled
    if (!kitchenEnabled) {
      items = items.filter(item => item.to !== '/kitchen');
    }
    
    return items;
  };

  const navItems = getNavItems();

  return (
    <aside className="hidden md:block fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          {settings?.restaurantLogoUrl ? (
            <img
              src={settings.restaurantLogoUrl}
              alt="Restaurant Logo"
              className="h-10 w-10 rounded-xl object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Hotel className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="font-display text-lg font-bold text-sidebar-foreground">
              {settings?.restaurantName || 'HotelPOS'}
            </h1>
            <p className="text-xs text-sidebar-foreground/60">Management System</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground font-medium">
              {profile?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile?.name}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {role}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}
