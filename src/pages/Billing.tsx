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
import { Order } from '@/types/pos';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Billing() {
  const { orders, setOrders } = usePOS();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const unpaidOrders = orders.filter(o => !o.isPaid && o.status !== 'cancelled');
  const paidOrders = orders.filter(o => o.isPaid);

  const filteredUnpaid = unpaidOrders.filter(order =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.tableNumber.toString().includes(searchQuery)
  );

  const handlePayment = (orderId: string, method: 'cash' | 'card' | 'upi') => {
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, isPaid: true, paymentMethod: method, updatedAt: new Date() }
        : order
    ));
    
    toast({
      title: 'Payment Successful',
      description: `Order ${orderId} paid via ${method.toUpperCase()}.`,
    });
  };

  const handlePrintReceipt = (order: Order) => {
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
              <title>Receipt - ${selectedOrder?.id}</title>
              <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; max-width: 280px; }
                .header { text-align: center; margin-bottom: 15px; }
                .header h1 { font-size: 18px; margin: 0; }
                .header p { margin: 5px 0; font-size: 10px; }
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

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Process payments and print receipts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{unpaidOrders.length}</p>
              <p className="text-sm text-muted-foreground">Pending Payments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{paidOrders.length}</p>
              <p className="text-sm text-muted-foreground">Completed Today</p>
            </CardContent>
          </Card>
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-success">₹{todayTotal.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Today's Collection</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, customer name, or table number..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUnpaid.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No pending payments</p>
            ) : (
              <div className="space-y-4">
                {filteredUnpaid.map((order, index) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                        T{order.tableNumber}
                      </div>
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customerName || 'Walk-in'} • {order.items.length} items
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Subtotal: ₹{order.subtotal}</p>
                        <p className="text-sm text-muted-foreground">Tax: ₹{order.tax}</p>
                        <p className="text-xl font-bold text-primary">₹{order.total}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePayment(order.id, 'cash')}
                          title="Pay with Cash"
                        >
                          <Banknote className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePayment(order.id, 'card')}
                          title="Pay with Card"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handlePayment(order.id, 'upi')}
                          title="Pay with UPI"
                        >
                          <Smartphone className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handlePrintReceipt(order)}
                          title="Print Receipt"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Completed */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Recent Completed</CardTitle>
          </CardHeader>
          <CardContent>
            {paidOrders.slice(0, 5).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No completed orders yet</p>
            ) : (
              <div className="space-y-3">
                {paidOrders.slice(0, 5).map(order => (
                  <div 
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium">{order.id} - Table {order.tableNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          Paid via {order.paymentMethod?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">₹{order.total}</span>
                      <Button 
                        size="sm" 
                        variant="ghost"
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

        {/* Receipt Dialog */}
        <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display">Receipt Preview</DialogTitle>
            </DialogHeader>
            
            {selectedOrder && (
              <>
                <div ref={receiptRef} className="bg-background p-4 rounded-lg border font-mono text-sm">
                  <div className="header text-center mb-4">
                    <h1 className="text-xl font-bold">HotelPOS</h1>
                    <p className="text-muted-foreground text-xs">123 Restaurant Street</p>
                    <p className="text-muted-foreground text-xs">Tel: +91 9876543210</p>
                  </div>
                  
                  <div className="border-t border-dashed my-3" />
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Order:</span>
                      <span>{selectedOrder.id}</span>
                    </div>
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
                        <span>{item.quantity}x {item.menuItem.name}</span>
                        <span>₹{item.menuItem.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-dashed my-3" />
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (5%):</span>
                      <span>₹{selectedOrder.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-2">
                      <span>TOTAL:</span>
                      <span>₹{selectedOrder.total.toFixed(2)}</span>
                    </div>
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
