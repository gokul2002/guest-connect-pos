import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';
import { OrderNotifications } from '@/components/notifications/OrderNotifications';
import { useAutoPrint } from '@/hooks/useAutoPrint';
import { Printer } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isAutoPrintEnabled } = useAutoPrint();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Mobile Header */}
      <MobileHeader />
      
      {/* Main Content */}
      <main className="md:pl-64">
        <div className="p-4 md:p-6 pt-[72px] pb-24 md:pt-6 md:pb-6">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />
      
      {/* Floating Order Notifications */}
      <OrderNotifications />

      {/* Auto-Print Status Indicator (Desktop Only) - positioned left of notification bell */}
      {isAutoPrintEnabled && (
        <div className="hidden md:flex fixed bottom-6 right-24 items-center gap-2 bg-green-500/90 text-white px-3 py-2 rounded-full shadow-lg text-sm font-medium z-40">
          <Printer className="h-4 w-4" />
          <span>Auto-Print Active</span>
        </div>
      )}
    </div>
  );
}
