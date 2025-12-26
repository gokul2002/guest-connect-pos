import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ChefHat, 
  Users, 
  UtensilsCrossed,
  Receipt,
  Settings,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';

const adminNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/order-history', icon: ClipboardList, label: 'History' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
];

const staffNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/order-history', icon: ClipboardList, label: 'History' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
];

const chefNavItems = [
  { to: '/kitchen', icon: ChefHat, label: 'Kitchen' },
];

export function BottomNav() {
  const { role } = useAuth();
  const { settings } = useRestaurantSettings();
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-[60px]',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
