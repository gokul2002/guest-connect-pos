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
  DialogDescription,
} from '@/components/ui/dialog';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePOS } from '@/contexts/POSContext';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { usePrintService } from '@/hooks/usePrintService';
import { DbOrder } from '@/hooks/useOrders';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { OrderData } from '@/lib/qzTray';

export default function Billing() {
  const { orders, ordersLoading, processPayment, orderSources } = usePOS();
  const { settings } = useRestaurantSettings();
  const { toast } = useToast();
  const { printOrder, isConnected: qzConnected } = usePrintService();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Helper to get order source name
  const getOrderSourceName = (sourceId: string | null) => {
    if (!sourceId) return null;
    const source = orderSources.find(s => s.id === sourceId);
    return source?.name || null;
  };

  const unpaidOrders = orders.filter(o => !o.isPaid && o.status !== 'cancelled');
  const paidOrders = orders.filter(o => o.isPaid);

  const filteredUnpaid = unpaidOrders.filter(order => {
    const sourceName = getOrderSourceName(order.orderSourceId) || '';
    return order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tableNumber?.toString().includes(searchQuery) ||
      sourceName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handlePayment = async (orderId: string, method: 'cash' | 'card' | 'upi') => {
    // Find the order to check if it's dine-in
    const order = orders.find(o => o.id === orderId);
    const isDineIn = order && order.tableNumber !== null && !order.orderSourceId;

    const { error } = await processPayment(orderId, method);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
      return;
    }

    toast({ title: 'Payment Successful', description: `Payment processed via ${method.toUpperCase()}.` });

    // Auto-print cash receipt for dine-in orders after payment
    if (isDineIn && qzConnected && settings && order) {
      const sourceName = getOrderSourceName(order.orderSourceId);
      const orderData: OrderData = {
        id: order.id,
        tableNumber: order.tableNumber,
        customerName: order.customerName || undefined,
        items: order.items.map(item => ({
          menuItemName: item.menuItemName,
          menuItemPrice: item.menuItemPrice,
          quantity: item.quantity,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
        createdAt: new Date(order.createdAt),
        paymentMethod: method,
        orderSourceName: sourceName || undefined,
      };

      // Print only cash receipt (KOT already printed when order was placed)
      const result = await printOrder(orderData, false, false);
      
      if (result.success) {
        toast({ title: 'Receipt Printed', description: 'Cash receipt sent to printer.' });
      }
    }
  };

  const handlePrintReceipt = (order: DbOrder) => {
    setSelectedOrder(order);
    setShowReceipt(true);
  };

  const printReceipt = async () => {
    if (!selectedOrder) return;

    setIsPrinting(true);

    // Use QZ Tray if connected, otherwise fallback to browser print
    if (qzConnected && settings) {
      const sourceName = getOrderSourceName(selectedOrder.orderSourceId);
      const orderData: OrderData = {
        id: selectedOrder.id,
        tableNumber: selectedOrder.tableNumber,
        customerName: selectedOrder.customerName || undefined,
        items: selectedOrder.items.map(item => ({
          menuItemName: item.menuItemName,
          menuItemPrice: item.menuItemPrice,
          quantity: item.quantity,
        })),
        subtotal: selectedOrder.subtotal,
        tax: selectedOrder.tax,
        total: selectedOrder.total,
        createdAt: new Date(selectedOrder.createdAt),
        paymentMethod: selectedOrder.paymentMethod || undefined,
        orderSourceName: sourceName || undefined,
      };

      // Print only to cash printer (no kitchen for billing reprints)
      const result = await printOrder(orderData, false);

      if (result.success) {
        toast({ title: 'Printed', description: 'Receipt sent to thermal printer.' });
      }
    } else {
      // Fallback to browser print
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
    }

    // Mark order as served to free the table
    if (selectedOrder.isPaid) {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'served' })
        .eq('id', selectedOrder.id);

      if (!error) {
        toast({ title: 'Table Freed', description: `Table ${selectedOrder.tableNumber} is now available.` });
      }
    }

    setIsPrinting(false);
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
                {filteredUnpaid.map((order, index) => {
                  const sourceName = getOrderSourceName(order.orderSourceId);
                  const isDelivery = !order.tableNumber && sourceName;
                  const displayLabel = order.tableNumber ? `T${order.tableNumber}` : (sourceName ? sourceName.charAt(0) : 'O');
                  
                  return (
                    <div 
                      key={order.id} 
                      className="p-3 md:p-4 rounded-lg bg-muted/30 animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 md:gap-4">
                          <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg font-bold text-sm md:text-base ${
                            isDelivery ? 'bg-orange-500/10 text-orange-600' : 'bg-primary/10 text-primary'
                          }`}>
                            {displayLabel}
                          </div>
                          <div>
                            <p className="font-medium text-sm md:text-base">
                              {order.tableNumber ? `Table ${order.tableNumber}` : sourceName || 'Order'}
                            </p>
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
                  );
                })}
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
                {paidOrders.slice(0, 5).map(order => {
                  const sourceName = getOrderSourceName(order.orderSourceId);
                  return (
                    <div 
                      key={order.id}
                      className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-success/5 border border-success/20"
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-success" />
                        <div>
                          <p className="font-medium text-xs md:text-sm">
                            {order.tableNumber ? `Table ${order.tableNumber}` : sourceName || 'Order'}
                          </p>
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
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receipt Dialog */}
        <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
          <DialogContent className="max-w-[90vw] sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-display">Receipt Preview</DialogTitle>
              <DialogDescription>
                {qzConnected ? 'Will print to thermal printer' : 'Will open browser print dialog'}
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrder && (
              <>
                <div ref={receiptRef} className="bg-white text-black p-4 rounded-lg border" style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '12px', maxWidth: '280px', margin: '0 auto' }}>
                  {/* Header */}
                  <div className="text-center mb-2">
                    {settings?.restaurantLogoUrl && (
                      <img src={settings.restaurantLogoUrl} alt="Logo" className="mx-auto mb-2" style={{ maxWidth: '60px' }} />
                    )}
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{settings?.restaurantName || 'RESTAURANT'}</div>
                    {settings?.restaurantAddress && (
                      <div style={{ fontSize: '10px', lineHeight: '1.3' }}>{settings.restaurantAddress}</div>
                    )}
                  </div>
                  
                  {/* Bill Info */}
                  <div style={{ fontSize: '10px', display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <span>Bill No: {selectedOrder.id.slice(-6).toUpperCase()}</span>
                    <span>Date: {format(new Date(selectedOrder.createdAt), 'dd - MMM - yyyy')}</span>
                  </div>
                  
                  {/* Dashed Divider */}
                  <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
                  
                  {/* Items Header */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ fontWeight: 'bold' }}>
                        <th style={{ textAlign: 'left', width: '15%', padding: '2px 0' }}>SN</th>
                        <th style={{ textAlign: 'left', width: '35%', padding: '2px 0' }}>Item</th>
                        <th style={{ textAlign: 'center', width: '15%', padding: '2px 0' }}>Qty</th>
                        <th style={{ textAlign: 'right', width: '15%', padding: '2px 0' }}>Price</th>
                        <th style={{ textAlign: 'right', width: '20%', padding: '2px 0' }}>Amt</th>
                      </tr>
                    </thead>
                  </table>
                  
                  {/* Dashed Divider */}
                  <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
                  
                  {/* Items */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={item.id}>
                          <td style={{ textAlign: 'left', width: '15%', padding: '3px 0', verticalAlign: 'top' }}>{index + 1}</td>
                          <td style={{ textAlign: 'left', width: '35%', padding: '3px 0', verticalAlign: 'top' }}>{item.menuItemName}</td>
                          <td style={{ textAlign: 'center', width: '15%', padding: '3px 0', verticalAlign: 'top' }}>{item.quantity}</td>
                          <td style={{ textAlign: 'right', width: '15%', padding: '3px 0', verticalAlign: 'top' }}>{item.menuItemPrice.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', width: '20%', padding: '3px 0', verticalAlign: 'top' }}>{(item.menuItemPrice * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Dashed Divider */}
                  <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
                  
                  {/* Subtotal */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0' }}>
                    <span>Subtotal</span>
                    <span>{selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    <span style={{ minWidth: '80px', textAlign: 'right' }}>{currencySymbol} {selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Dashed Divider */}
                  <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
                  
                  {/* Tax */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '11px', padding: '2px 0' }}>
                    <span style={{ marginRight: '20px' }}>Tax ({settings?.taxPercentage || 10}%)</span>
                    <span style={{ minWidth: '60px', textAlign: 'right' }}>{selectedOrder.tax.toFixed(2)}</span>
                  </div>
                  
                  {/* Double Dashed Divider */}
                  <div style={{ borderTop: '2px dashed #000', margin: '8px 0' }} />
                  
                  {/* Total */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', padding: '4px 0' }}>
                    <span>TOTAL</span>
                    <span>{currencySymbol} {selectedOrder.total.toFixed(2)}</span>
                  </div>
                  
                  {/* Payment Method */}
                  {selectedOrder.paymentMethod && (
                    <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '8px', padding: '4px', background: '#f0f0f0' }}>
                      Paid via {selectedOrder.paymentMethod.toUpperCase()}
                    </div>
                  )}
                  
                  {/* Dashed Divider */}
                  <div style={{ borderTop: '1px dashed #000', margin: '12px 0 8px 0' }} />
                  
                  {/* Footer */}
                  <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                    Thank You
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '10px', marginTop: '4px', color: '#666' }}>
                    Please Visit Again
                  </div>
                </div>
                
                <Button onClick={printReceipt} className="w-full" disabled={isPrinting}>
                  <Printer className="h-4 w-4 mr-2" />
                  {isPrinting ? 'Printing...' : 'Print Receipt'}
                </Button>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}