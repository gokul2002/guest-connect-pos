import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ChefHat, 
  Users, 
  UtensilsCrossed,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePOS } from '@/contexts/POSContext';

const adminNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/kitchen', icon: ChefHat, label: 'Kitchen' },
  { to: '/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
];

const staffNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/billing', icon: Receipt, label: 'Billing' },
];

const chefNavItems = [
  { to: '/kitchen', icon: ChefHat, label: 'Kitchen' },
];

export function BottomNav() {
  const { currentUser } = usePOS();

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
