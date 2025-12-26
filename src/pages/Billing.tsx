import { useState, useRef } from 'react';
import { Printer, CreditCard, Banknote, Smartphone, Search, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePOS } from '@/contexts/POSContext';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { DbOrder } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Billing() {
  const { orders, ordersLoading, processPayment } = usePOS();
  const { settings } = useRestaurantSettings();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const unpaidOrders = orders.filter(o => !o.isPaid && o.status !== 'cancelled');
  const paidOrders = orders.filter(o => o.isPaid);

  const filteredUnpaid = unpaidOrders.filter(order =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.tableNumber.toString().includes(searchQuery)
  );

  const handlePayment = async (orderId: string, method: 'cash' | 'card' | 'upi') => {
    const { error } = await processPayment(orderId, method);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Payment Successful', description: `Payment processed via ${method.toUpperCase()}.` });
    }
  };

  const handlePrintReceipt = (order: DbOrder) => {
    setSelectedOrder(order);
    setShowReceipt(true);
  };

  const printReceipt = () => {
    const printContent = receiptRef.current;
    if (printContent) {
      const printWindow = window.open('', '', 'width=300,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt</title>
              <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; max-width: 280px; }
                .header { text-align: center; margin-bottom: 15px; }
                .header h1 { font-size: 18px; margin: 0; }
                .header p { margin: 5px 0; font-size: 10px; }
                .header img { max-width: 80px; margin-bottom: 10px; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .item { display: flex; justify-content: space-between; margin: 5px 0; }
                .total { font-weight: bold; font-size: 14px; }
                .footer { text-align: center; margin-top: 15px; font-size: 10px; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
    setShowReceipt(false);
  };

  const todayTotal = paidOrders
    .filter(o => new Date(o.updatedAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total, 0);

  const currencySymbol = settings?.currencySymbol || '₹';

  if (ordersLoading) {
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
          <h1 className="font-display text-2xl md:text-3xl font-bold">Billing</h1>
          <p className="text-sm text-muted-foreground">Process payments and print receipts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <Card>
            <CardContent className="p-3 md:p-4">
              <p className="text-xl md:text-2xl font-bold">{unpaidOrders.length}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <p className="text-xl md:text-2xl font-bold">{paidOrders.length}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-3 md:p-4">
              <p className="text-xl md:text-2xl font-bold text-success">{currencySymbol}{todayTotal.toLocaleString()}</p>
              <p className="text-xs md:text-sm text-muted-foreground">Today</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Pending Payments */}
        <Card>
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
            <CardTitle className="font-display text-base md:text-lg">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            {filteredUnpaid.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 md:py-8 text-sm">No pending payments</p>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {filteredUnpaid.map((order, index) => (
                  <div 
                    key={order.id} 
                    className="p-3 md:p-4 rounded-lg bg-muted/30 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 md:gap-4">
                        <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm md:text-base">
                          T{order.tableNumber}
                        </div>
                        <div>
                          <p className="font-medium text-sm md:text-base">Table {order.tableNumber}</p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {order.customerName || 'Walk-in'} • {order.items.length} items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg md:text-xl font-bold text-primary">{currencySymbol}{order.total}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePayment(order.id, 'cash')}
                        className="flex-1 min-w-[70px]"
                      >
                        <Banknote className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Cash</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePayment(order.id, 'card')}
                        className="flex-1 min-w-[70px]"
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Card</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePayment(order.id, 'upi')}
                        className="flex-1 min-w-[70px]"
                      >
                        <Smartphone className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">UPI</span>
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handlePrintReceipt(order)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Completed */}
        <Card>
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
            <CardTitle className="font-display text-base md:text-lg">Recent Completed</CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            {paidOrders.slice(0, 5).length === 0 ? (
              <p className="text-center text-muted-foreground py-6 md:py-8 text-sm">No completed orders yet</p>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {paidOrders.slice(0, 5).map(order => (
                  <div 
                    key={order.id}
                    className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-success/5 border border-success/20"
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-success" />
                      <div>
                        <p className="font-medium text-xs md:text-sm">Table {order.tableNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.paymentMethod?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm md:text-base">{currencySymbol}{order.total}</span>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handlePrintReceipt(order)}
                        className="h-8 w-8 p-0"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receipt Dialog */}
        <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
          <DialogContent className="max-w-[90vw] sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display">Receipt Preview</DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <>
                <div ref={receiptRef} className="bg-background p-4 rounded-lg border font-mono text-sm">
                  <div className="header text-center mb-4">
                    {settings?.restaurantLogoUrl && (
                      <img src={settings.restaurantLogoUrl} alt="Logo" className="mx-auto mb-2" style={{ maxWidth: '80px' }} />
                    )}
                    <h1 className="text-xl font-bold">{settings?.restaurantName || 'HotelPOS'}</h1>
                    {settings?.restaurantAddress && (
                      <p className="text-muted-foreground text-xs whitespace-pre-line">{settings.restaurantAddress}</p>
                    )}
                  </div>
                  
                  <div className="border-t border-dashed my-3" />
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Table:</span>
                      <span>{selectedOrder.tableNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{format(new Date(selectedOrder.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                    </div>
                    {selectedOrder.customerName && (
                      <div className="flex justify-between">
                        <span>Customer:</span>
                        <span>{selectedOrder.customerName}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-dashed my-3" />
                  
                  <div className="space-y-2">
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span>{item.quantity}x {item.menuItemName}</span>
                        <span>{currencySymbol}{item.menuItemPrice * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-dashed my-3" />
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Subtotal (excl. tax):</span>
                      <span>{currencySymbol}{selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({settings?.taxPercentage || 10}% incl.):</span>
                      <span>{currencySymbol}{selectedOrder.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2">
                      <span>TOTAL:</span>
                      <span>{currencySymbol}{selectedOrder.total.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center pt-1">Prices are inclusive of tax</p>
                  </div>
                  
                  {selectedOrder.paymentMethod && (
                    <>
                      <div className="border-t border-dashed my-3" />
                      <div className="text-center text-xs">
                        <p>Paid via {selectedOrder.paymentMethod.toUpperCase()}</p>
                      </div>
                    </>
                  )}
                  
                  <div className="border-t border-dashed my-3" />
                  
                  <div className="footer text-center text-xs text-muted-foreground">
                    <p>Thank you for dining with us!</p>
                    <p>Please visit again</p>
                  </div>
                </div>
                
                <Button onClick={printReceipt} className="w-full">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}