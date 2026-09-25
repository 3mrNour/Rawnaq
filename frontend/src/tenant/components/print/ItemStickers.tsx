import React from 'react';

interface OrderItem {
  itemId: string;
  name: string;
  category: 'apparel' | 'carpet' | 'linen';
  serviceOption?: 'fullService' | 'ironOnly';
  dimensions?: { length: number; width: number; area: number };
}

interface OrderData {
  orderNumber: string;
  customerName: string;
  deliveryDate: string;
  items: OrderItem[];
}

interface ItemStickersProps {
  order: OrderData;
  shopName?: string;
  isPrintOnly?: boolean;
}

export const ItemStickers: React.FC<ItemStickersProps> = ({
  order,
  shopName = 'مغاسل رونق',
  isPrintOnly = false,
}) => {
  const formattedDeliveryDate = new Date(order.deliveryDate).toLocaleDateString('ar-EG', {
    day: '2-digit',
    month: 'short',
  });

  return (
    <div
      className={`text-slate-900 bg-white text-right font-sans ${
        isPrintOnly ? 'print-only-stickers' : 'p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto'
      }`}
      style={{ direction: 'rtl' }}
    >
      {!isPrintOnly && (
        <div className="mb-4 pb-3 border-b border-slate-200 text-center">
          <h3 className="text-lg font-black text-slate-900">شريط ملصقات الأصناف ({order.items.length} قطعة)</h3>
          <p className="text-xs text-slate-500 font-bold mt-1">كل مربع يمثل ملصق باركود يتم طباعته وإرفاقه بالقطعة عند الاستلام في المغسلة.</p>
        </div>
      )}

      <div className="space-y-4">
        {order.items.map((item, idx) => {
          let detailsText = '';
          if (item.category === 'apparel') {
            detailsText = item.serviceOption === 'fullService' ? 'غسيل وكوي شامل' : 'كوي بالبخار فقط';
          } else if (item.category === 'carpet' && item.dimensions) {
            detailsText = `${item.dimensions.length}م × ${item.dimensions.width}m (${item.dimensions.area}م²)`;
          } else {
            detailsText = 'خدمة قياسية';
          }

          return (
            <div
              key={item.itemId || idx}
              className="sticker-block border-2 border-slate-800 p-4 rounded-xl bg-white relative overflow-hidden shadow-sm"
            >
              {/* Header: Shop & Order Ref */}
              <div className="flex justify-between items-center border-b border-slate-300 pb-2 mb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-600">{shopName}</span>
                <span className="font-mono text-sm font-black bg-slate-900 text-white px-2.5 py-0.5 rounded-lg">
                  فاتورة #{order.orderNumber}
                </span>
              </div>

              {/* Main Sticker Content: Sticker ID & Item Name */}
              <div className="flex justify-between items-start my-2">
                <div>
                  <h4 className="text-lg font-black text-slate-900 leading-tight">{item.name}</h4>
                  <p className="text-xs text-slate-600 font-bold mt-0.5">{detailsText}</p>
                </div>
                <div className="text-left mr-4 shrink-0">
                  <div className="text-[10px] text-slate-500 font-bold">رقم القطعة</div>
                  <div className="font-mono text-xl font-black text-blue-700" style={{ direction: 'ltr' }}>{item.itemId}</div>
                </div>
              </div>

              {/* Footer: Customer & Delivery Target */}
              <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center text-xs text-slate-600 font-medium">
                <span className="font-bold truncate max-w-[60%]">{order.customerName}</span>
                <span className="font-bold text-slate-800">التسليم: {formattedDeliveryDate}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
