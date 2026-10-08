import { Bill } from '../types';

/**
 * Format a bill into a professional, WhatsApp-ready message
 */
export const formatWhatsAppBillMessage = (bill: Bill): string => {
  const dateStr = new Date(bill.billDate).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const itemsList = bill.items
    .map(
      (it, idx) =>
        `${idx + 1}. *${it.productName}*${it.teluguName ? ` (${it.teluguName})` : ''}\n   Qty: ${it.quantity} ${it.unit || ''} × ₹${it.rate.toFixed(2)} = *₹${it.lineTotal.toFixed(2)}*`
    )
    .join('\n');

  const paymentsList = bill.payments
    .map((p) => `• ${p.method.toUpperCase()}: ₹${p.amount.toFixed(2)}`)
    .join('\n');

  return (
`🌿 *BN REDDY NURSERY* 🌿
_Kadiyam, Rajahmundry, Andhra Pradesh_
📞 +91 98480 22334 | GSTIN: 37ABCDE1234F1Z5
━━━━━━━━━━━━━━━━━━━━
🧾 *${bill.billType === 'tax_invoice' ? 'TAX INVOICE' : 'BILL OF SUPPLY'}*
*Invoice No:* ${bill.invoiceNumber}
*Date:* ${dateStr}
*Customer:* ${bill.customerName || 'Valued Customer'}${bill.customerPhone ? ` (${bill.customerPhone})` : ''}
━━━━━━━━━━━━━━━━━━━━
📦 *PURCHASED ITEMS:*
${itemsList}
━━━━━━━━━━━━━━━━━━━━
*Items Subtotal:* ₹${bill.subtotal.toFixed(2)}${bill.billDiscountAmount > 0 ? `\n*Discount:* -₹${bill.billDiscountAmount.toFixed(2)}` : ''}
*Taxable Amount:* ₹${bill.taxableAmount.toFixed(2)}
*Total GST:* ₹${bill.totalTax.toFixed(2)}
${bill.roundOff !== 0 ? `*Round Off:* ₹${bill.roundOff.toFixed(2)}\n` : ''}*💰 GRAND TOTAL:* *₹${bill.grandTotal.toFixed(2)}*
━━━━━━━━━━━━━━━━━━━━
💳 *PAYMENT DETAILS:*
${paymentsList}
${bill.balanceDue > 0 ? `⚠️ *Balance Due:* ₹${bill.balanceDue.toFixed(2)}` : '✅ *Status:* Fully Paid'}

🌱 _Thank you for choosing BN Reddy Nursery! Let us grow together._ 🌿
📍 _NH-16 Bypass Road, Kadiyam, Rajahmundry_`
  );
};

/**
 * Clean phone number and generate WhatsApp link
 */
export const getWhatsAppUrl = (phone: string, bill: Bill): string => {
  // Extract numbers only
  let cleanPhone = phone.replace(/\D/g, '');
  
  // If user entered 10 digits, prefix 91
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    // already has 91
  } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
    cleanPhone = '91' + cleanPhone.slice(1);
  }

  const message = formatWhatsAppBillMessage(bill);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Open WhatsApp with bill message
 */
export const sendBillViaWhatsApp = (phone: string, bill: Bill): boolean => {
  const clean = phone.replace(/\D/g, '');
  if (!clean || clean.length < 10) {
    return false;
  }
  const url = getWhatsAppUrl(phone, bill);
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};
