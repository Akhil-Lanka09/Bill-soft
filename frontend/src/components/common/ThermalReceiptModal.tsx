import React, { useRef, useState, useEffect } from 'react';
import { Printer, X, Download, CheckCircle2, Copy, Check, MessageSquare } from 'lucide-react';
import { Bill } from '../../types';
import { sendBillViaWhatsApp, formatWhatsAppBillMessage } from '../../utils/whatsapp';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.031 2C6.496 2 2 6.496 2 12.031c0 1.97.57 3.81 1.554 5.372L2.094 22l4.805-1.422a10.02 10.02 0 0 0 5.132 1.453h.005c5.535 0 10.031-4.496 10.031-10.031S17.566 2 12.031 2zm0 18.25a8.21 8.21 0 0 1-4.238-1.17l-.304-.18-2.854.845.85-2.783-.198-.316A8.204 8.204 0 0 1 3.781 12.03c0-4.549 3.701-8.25 8.25-8.25s8.25 3.701 8.25 8.25c0 4.548-3.701 8.25-8.25 8.25zm4.526-6.177c-.248-.124-1.468-.724-1.696-.807-.228-.083-.393-.124-.559.124-.165.248-.642.807-.787.972-.144.165-.289.186-.537.062-.248-.124-1.047-.386-1.995-1.231-.738-.658-1.237-1.472-1.381-1.72-.145-.248-.016-.382.108-.506.112-.112.248-.289.372-.434.124-.145.165-.248.248-.413.083-.165.041-.31-.021-.434-.062-.124-.559-1.347-.765-1.844-.201-.484-.405-.418-.558-.426-.145-.008-.31-.01-.475-.01s-.434.062-.661.31c-.228.248-.868.848-.868 2.068s.889 2.399 1.013 2.565c.124.165 1.749 2.671 4.238 3.746.592.256 1.054.409 1.415.524.595.189 1.137.162 1.565.098.478-.071 1.468-.6 1.675-1.178.207-.579.207-1.075.145-1.178-.062-.103-.227-.165-.475-.289z" />
  </svg>
);

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  bill,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [targetPhone, setTargetPhone] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (bill) {
      setTargetPhone(bill.customerPhone || '');
      setPhoneError(null);
      setCopied(false);
    }
  }, [bill]);

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    setPhoneError(null);
    const clean = targetPhone.replace(/\D/g, '');
    if (!clean || clean.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }
    const success = sendBillViaWhatsApp(targetPhone, bill);
    if (!success) {
      setPhoneError('Could not open WhatsApp. Check phone number.');
    }
  };

  const handleCopyText = async () => {
    try {
      const text = formatWhatsAppBillMessage(bill);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between sm:justify-start space-x-2">
            <div className="flex items-center space-x-2 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <h3 className="font-bold text-xs sm:text-sm truncate">Invoice Completed: {bill.invoiceNumber}</h3>
            </div>
            <button
              onClick={onClose}
              className="sm:hidden text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
              title="Print 80mm receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (80mm)</span>
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
              title="Send bill via WhatsApp"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="hidden sm:inline-flex text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dedicated WhatsApp Quick Dispatch Bar */}
        <div className="bg-emerald-50 border-b border-emerald-100 p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-emerald-900 text-xs font-bold">
              <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
              <span>Send Digital Bill via WhatsApp</span>
            </div>
            {copied && (
              <span className="text-[11px] font-semibold text-emerald-700 flex items-center space-x-1 animate-in fade-in">
                <Check className="w-3 h-3" />
                <span>Message copied!</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                +91
              </span>
              <input
                type="tel"
                value={targetPhone}
                onChange={(e) => {
                  setTargetPhone(e.target.value);
                  setPhoneError(null);
                }}
                placeholder="10-digit customer mobile number"
                className="w-full pl-11 pr-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={handleSendWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>Send Bill</span>
            </button>
            <button
              onClick={handleCopyText}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
              title="Copy bill text to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>Copy</span>
            </button>
          </div>
          {phoneError && (
            <p className="text-[11px] text-rose-600 font-semibold">{phoneError}</p>
          )}
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 overflow-y-auto flex justify-center bg-slate-100 flex-1">
          {/* Exact Printable Area */}
          <div
            id="thermal-receipt-printable"
            ref={receiptRef}
            className="w-[80mm] bg-white p-4 shadow-md text-black font-mono text-[11px] leading-snug border border-slate-300"
          >
            {/* Business Header with Official Logo */}
            <div className="text-center pb-2 border-b border-dashed border-black flex flex-col items-center">
              <img
                src="/vijaya-nursery-logo.jpg"
                alt="Vijaya Plant Nursery"
                className="w-14 h-14 object-contain rounded-full mb-1"
              />
              <h1 className="text-xs font-black uppercase tracking-tight">VIJAYA PLANT NURSERY</h1>
              <p className="text-[9px] font-bold text-slate-700 tracking-wider">ESTD. 1982</p>
              <p className="text-[10px]">Main Road, Vissannapeta, AP - 521215</p>
              <p className="text-[10px]">Phone: +91 98480 22334</p>
              <p className="text-[10px] font-bold">GSTIN: 37ABCDE1234F1Z5</p>
            </div>

            {/* Bill Info */}
            <div className="py-2 border-b border-dashed border-black text-[10px] space-y-0.5">
              <div className="text-center font-bold uppercase underline mb-1">
                {bill.billType === 'tax_invoice' ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
              </div>
              <div className="flex justify-between">
                <span>Invoice:</span>
                <span className="font-bold">{bill.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span>{new Date(bill.billDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{bill.agentName}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-semibold">{bill.customerName || 'Walk-in Customer'}</span>
              </div>
              {bill.customerPhone && (
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span>{bill.customerPhone}</span>
                </div>
              )}
              {bill.customerGstin && (
                <div className="flex justify-between">
                  <span>GSTIN:</span>
                  <span className="font-bold">{bill.customerGstin}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-black">
              <div className="grid grid-cols-12 font-bold border-b border-black pb-1 mb-1 text-[10px]">
                <div className="col-span-6">Item</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              {bill.items.map((it, idx) => (
                <div key={idx} className="mb-1 text-[10px]">
                  <div className="font-semibold truncate">{it.productName}</div>
                  <div className="grid grid-cols-12 text-slate-700">
                    <div className="col-span-6 text-[9px]">
                      HSN: {it.hsn} {it.gstRate > 0 ? `(${it.gstRate}%)` : '(Nil)'}
                    </div>
                    <div className="col-span-2 text-right">{it.quantity}</div>
                    <div className="col-span-2 text-right">{it.rate.toFixed(2)}</div>
                    <div className="col-span-2 text-right font-medium">{it.lineTotal.toFixed(2)}</div>
                  </div>
                  {it.discountAmount > 0 && (
                    <div className="text-[9px] text-right text-slate-500">
                      Item Disc: -₹{it.discountAmount.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Calculations & Summary */}
            <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span>₹{bill.subtotal.toFixed(2)}</span>
              </div>
              {bill.billDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Bill Discount:</span>
                  <span>-₹{bill.billDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Taxable Amount:</span>
                <span>₹{bill.taxableAmount.toFixed(2)}</span>
              </div>
              {bill.totalTax > 0 && (
                <>
                  {!bill.isInterState ? (
                    <>
                      <div className="flex justify-between">
                        <span>CGST:</span>
                        <span>₹{bill.totalCgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST:</span>
                        <span>₹{bill.totalSgst.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span>IGST:</span>
                      <span>₹{bill.totalIgst.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              {bill.roundOff !== 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Round-off:</span>
                  <span>₹{bill.roundOff.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-black pt-1 border-t border-black">
                <span>GRAND TOTAL:</span>
                <span>₹{bill.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Amount In Words */}
            <div className="py-1.5 text-[9px] border-b border-dashed border-black italic">
              Words: {bill.amountInWords}
            </div>

            {/* Payments */}
            <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
              <div className="font-bold mb-0.5">Payment Details:</div>
              {bill.payments.map((p, i) => (
                <div key={i} className="flex justify-between">
                  <span className="uppercase">{p.method}:</span>
                  <span className="font-semibold">₹{p.amount.toFixed(2)}</span>
                </div>
              ))}
              {bill.balanceDue > 0 && (
                <div className="flex justify-between font-bold text-rose-600 pt-0.5 border-t border-slate-200">
                  <span>Balance Due:</span>
                  <span>₹{bill.balanceDue.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Footer & Terms */}
            <div className="pt-2 text-center text-[9px] space-y-1">
              <p className="font-semibold">Thank you for visiting Vijaya Nursery!</p>
              <p className="text-[8px] text-slate-500">Live plants once purchased cannot be returned.</p>
              <p className="font-mono text-[8px] tracking-widest text-slate-400 pt-1">
                *** DIGITAL INVOICE COPY ***
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap justify-between items-center gap-2">
          <div className="text-xs text-slate-500 hidden sm:block">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-300 font-mono">Esc</kbd> to return to POS
          </div>
          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (80mm)</span>
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span>Send via WhatsApp</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Start New Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
