import { useState } from 'react';
import { Menu, LogOut, Hotel, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePOS } from '@/contexts/POSContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function MobileHeader() {
  const { currentUser, logout } = usePOS();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border md:hidden safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
            <Hotel className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-sidebar-foreground">HotelPOS</span>
        </div>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-sidebar border-sidebar-border p-0">
            <SheetHeader className="p-4 border-b border-sidebar-border">
              <SheetTitle className="text-sidebar-foreground text-left">Menu</SheetTitle>
            </SheetHeader>
            
            <div className="p-4 space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium text-sidebar-foreground">{currentUser?.name}</p>
                  <p className="text-xs text-sidebar-foreground/60 capitalize">{currentUser?.role}</p>
                </div>
              </div>

              {/* Admin-only link */}
              {currentUser?.role === 'admin' && (
                <NavLink
                  to="/staff"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    )
                  }
                >
                  <Users className="h-5 w-5" />
                  Staff Management
                </NavLink>
              )}

              {/* Logout */}
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
