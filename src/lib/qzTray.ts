// QZ Tray type declarations
declare global {
  interface Window {
    qz: {
      websocket: {
        connect: () => Promise<void>;
        disconnect: () => Promise<void>;
        isActive: () => boolean;
      };
      printers: {
        find: (name?: string) => Promise<string | string[]>;
        getDefault: () => Promise<string>;
      };
      print: (config: QZConfig, data: QZPrintData[]) => Promise<void>;
      configs: {
        create: (printerName: string) => QZConfig;
      };
    };
  }
}

interface QZConfig {
  getPrinter: () => string;
}

type QZPrintData = 
  | string 
  | { type: 'raw'; format: 'image'; flavor: 'file' | 'base64'; data: string; options?: { language: string; dotDensity: string } };

export interface OrderData {
  id: string;
  tableNumber?: number | null;
  customerName?: string;
  items: {
    menuItemName: string;
    menuItemPrice: number;
    quantity: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: Date;
  paymentMethod?: string;
  orderSourceName?: string;
}

export interface PrintSettings {
  restaurantName: string;
  restaurantAddress: string;
  restaurantLogoUrl: string | null;
  currencySymbol: string;
  taxPercentage: number;
}

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';
const INIT = ESC + '@';
const CENTER = ESC + 'a' + '\x01';
const LEFT = ESC + 'a' + '\x00';
const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';
const DOUBLE_SIZE = GS + '!' + '\x11';
const NORMAL_SIZE = GS + '!' + '\x00';
const CUT = GS + 'V' + '\x00';
const LINE_FEED = '\n';

// Helper to pad/truncate strings for fixed-width columns
const padRight = (str: string, len: number) => str.slice(0, len).padEnd(len);
const padLeft = (str: string, len: number) => str.slice(0, len).padStart(len);

// Format date/time
const formatDateTime = (date: Date) => {
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { dateStr, timeStr };
};

/**
 * Check if QZ Tray is connected (connection is initialized globally in App).
 */
function ensureQzConnected(): { ok: true } | { ok: false; error: string } {
  if (!window.qz) {
    return { ok: false, error: "QZ Tray library not loaded" };
  }
  if (!window.qz.websocket?.isActive?.()) {
    return { ok: false, error: "QZ Tray is not connected. Start QZ Tray and refresh the app." };
  }
  return { ok: true };
}


/**
 * Build Kitchen Receipt (KOT) ESC/POS data - NO IMAGE
 */
function buildKitchenReceiptData(order: OrderData, restaurantName: string): string {
  const { dateStr, timeStr } = formatDateTime(order.createdAt);
  const divider = '-'.repeat(42);
  const doubleDivider = '='.repeat(42);
  
  let receipt = '';
  
  // Initialize printer
  receipt += INIT;
  
  // Header
  receipt += CENTER + DOUBLE_SIZE + BOLD_ON;
  receipt += restaurantName.toUpperCase() + LINE_FEED;
  receipt += 'KITCHEN ORDER' + LINE_FEED;
  receipt += NORMAL_SIZE + BOLD_OFF;
  receipt += doubleDivider + LINE_FEED;
  
  // Order details
  receipt += LEFT;
  receipt += `Order: #${order.id.slice(0, 8).toUpperCase()}` + LINE_FEED;
  
  if (order.tableNumber) {
    receipt += `Table: ${order.tableNumber}` + LINE_FEED;
  } else if (order.orderSourceName) {
    receipt += `Source: ${order.orderSourceName}` + LINE_FEED;
  }
  
  if (order.customerName) {
    receipt += `Customer: ${order.customerName}` + LINE_FEED;
  }
  
  receipt += `Date: ${dateStr}  Time: ${timeStr}` + LINE_FEED;
  receipt += divider + LINE_FEED;
  
  // Column headers
  receipt += BOLD_ON;
  receipt += padRight('ITEM', 34) + padLeft('QTY', 8) + LINE_FEED;
  receipt += BOLD_OFF;
  receipt += divider + LINE_FEED;
  
  // Items
  receipt += BOLD_ON;
  for (const item of order.items) {
    receipt += padRight(item.menuItemName, 34) + padLeft(String(item.quantity), 8) + LINE_FEED;
  }
  receipt += BOLD_OFF;
  
  receipt += divider + LINE_FEED;
  receipt += LINE_FEED + LINE_FEED + LINE_FEED;
  
  // Cut paper
  receipt += CUT;
  
  return receipt;
}

/**
 * Build Cash Receipt ESC/POS data - WITH IMAGE SUPPORT
 */
function buildCashReceiptData(order: OrderData, settings: PrintSettings): QZPrintData[] {
  const { dateStr, timeStr } = formatDateTime(order.createdAt);
  const divider = '-'.repeat(42);
  const doubleDivider = '='.repeat(42);
  const { currencySymbol } = settings;
  
  const data: QZPrintData[] = [];
  
  // Initialize printer
  data.push(INIT);
  
  // Add logo image if available (HTTPS URL)
  if (settings.restaurantLogoUrl) {
    data.push({
      type: 'raw',
      format: 'image',
      flavor: 'file',
      data: settings.restaurantLogoUrl,
      options: {
        language: 'ESCPOS',
        dotDensity: 'double'
      }
    });
    data.push(LINE_FEED);
  }
  
  // Header
  let header = CENTER + DOUBLE_SIZE + BOLD_ON;
  header += settings.restaurantName.toUpperCase() + LINE_FEED;
  header += NORMAL_SIZE + BOLD_OFF;
  
  // Address
  if (settings.restaurantAddress) {
    const addressLines = settings.restaurantAddress.split('\n');
    for (const line of addressLines) {
      header += line.trim() + LINE_FEED;
    }
  }
  
  header += doubleDivider + LINE_FEED;
  data.push(header);
  
  // Order details
  let orderDetails = LEFT;
  orderDetails += `Bill No: #${order.id.slice(0, 8).toUpperCase()}` + LINE_FEED;
  orderDetails += `Date: ${dateStr}  Time: ${timeStr}` + LINE_FEED;
  
  if (order.tableNumber) {
    orderDetails += `Table: ${order.tableNumber}` + LINE_FEED;
  } else if (order.orderSourceName) {
    orderDetails += `Source: ${order.orderSourceName}` + LINE_FEED;
  }
  
  if (order.customerName) {
    orderDetails += `Customer: ${order.customerName}` + LINE_FEED;
  }
  
  orderDetails += divider + LINE_FEED;
  data.push(orderDetails);
  
  // Column headers for items
  // SN(3) Item(17) Qty(4) Price(8) Amt(10) = 42 chars
  let itemHeader = BOLD_ON;
  itemHeader += padRight('SN', 3) + padRight('Item', 17) + padLeft('Qty', 4) + padLeft('Price', 8) + padLeft('Amt', 10) + LINE_FEED;
  itemHeader += BOLD_OFF;
  itemHeader += divider + LINE_FEED;
  data.push(itemHeader);
  
  // Items
  let items = '';
  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    const sn = String(i + 1);
    const amount = item.menuItemPrice * item.quantity;
    
    items += padRight(sn, 3);
    items += padRight(item.menuItemName, 17);
    items += padLeft(String(item.quantity), 4);
    items += padLeft(String(item.menuItemPrice.toFixed(0)), 8);
    items += padLeft(amount.toFixed(2), 10);
    items += LINE_FEED;
  }
  items += divider + LINE_FEED;
  data.push(items);
  
  // Totals
  let totals = '';
  totals += padRight('', 24) + padRight('Subtotal:', 8) + padLeft(currencySymbol + order.subtotal.toFixed(2), 10) + LINE_FEED;
  totals += padRight('', 24) + padRight(`Tax (${settings.taxPercentage}%):`, 8) + padLeft(currencySymbol + order.tax.toFixed(2), 10) + LINE_FEED;
  totals += doubleDivider + LINE_FEED;
  totals += BOLD_ON + DOUBLE_SIZE;
  totals += padRight('', 16) + padRight('TOTAL:', 8) + padLeft(currencySymbol + order.total.toFixed(2), 18) + LINE_FEED;
  totals += NORMAL_SIZE + BOLD_OFF;
  totals += doubleDivider + LINE_FEED;
  data.push(totals);
  
  // Payment method
  let payment = '';
  if (order.paymentMethod) {
    payment += `Payment Mode: ${order.paymentMethod.toUpperCase()}` + LINE_FEED;
  }
  payment += divider + LINE_FEED;
  data.push(payment);
  
  // Footer
  let footer = CENTER;
  footer += LINE_FEED;
  footer += 'Thank you for dining with us!' + LINE_FEED;
  footer += 'Visit Again!' + LINE_FEED;
  footer += LINE_FEED + LINE_FEED + LINE_FEED;
  footer += CUT;
  data.push(footer);
  
  return data;
}

/**
 * Print Kitchen Receipt (KOT) - NO IMAGE
 */
export async function printKitchenReceipt(
  order: OrderData,
  printerName: string,
  restaurantName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const check = ensureQzConnected();
    if (check.ok === false) return { success: false, error: check.error };

    const config = window.qz.configs.create(printerName);
    const receiptData = buildKitchenReceiptData(order, restaurantName);

    await window.qz.print(config, [receiptData]);
    console.log("Kitchen receipt printed successfully");
    return { success: true };
  } catch (err) {
    console.error("Kitchen print error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to print kitchen receipt" };
  }
}

/**
 * Print Cash Receipt - WITH IMAGE
 */
export async function printCashReceipt(
  order: OrderData,
  printerName: string,
  settings: PrintSettings
): Promise<{ success: boolean; error?: string }> {
  try {
    const check = ensureQzConnected();
    if (check.ok === false) return { success: false, error: check.error };

    const config = window.qz.configs.create(printerName);
    const receiptData = buildCashReceiptData(order, settings);

    await window.qz.print(config, receiptData);
    console.log("Cash receipt printed successfully");
    return { success: true };
  } catch (err) {
    console.error("Cash print error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to print cash receipt" };
  }
}



/**
 * Print both receipts (Kitchen + Cash)
 * @param skipCash - If true, skip printing the cash receipt (for dine-in orders)
 */
export async function printBothReceipts(
  order: OrderData,
  kitchenPrinterName: string,
  cashPrinterName: string,
  settings: PrintSettings,
  printToKitchen: boolean = true,
  skipCash: boolean = false
): Promise<{ kitchenSuccess: boolean; cashSuccess: boolean; errors: string[] }> {
  const errors: string[] = [];
  let kitchenSuccess = true;
  let cashSuccess = true;
  
  // Print Kitchen Receipt if enabled
  if (printToKitchen) {
    const kitchenResult = await printKitchenReceipt(order, kitchenPrinterName, settings.restaurantName);
    kitchenSuccess = kitchenResult.success;
    if (kitchenResult.error) {
      errors.push(`Kitchen: ${kitchenResult.error}`);
    }
  }
  
  // Print Cash Receipt (unless skipped for dine-in)
  if (!skipCash) {
    const cashResult = await printCashReceipt(order, cashPrinterName, settings);
    cashSuccess = cashResult.success;
    if (cashResult.error) {
      errors.push(`Cash: ${cashResult.error}`);
    }
  }
  
  return { kitchenSuccess, cashSuccess, errors };
}

/**
 * Test print a sample receipt
 */
export async function testPrint(printerName: string, type: 'kitchen' | 'cash', settings: PrintSettings): Promise<{ success: boolean; error?: string }> {
  const sampleOrder: OrderData = {
    id: 'TEST12345678',
    tableNumber: 5,
    customerName: 'Test Customer',
    items: [
      { menuItemName: 'Butter Chicken', menuItemPrice: 350, quantity: 2 },
      { menuItemName: 'Garlic Naan', menuItemPrice: 50, quantity: 4 },
      { menuItemName: 'Biryani', menuItemPrice: 250, quantity: 1 },
    ],
    subtotal: 1045.45,
    tax: 104.55,
    total: 1150.00,
    createdAt: new Date(),
    paymentMethod: 'cash',
  };
  
  if (type === 'kitchen') {
    return printKitchenReceipt(sampleOrder, printerName, settings.restaurantName);
  } else {
    return printCashReceipt(sampleOrder, printerName, settings);
  }
}
