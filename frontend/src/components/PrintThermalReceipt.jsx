import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { Printer, RotateCcw, X, FileText, Check, Globe } from 'lucide-react';

export default function PrintThermalReceipt({ order, onClose, settings = {} }) {
  const { lang: currentLang, t } = useLanguage();

  if (!order) return null;

  // Paper width state: '80mm' or '58mm'
  const [paperWidth, setPaperWidth] = useState('80mm');

  // Receipt language state: 'en' or 'ur' (defaults to current app language)
  const [receiptLang, setReceiptLang] = useState(currentLang || 'en');

  // Print counter for reprint tracking
  const [printCount, setPrintCount] = useState(0);

  const handlePrint = () => {
    setPrintCount((prev) => prev + 1);
    window.print();
  };

  const isUrdu = receiptLang === 'ur';

  // Business info based on language
  const businessName = isUrdu
    ? (settings.business_name_ur || 'کاشف سینیٹری سپلائیز')
    : (settings.business_name_en || 'Kashif Sanitary Supplies');

  const tagline = isUrdu
    ? (settings.tagline_ur || 'اعلیٰ معیار کی مصنوعات، قابل اعتماد سپلائی')
    : (settings.tagline_en || 'Quality Products. Reliable Supply.');

  const phone = settings.phone || '+92 300 1234567';
  const whatsapp = settings.whatsapp || '+92 300 1234567';
  const address = isUrdu
    ? (settings.address_ur || 'سینیٹری مارکیٹ، مین بلیوارڈ، لاہور')
    : (settings.address_en || 'Sanitary Wholesale Market, Main Boulevard, Lahore');

  // Formatted date and time
  const orderDate = new Date(order.created_at || Date.now());
  const formattedDateTime = orderDate.toLocaleString(isUrdu ? 'ur-PK' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getStatusLabel = (status) => {
    if (!isUrdu) return status;
    switch (status) {
      case 'New':
        return 'نیا آرڈر (New)';
      case 'Confirmed':
        return 'تصدیق شدہ (Confirmed)';
      case 'Contacted':
        return 'رابطہ ہو گیا (Contacted)';
      case 'Preparing':
        return 'تیار ہو رہا ہے (Preparing)';
      case 'Completed':
        return 'مکمل (Completed)';
      case 'Cancelled':
        return 'منسوخ (Cancelled)';
      default:
        return status;
    }
  };

  const is58mm = paperWidth === '58mm';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-100 rounded-2xl max-w-2xl w-full shadow-2xl relative my-6 flex flex-col border border-slate-300">
        
        {/* Top Control Toolbar (Hidden when printing) */}
        <div className="no-print p-4 sm:p-5 bg-white rounded-t-2xl border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-slate-900 text-white">
                <FileText className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {t('printThermalReceipt')}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {order.order_number} {printCount > 0 && `• Printed ${printCount}x`}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Configuration Controls: Width + Language */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {/* Paper Width Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                {t('paperWidth')}:
              </span>
              <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaperWidth('58mm')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    paperWidth === '58mm'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  58 mm
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth('80mm')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    paperWidth === '80mm'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  80 mm
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                {t('receiptLanguage')}:
              </span>
              <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setReceiptLang('en')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    receiptLang === 'en'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptLang('ur')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all font-urdu ${
                    receiptLang === 'ur'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  اردو
                </button>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="flex items-center gap-2">
              {printCount > 0 && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors"
                  title="Print this receipt again"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('reprint')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-md transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{printCount > 0 ? t('reprint') : t('printThermalReceipt')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Receipt Preview Area (Centered scrollable wrapper) */}
        <div className="p-4 sm:p-8 flex justify-center overflow-y-auto max-h-[72vh] bg-slate-200/70">
          
          {/* Authentic POS Paper Receipt Container */}
          <div
            dir={isUrdu ? 'rtl' : 'ltr'}
            className={`thermal-printable-area thermal-receipt-container bg-white shadow-xl p-4 text-black border border-slate-300 ${
              isUrdu ? 'urdu-receipt' : ''
            } ${
              is58mm
                ? 'thermal-printable-58mm w-[58mm] max-w-[270px] text-[10px] leading-tight'
                : 'thermal-printable-80mm w-[80mm] max-w-[350px] text-[11px] leading-snug'
            }`}
            style={{
              color: '#000000',
              backgroundColor: '#ffffff',
              boxSizing: 'border-box',
            }}
          >
            {/* Header: Store Branding */}
            <div className="text-center pb-2">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight leading-tight uppercase font-mono">
                {businessName}
              </h1>
              <p className="text-[10px] text-black font-semibold mt-0.5">
                {tagline}
              </p>
              <p className="text-[9px] text-black mt-1 leading-tight">
                {address}
              </p>
              <p className="text-[9px] text-black font-mono">
                {isUrdu ? 'فون' : 'Tel'}: {phone} {whatsapp && `• WA: ${whatsapp}`}
              </p>
            </div>

            {/* Receipt Type Divider */}
            <div className="border-t border-b border-dashed border-black py-1 my-1.5 text-center font-bold font-mono tracking-widest text-[10px]">
              {isUrdu ? 'سیلز رسید / کیش میمو' : '=== SALES RECEIPT / CASH MEMO ==='}
            </div>

            {/* Order & Customer Metadata */}
            <div className="space-y-0.5 text-[10px] font-mono py-1">
              <div className="flex justify-between">
                <span className="font-semibold">{isUrdu ? 'آرڈر نمبر' : 'ORDER #'}:</span>
                <span className="font-bold">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span>{isUrdu ? 'تاریخ و وقت' : 'DATE & TIME'}:</span>
                <span>{formattedDateTime}</span>
              </div>
              <div className="flex justify-between">
                <span>{isUrdu ? 'اسٹیٹس' : 'STATUS'}:</span>
                <span className="font-bold uppercase">{getStatusLabel(order.status)}</span>
              </div>

              {/* Customer / Consignee */}
              <div className="border-t border-dashed border-black/60 pt-1 mt-1">
                <div className="flex justify-between">
                  <span className="font-semibold">{isUrdu ? 'گاہک' : 'CUSTOMER'}:</span>
                  <span className="font-bold">{order.customer_name}</span>
                </div>
                {order.shop_name && (
                  <div className="flex justify-between">
                    <span>{isUrdu ? 'دکان' : 'SHOP'}:</span>
                    <span className="font-semibold">{order.shop_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{isUrdu ? 'رابطہ فون' : 'PHONE'}:</span>
                  <span>{order.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isUrdu ? 'شہر' : 'CITY'}:</span>
                  <span>{order.city}</span>
                </div>
                <div className="text-[9px] pt-0.5 leading-tight">
                  <span className="font-semibold">{isUrdu ? 'پتہ' : 'ADDRESS'}: </span>
                  <span>{order.address}</span>
                </div>
              </div>
            </div>

            {/* Item List Header */}
            <div className="border-t-2 border-dashed border-black pt-1.5 mt-1.5 font-bold font-mono text-[10px]">
              {is58mm ? (
                // 58mm compact header
                <div className="flex justify-between pb-1 border-b border-black">
                  <span>{isUrdu ? 'تفصیل و تعداد' : 'ITEM / QTY'}</span>
                  <span>{isUrdu ? 'کل رقم' : 'TOTAL'}</span>
                </div>
              ) : (
                // 80mm full header
                <div className="flex justify-between pb-1 border-b border-black">
                  <span className="flex-1">{isUrdu ? 'پروڈکٹ و سائز' : 'ITEM & VARIANT'}</span>
                  <span className="w-12 text-center">{isUrdu ? 'تعداد' : 'QTY'}</span>
                  <span className="w-16 text-right rtl:text-left">{isUrdu ? 'ریٹ' : 'RATE'}</span>
                  <span className="w-16 text-right rtl:text-left">{isUrdu ? 'رقم' : 'TOTAL'}</span>
                </div>
              )}
            </div>

            {/* Line Items List */}
            <div className="divide-y divide-dashed divide-black/40 py-1">
              {(order.items || []).map((item, idx) => {
                const itemName = isUrdu
                  ? (item.product_name_ur || item.product_name_en)
                  : (item.product_name_en || item.product_name_ur);

                const rateDisplay = item.is_price_on_request || !item.unit_price
                  ? (isUrdu ? 'ریٹ فون پر' : 'Rate on Call')
                  : `${Number(item.unit_price).toLocaleString()}`;

                const lineTotalDisplay = item.is_price_on_request || !item.line_total
                  ? '-'
                  : `${Number(item.line_total).toLocaleString()}`;

                return (
                  <div key={idx} className="py-1 break-words">
                    {is58mm ? (
                      // 58mm POS two-line format (standard for narrow heads to prevent clipping)
                      <div>
                        <div className="font-bold text-[10px] leading-tight">
                          {idx + 1}. {itemName}
                        </div>
                        {(item.variant || item.color) && (
                          <div className="text-[9px] font-mono text-black">
                            [{[item.variant, item.color].filter(Boolean).join(' • ')}]
                          </div>
                        )}
                        <div className="flex justify-between text-[9px] font-mono mt-0.5">
                          <span>
                            {item.quantity} {item.unit || (isUrdu ? 'پیس' : 'Pcs')} x {rateDisplay}
                          </span>
                          <span className="font-bold">
                            {lineTotalDisplay}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // 80mm POS format with structured spacing
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 pr-1 rtl:pr-0 rtl:pl-1">
                            <div className="font-bold text-[10.5px] leading-tight">
                              {idx + 1}. {itemName}
                            </div>
                            {(item.variant || item.color) && (
                              <div className="text-[9.5px] font-mono text-black">
                                {[item.variant ? (isUrdu ? `سائز: ${item.variant}` : `Size: ${item.variant}`) : null, item.color ? (isUrdu ? `رنگ: ${item.color}` : `Color: ${item.color}`) : null].filter(Boolean).join(' | ')}
                              </div>
                            )}
                          </div>
                          <div className="w-12 text-center font-mono font-bold text-[10px]">
                            {item.quantity} {item.unit || 'pcs'}
                          </div>
                          <div className="w-16 text-right rtl:text-left font-mono text-[10px]">
                            {rateDisplay}
                          </div>
                          <div className="w-16 text-right rtl:text-left font-mono font-bold text-[10px]">
                            {lineTotalDisplay}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Totals Section */}
            <div className="border-t-2 border-dashed border-black pt-1.5 mt-1 space-y-0.5 font-mono text-[10.5px]">
              <div className="flex justify-between">
                <span>{isUrdu ? 'کل آئٹمز و تعداد' : 'TOTAL ITEMS / QTY'}:</span>
                <span className="font-bold">{order.total_items} {isUrdu ? 'پیس' : 'Pcs'}</span>
              </div>

              <div className="flex justify-between text-xs font-black border-t border-black pt-1 mt-1">
                <span>{isUrdu ? 'کل رقم (روپے)' : 'GRAND TOTAL (PKR)'}:</span>
                <span>
                  {order.estimated_total > 0
                    ? `PKR ${Number(order.estimated_total).toLocaleString()}`
                    : (isUrdu ? 'ریٹ فون پر طے ہوگا' : 'Rate on Call')}
                </span>
              </div>
            </div>

            {/* Order Notes / Cargo Instructions */}
            {order.notes && (
              <div className="border-t border-dashed border-black pt-1.5 mt-1.5 text-[9.5px]">
                <div className="font-bold font-mono">
                  {isUrdu ? 'خصوصی ہدایات / کارگو' : 'INSTRUCTIONS / CARGO'}:
                </div>
                <div className="leading-tight mt-0.5">
                  {order.notes}
                </div>
              </div>
            )}

            {/* Thank You & Receipt Footer */}
            <div className="border-t-2 border-dashed border-black pt-2 mt-2 text-center space-y-1">
              <p className="font-extrabold text-[10px] font-mono">
                {isUrdu ? 'ہمارے ساتھ کاروبار کرنے کا شکریہ!' : '*** THANK YOU FOR YOUR BUSINESS! ***'}
              </p>
              <p className="text-[8.5px] leading-tight">
                {isUrdu
                  ? 'بیچا ہوا سامان کمپنی پالیسی کے تحت تبدیل ہو سکتا ہے۔ براہ کرم رسید سنبھال کر رکھیں۔'
                  : 'Goods once sold can be exchanged as per policy. Please retain this receipt.'}
              </p>
              <p className="text-[8px] font-mono pt-1 text-black/80">
                Printed: {new Date().toLocaleTimeString()} • Kashif Sanitary POS
              </p>
            </div>

          </div>
        </div>

        {/* Bottom Helper Bar (Hidden when printing) */}
        <div className="no-print p-3 sm:p-4 bg-white rounded-b-2xl border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px]">
            Tip: In browser print dialog, choose your thermal printer and set Margins to <b>"None"</b>.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
          >
            Close Preview
          </button>
        </div>

      </div>
    </div>
  );
}
