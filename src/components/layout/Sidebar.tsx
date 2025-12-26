import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ChefHat, 
  Users, 
  UtensilsCrossed,
  Receipt,
  LogOut,
  Hotel
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePOS } from '@/contexts/POSContext';
import { Button } from '@/components/ui/button';

const adminNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/kitchen', icon: ChefHat, label: 'Kitchen' },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/staff', icon: Users, label: 'Staff' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
];

const staffNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
];

const chefNavItems = [
  { to: '/kitchen', icon: ChefHat, label: 'Kitchen' },
];

export function Sidebar() {
  const location = useLocation();
  const { currentUser, logout } = usePOS();

  const getNavItems = () => {
    switch (currentUser?.role) {
      case 'admin':
        return adminNavItems;
      case 'staff':
        return staffNavItems;
      case 'chef':
        return chefNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <Hotel className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-sidebar-foreground">HotelPOS</h1>
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
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {currentUser?.role}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}
