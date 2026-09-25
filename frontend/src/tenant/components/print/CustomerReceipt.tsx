import React from 'react';

interface OrderItem {
  itemId: string;
  name: string;
  category: 'apparel' | 'carpet' | 'linen';
  serviceOption?: 'fullService' | 'ironOnly';
  dimensions?: { length: number; width: number; area: number };
  originalPrice: number;
  finalPrice: number;
  overrideReason?: string;
}

interface OrderData {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryDate: string;
  createdAt?: string;
  items: OrderItem[];
}

interface CustomerReceiptProps {
  order: OrderData;
  shopName?: string;
  isPrintOnly?: boolean;
}

export const CustomerReceipt: React.FC<CustomerReceiptProps> = ({
  order,
  shopName = 'مغاسل رونق',
  isPrintOnly = false,
}) => {
  const totalAmount = order.items.reduce((sum, item) => sum + (Number(item.finalPrice) || 0), 0);
  const formattedDeliveryDate = new Date(order.deliveryDate).toLocaleDateString('ar-EG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedCreatedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString('ar-EG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('ar-EG');

  return (
    <div
      className={`text-slate-900 bg-white text-right font-sans ${
        isPrintOnly ? 'print-only-receipt' : 'p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto'
      }`}
      style={{ direction: 'rtl' }}
    >
      {/* Receipt Header */}
      <div className="text-center border-b border-slate-300 pb-4 mb-4">
        <h2 className="text-2xl font-black tracking-wider">{shopName}</h2>
        <p className="text-sm text-slate-500 font-bold mt-1">فاتورة العميل (إيصال استلام)</p>
        <div className="mt-2 inline-block bg-slate-100 px-3.5 py-1 rounded-xl font-mono text-lg font-black border border-slate-200">
          فاتورة رقم #{order.orderNumber}
        </div>
      </div>

      {/* Customer & Order Metadata */}
      <div className="grid grid-cols-2 gap-4 text-sm border-b border-slate-300 pb-4 mb-4 font-medium">
        <div>
          <p className="text-slate-500 font-bold text-xs">بيانات العميل:</p>
          <p className="font-bold text-slate-900 text-base mt-0.5">{order.customerName}</p>
          <p className="font-mono font-bold text-slate-700 mt-0.5" style={{ direction: 'ltr', textAlign: 'right' }}>{order.customerPhone}</p>
        </div>
        <div className="text-left">
          <p className="text-slate-500 font-bold text-xs">التواريخ والمواعيد:</p>
          <p className="text-slate-700 mt-0.5">
            <span className="text-slate-500">الاستلام: </span>
            <span className="font-bold">{formattedCreatedDate}</span>
          </p>
          <p className="font-bold text-blue-600 mt-0.5">
            <span className="text-slate-500 font-normal">جاهز في: </span>
            <span>{formattedDeliveryDate}</span>
          </p>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="mb-6">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b-2 border-slate-800 text-slate-600 uppercase text-xs font-bold">
              <th className="py-2.5">الصنف</th>
              <th className="py-2.5">التفاصيل والخدمة</th>
              <th className="py-2.5 text-center">العدد</th>
              <th className="py-2.5 text-left">السعر (ج.م)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium">
            {(() => {
              interface GroupedItem {
                name: string;
                category: string;
                serviceOption?: string;
                dimensions?: { length: number; width: number; area: number };
                originalPrice: number;
                finalPrice: number;
                overrideReason?: string;
                count: number;
                itemIds: string[];
              }

              const groups = order.items.reduce<GroupedItem[]>((acc, item) => {
                const existing = acc.find(g => 
                  g.name === item.name &&
                  g.category === item.category &&
                  g.serviceOption === item.serviceOption &&
                  g.finalPrice === item.finalPrice &&
                  g.overrideReason === item.overrideReason &&
                  g.dimensions?.area === item.dimensions?.area
                );
                if (existing) {
                  existing.count += 1;
                  if (item.itemId) existing.itemIds.push(item.itemId);
                } else {
                  acc.push({
                    name: item.name,
                    category: item.category,
                    serviceOption: item.serviceOption,
                    dimensions: item.dimensions,
                    originalPrice: item.originalPrice,
                    finalPrice: item.finalPrice,
                    overrideReason: item.overrideReason,
                    count: 1,
                    itemIds: item.itemId ? [item.itemId] : [],
                  });
                }
                return acc;
              }, []);

              return groups.map((group, idx) => {
                let detailsText = '';
                if (group.category === 'apparel') {
                  detailsText = group.serviceOption === 'fullService' ? 'غسيل وكوي شامل' : 'كوي بالبخار فقط';
                } else if (group.category === 'carpet' && group.dimensions) {
                  detailsText = `${group.dimensions.length}م × ${group.dimensions.width}m (${group.dimensions.area}م²)`;
                } else {
                  detailsText = 'خدمة قياسية';
                }

                const isOverridden = group.finalPrice !== group.originalPrice;
                const lineTotal = group.finalPrice * group.count;
                const origLineTotal = group.originalPrice * group.count;

                return (
                  <tr key={idx} className="py-3">
                    <td className="py-2.5 font-bold text-slate-900">
                      <div>{group.name}</div>
                      {group.itemIds.length > 0 && (
                        <div className="text-[10px] font-mono font-normal text-slate-500 mt-0.5 leading-tight">
                          أرقام القطع: #{group.itemIds.join(', #')}
                        </div>
                      )}
                      {isOverridden && group.overrideReason && (
                        <div className="text-xs text-amber-700 font-bold mt-1 bg-amber-50 inline-block px-2 py-0.5 rounded border border-amber-200">
                          تعديل سعر: {group.overrideReason}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-600 font-semibold">{detailsText}</td>
                    <td className="py-2.5 text-center font-mono font-black text-base">{group.count}</td>
                    <td className="py-2.5 text-left font-mono font-black">
                      {isOverridden ? (
                        <div>
                          <span className="line-through text-slate-400 text-xs ml-1.5 font-normal">
                            {origLineTotal.toFixed(2)}
                          </span>
                          <span className="text-slate-900">{lineTotal.toFixed(2)}</span>
                          {group.count > 1 && (
                            <div className="text-[10px] text-slate-500 font-bold">({group.finalPrice.toFixed(2)} للقطعة)</div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span>{lineTotal.toFixed(2)}</span>
                          {group.count > 1 && (
                            <div className="text-[10px] text-slate-500 font-bold">({group.finalPrice.toFixed(2)} للقطعة)</div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>

      {/* Summary / Total */}
      <div className="border-t-2 border-slate-800 pt-4 flex justify-between items-center">
        <span className="text-lg font-black text-slate-800">الإجمالي المطلوب</span>
        <span className="text-2xl font-mono font-black text-slate-900">
          {totalAmount.toFixed(2)} <span className="text-base font-bold text-slate-600">ج.م</span>
        </span>
      </div>

      {/* Receipt Footer */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
        <p className="font-bold text-slate-700">شكراً لاختياركم {shopName}!</p>
        <p className="mt-1">يرجى إبراز هذا الإيصال عند استلام الملابس والمفروشات.</p>
        <p className="font-mono mt-1 text-[10px] text-slate-400">رقم الفاتورة بالنظام: {order._id}</p>
      </div>
    </div>
  );
};
