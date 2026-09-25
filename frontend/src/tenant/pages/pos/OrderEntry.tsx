import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../../shared/api/client';
import { CustomerReceipt } from '../../components/print/CustomerReceipt';
import { ItemStickers } from '../../components/print/ItemStickers';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Search,
  Tag,
  AlertCircle,
  CheckCircle,
  Printer,
  RefreshCw,
  User,
  Phone,
  Calendar,
  Ruler,
  Sliders,
  X,
} from 'lucide-react';

type Category = 'apparel' | 'carpet' | 'linen';

interface CatalogueItem {
  _id: string;
  category: Category;
  name: string;
  pricing?: { fullService: number; ironOnly: number };
  pricePerMeter?: number;
  basePrice?: number;
}

interface CartItem {
  cartId: string;
  priceListRef: string;
  name: string;
  category: Category;
  serviceOption?: 'fullService' | 'ironOnly';
  dimensions?: { length: number; width: number; area: number };
  quantity: number;
  originalPrice: number;
  finalPrice: number;
  isOverridden: boolean;
  overrideReason: string;
  overrideError?: string;
}

export const OrderEntry: React.FC = () => {
  // Catalogue state
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>([]);
  const [loadingCatalogue, setLoadingCatalogue] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | Category>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & Order state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  // Modal / prompt states for adding items
  const [modalItem, setModalItem] = useState<CatalogueItem | null>(null);
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [apparelService, setApparelService] = useState<'fullService' | 'ironOnly'>('fullService');
  const [carpetLength, setCarpetLength] = useState<number | string>(2);
  const [carpetWidth, setCarpetWidth] = useState<number | string>(3);

  // Submission & Confirmation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'receipt' | 'stickers'>('receipt');

  useEffect(() => {
    const fetchCatalogue = async () => {
      try {
        setLoadingCatalogue(true);
        const res = await apiClient.get('/api/tenant/price-list');
        setCatalogue(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load catalogue:', err);
      } finally {
        setLoadingCatalogue(false);
      }
    };
    fetchCatalogue();
  }, []);

  // Filter catalogue by category and search term
  const filteredCatalogue = catalogue.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle clicking an item from catalogue
  const handleSelectCatalogueItem = (item: CatalogueItem) => {
    setModalItem(item);
    setModalQuantity(1);
    if (item.category === 'apparel') {
      setApparelService('fullService');
    } else if (item.category === 'carpet') {
      setCarpetLength(2);
      setCarpetWidth(3);
    }
  };

  // Add configured item from modal to cart
  const handleConfirmModalItem = () => {
    if (!modalItem) return;
    const qty = Math.max(1, Number(modalQuantity) || 1);

    if (modalItem.category === 'apparel') {
      const price = Number(modalItem.pricing?.[apparelService]) || 0;
      addItemToCart({
        priceListRef: modalItem._id,
        name: modalItem.name,
        category: 'apparel',
        serviceOption: apparelService,
        quantity: qty,
        originalPrice: price,
        finalPrice: price,
      });
    } else if (modalItem.category === 'carpet') {
      const len = Number(carpetLength) || 0;
      const wid = Number(carpetWidth) || 0;
      if (len <= 0 || wid <= 0) {
        alert('يرجى إدخال أبعاد صحيحة وموجبة للطول والعرض.');
        return;
      }
      const area = Number((len * wid).toFixed(2));
      const pricePerMeter = Number(modalItem.pricePerMeter) || 0;
      const computedPrice = Number((area * pricePerMeter).toFixed(2));

      addItemToCart({
        priceListRef: modalItem._id,
        name: modalItem.name,
        category: 'carpet',
        dimensions: { length: len, width: wid, area },
        quantity: qty,
        originalPrice: computedPrice,
        finalPrice: computedPrice,
      });
    } else if (modalItem.category === 'linen') {
      const price = Number(modalItem.basePrice) || 0;
      addItemToCart({
        priceListRef: modalItem._id,
        name: modalItem.name,
        category: 'linen',
        quantity: qty,
        originalPrice: price,
        finalPrice: price,
      });
    }

    setModalItem(null);
  };

  const addItemToCart = (itemData: Omit<CartItem, 'cartId' | 'isOverridden' | 'overrideReason'>) => {
    const newItem: CartItem = {
      ...itemData,
      quantity: itemData.quantity || 1,
      cartId: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      isOverridden: false,
      overrideReason: '',
    };
    setCart((prev) => [...prev, newItem]);
  };

  const removeItemFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  // Handle override changes
  const toggleOverride = (cartId: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId === cartId) {
          const nextOverridden = !item.isOverridden;
          return {
            ...item,
            isOverridden: nextOverridden,
            finalPrice: nextOverridden ? item.finalPrice : item.originalPrice,
            overrideReason: nextOverridden ? item.overrideReason : '',
            overrideError: undefined,
          };
        }
        return item;
      })
    );
  };

  const updateCartItemField = (cartId: string, field: keyof CartItem, value: any) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId === cartId) {
          const updated = { ...item, [field]: value };
          // If editing finalPrice or overrideReason, clear validation error if valid
          if (field === 'overrideReason' && value && value.trim() !== '') {
            updated.overrideError = undefined;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Computed cart total
  const runningTotal = cart.reduce((sum, item) => sum + ((Number(item.finalPrice) || 0) * (Number(item.quantity) || 1)), 0);

  // Validate cart before submit
  const validateCartBeforeSubmit = (): boolean => {
    let isValid = true;
    const updatedCart = cart.map((item) => {
      if (item.isOverridden || item.finalPrice !== item.originalPrice) {
        if (!item.overrideReason || item.overrideReason.trim() === '') {
          isValid = false;
          return { ...item, overrideError: 'سبب تعديل السعر مطلوب عند تغيير السعر الافتراضي.' };
        }
      }
      return { ...item, overrideError: undefined };
    });

    setCart(updatedCart);
    return isValid;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCapacityError(null);
    setGeneralError(null);

    if (cart.length === 0) {
      setGeneralError('يرجى إضافة صنف واحد على الأقل لسلة الغسيل.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !deliveryDate) {
      setGeneralError('يرجى إكمال بيانات اسم العميل ورقم الهاتف وتاريخ التسليم.');
      return;
    }

    if (!validateCartBeforeSubmit()) {
      setGeneralError('يرجى توضيح أسباب تعديل الأسعار قبل اعتماد الطلب.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryDate: new Date(deliveryDate).toISOString(),
        items: cart.flatMap((item) => {
          const qty = Math.max(1, Number(item.quantity) || 1);
          return Array.from({ length: qty }, () => ({
            priceListRef: item.priceListRef,
            name: item.name,
            category: item.category,
            serviceOption: item.serviceOption,
            dimensions: item.dimensions,
            originalPrice: item.originalPrice,
            finalPrice: Number(item.finalPrice),
            overrideReason: item.overrideReason && item.overrideReason.trim() !== '' ? item.overrideReason.trim() : undefined,
          }));
        }),
      };

      const res = await apiClient.post('/api/tenant/orders', payload);
      if (res.data?.data || res.data?.status === 'success') {
        const orderData = res.data.data || res.data;
        setCreatedOrder(orderData);
      }
    } catch (err: any) {
      console.error('Order submission error:', err);
      const responseData = err.response?.data || (err as any)?.data;
      if (responseData?.code === 'CAPACITY_EXCEEDED' || err.message?.includes('CAPACITY_EXCEEDED')) {
        const overDate = responseData?.date ? new Date(responseData.date).toLocaleDateString() : deliveryDate;
        setCapacityError(`تجاوز السعة اليومية القصوى للمغسلة بتاريخ ${overDate}. يرجى اختيار تاريخ تسليم آخر وإعادة الإرسال.`);
      } else {
        setGeneralError(responseData?.message || err.message || 'حدث خطأ أثناء إرسال وحفظ الطلب، يرجى المحاولة لاحقاً.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    document.body.classList.add('print-mode-receipt');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-mode-receipt');
    }, 500);
  };

  const handlePrintStickers = () => {
    document.body.classList.add('print-mode-stickers');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('print-mode-stickers');
    }, 500);
  };

  const handleCreateNewOrder = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCapacityError(null);
    setGeneralError(null);
    setCreatedOrder(null);
  };

  // ---------------------------------------------------------
  // RENDER: CONFIRMATION & PRINT SCREEN (Phase 2 / Task 2.2)
  // ---------------------------------------------------------
  if (createdOrder) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 text-right">
        {/* Hidden Print-Only DOM Elements */}
        <CustomerReceipt order={createdOrder} isPrintOnly={true} />
        <ItemStickers order={createdOrder} isPrintOnly={true} />

        {/* Screen Confirmation Banner */}
        <div className="bg-emerald-900 border border-emerald-700 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 no-print">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-800 rounded-full flex items-center justify-center shrink-0 border border-emerald-600">
              <CheckCircle className="text-emerald-400 w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">تم إنشاء الطلب رقم #{createdOrder.orderNumber} بنجاح!</h2>
              <p className="text-emerald-200 text-sm mt-0.5">
                العميل: <span className="font-bold text-white">{createdOrder.customerName}</span> ({createdOrder.customerPhone}) | عدد القطع: <span className="font-bold text-white">{createdOrder.items?.length || 0}</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateNewOrder}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow transition-colors border border-slate-700"
          >
            <RefreshCw size={18} />
            إدخال طلب غسيل آخر
          </button>
        </div>

        {/* Independent Print Trigger Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Printer size={22} />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white">1. إيصال العميل (فاتورة الطلب)</h3>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                إيصال مفصل يوضح الأصناف والأسعار والتخفيضات وموعد التسليم المستهدف للعميل.
              </p>
            </div>
            <button
              onClick={handlePrintReceipt}
              className="mt-6 w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Printer size={20} />
              طباعة الفاتورة الآن
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Tag size={22} />
                </div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white">2. ملصقات قطع الملابس (Sticker Strip)</h3>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                ملصقات باركود تعريفية لكل قطعة على حدة برقم فريد (مثال: 0001-01) وموعد التسليم لتلصيقها على الملابس.
              </p>
            </div>
            <button
              onClick={handlePrintStickers}
              className="mt-6 w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Tag size={20} />
              طباعة ملصقات القطع الآن
            </button>
          </div>
        </div>

        {/* Interactive On-Screen Previews */}
        <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 no-print">
          <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-800 pb-4 mb-6">
            <h3 className="font-bold text-slate-700 dark:text-slate-300 text-base">معاينة تفاعلية لنماذج الطباعة</h3>
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActivePreviewTab('receipt')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activePreviewTab === 'receipt' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                معاينة الفاتورة
              </button>
              <button
                onClick={() => setActivePreviewTab('stickers')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activePreviewTab === 'stickers' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                معاينة الملصقات
              </button>
            </div>
          </div>

          <div className="py-2">
            {activePreviewTab === 'receipt' ? (
              <CustomerReceipt order={createdOrder} isPrintOnly={false} />
            ) : (
              <ItemStickers order={createdOrder} isPrintOnly={false} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // RENDER: ORDER ENTRY FORM (Phase 1 / Tasks 1.1, 1.2, 1.3)
  // ---------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 text-right">
      {/* LEFT COLUMN: Catalogue Item Picker */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">نقطة البيع (إدخال طلب جديد)</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">اختر الأصناف والخدمات من الكتالوج لإضافة طلب الغسيل.</p>
              </div>
              <Link 
                to="/orders"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-800 transition-all self-start"
              >
                متابعة لوحة الطلبات والحالات &larr;
              </Link>
            </div>

            {/* Category Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
              {(['all', 'apparel', 'carpet', 'linen'] as const).map((cat) => {
                const labels: Record<string, string> = { all: 'الكل', apparel: 'ملابس', carpet: 'سجاد', linen: 'مفروشات' };
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                      activeCategory === cat ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {labels[cat]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث عن صنف باسم القطعة..."
              className="w-full pr-10 pl-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-right font-medium placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Catalogue Grid */}
          {loadingCatalogue ? (
            <div className="py-12 text-center text-slate-400 font-bold">جاري تحميل كتالوج الأسعار والخدمات...</div>
          ) : filteredCatalogue.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 font-medium">
              لا توجد أصناف مطابقة للبحث أو التصنيف الحالي.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto pl-1">
              {filteredCatalogue.map((item) => {
                let priceDisplay = '';
                if (item.category === 'apparel') {
                  priceDisplay = `${item.pricing?.fullService || 0} / ${item.pricing?.ironOnly || 0} ج.م`;
                } else if (item.category === 'carpet') {
                  priceDisplay = `${item.pricePerMeter || 0} ج.م / م²`;
                } else {
                  priceDisplay = `${item.basePrice || 0} ج.م`;
                }

                const catNames: Record<string, string> = { apparel: 'ملابس', carpet: 'سجاد', linen: 'مفروشات' };

                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => handleSelectCatalogueItem(item)}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500 hover:shadow-md transition-all text-right group"
                  >
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider mb-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/40 group-hover:text-blue-600 dark:group-hover:text-blue-300">
                        {catNames[item.category] || item.category}
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{item.name}</h3>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-0.5">{priceDisplay}</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0 border border-slate-200 dark:border-slate-700">
                      <Plus size={18} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Order Cart, Overrides & Customer Submission */}
      <div className="lg:col-span-5 space-y-6">
        <form onSubmit={handleSubmitOrder} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-blue-600 dark:text-blue-400" size={22} />
              <h2 className="text-xl font-black text-slate-900 dark:text-white">سلة الغسيل الحالية</h2>
            </div>
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-full border border-blue-200 dark:border-blue-800">
              {cart.length} عناصر
            </span>
          </div>

          {/* Capacity Exceeded Inline Alert */}
          {capacityError && (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border-2 border-red-500 rounded-2xl flex items-start gap-3 text-red-900 dark:text-red-200 animate-pulse">
              <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={20} />
              <div className="text-sm">
                <h4 className="font-bold">تنبيه: تجاوز السعة اليومية القصوى للمغسلة</h4>
                <p className="mt-1 font-medium text-xs">{capacityError}</p>
                <p className="mt-2 text-xs text-red-700 dark:text-red-300/80 font-semibold">
                  تم حفظ عناصر السلة وبيانات العميل. يرجى اختيار تاريخ تسليم مختلف (أقل ازدحاماً) بالأسفل ثم إعادة الإرسال.
                </p>
              </div>
            </div>
          )}

          {/* General Submission Error */}
          {generalError && !capacityError && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-400 rounded-2xl flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs font-bold">
              <AlertCircle className="text-amber-600 dark:text-amber-400 shrink-0" size={18} />
              <span>{generalError}</span>
            </div>
          )}

          {/* Cart Items List */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pl-1">
            {cart.length === 0 ? (
              <div className="py-10 text-center text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs font-medium">
                السلة فارغة. قم باختيار الأصناف من الكتالوج لإضافتها هنا.
              </div>
            ) : (
              cart.map((item) => {
                const catNames: Record<string, string> = { apparel: 'ملابس', carpet: 'سجاد', linen: 'مفروشات' };
                return (
                  <div
                    key={item.cartId}
                    className={`p-4 rounded-2xl border transition-all ${
                      item.overrideError ? 'border-red-400 bg-red-50/30 dark:bg-red-950/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {catNames[item.category] || item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                          {item.category === 'apparel' && (item.serviceOption === 'fullService' ? 'غسيل وكوي شامل' : 'كوي فقط')}
                          {item.category === 'carpet' && item.dimensions && `${item.dimensions.length}م × ${item.dimensions.width}m (${item.dimensions.area}م²)`}
                          {item.category === 'linen' && 'سعر ثابت'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Quantity controls inside cart */}
                        <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700 font-mono">
                          <button
                            type="button"
                            onClick={() => {
                              const nextQty = (Number(item.quantity) || 1) - 1;
                              if (nextQty <= 0) {
                                removeItemFromCart(item.cartId);
                              } else {
                                updateCartItemField(item.cartId, 'quantity', nextQty);
                              }
                            }}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-black text-sm flex items-center justify-center shadow-sm transition-all active:scale-95"
                            title="تقليل العدد"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-black text-sm text-slate-900 dark:text-white">
                            {item.quantity || 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              updateCartItemField(item.cartId, 'quantity', (Number(item.quantity) || 1) + 1);
                            }}
                            className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center shadow-sm transition-all active:scale-95"
                            title="زيادة العدد"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-left font-mono">
                          <span className="font-black text-slate-900 dark:text-white text-sm block">
                            {(Number(item.finalPrice) * (item.quantity || 1)).toFixed(2)} ج.م
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                            ({Number(item.finalPrice).toFixed(2)} للقطعة)
                          </span>
                          {item.isOverridden && (
                            <div className="text-[10px] line-through text-slate-400">
                              {(Number(item.originalPrice) * (item.quantity || 1)).toFixed(2)} ج.م
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItemFromCart(item.cartId)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                          title="حذف الصنف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Price Override Control Toggle */}
                    <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 font-bold select-none">
                        <input
                          type="checkbox"
                          checked={item.isOverridden}
                          onChange={() => toggleOverride(item.cartId)}
                          className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
                        />
                        <Sliders size={13} className="text-slate-400" />
                        تعديل السعر (Override)
                      </label>
                    </div>

                    {/* Price Override Inputs */}
                    {item.isOverridden && (
                      <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 animate-fadeIn">
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 col-span-1">السعر المعدل (ج.م):</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={item.finalPrice}
                            onChange={(e) => updateCartItemField(item.cartId, 'finalPrice', e.target.value)}
                            className="col-span-2 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 text-left font-bold text-emerald-600 dark:text-emerald-400"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 col-span-1">
                            سبب التعديل <span className="text-red-500">*</span>:
                          </label>
                          <input
                            type="text"
                            placeholder="مثال: خصم عميل مميز، إزالة بقع صعبة"
                            value={item.overrideReason}
                            onChange={(e) => updateCartItemField(item.cartId, 'overrideReason', e.target.value)}
                            className="col-span-2 px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                          />
                        </div>
                        {item.overrideError && (
                          <p className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                            <AlertCircle size={12} />
                            {item.overrideError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Running Order Total Live Update */}
          <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl flex items-center justify-between shadow-lg border border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-400 block">الإجمالي المطلوب</span>
              <span className="text-xs text-slate-300 font-medium">عدد {cart.length} عناصر في السلة</span>
            </div>
            <div className="text-left font-mono">
              <span className="text-2xl font-black text-emerald-400">{runningTotal.toFixed(2)}</span>
              <span className="text-xs font-bold text-slate-300 mr-1">ج.م</span>
            </div>
          </div>

          {/* Customer Details & Delivery Date */}
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
              <User size={16} className="text-slate-500" />
              بيانات العميل والتسليم
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">اسم العميل</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: أحمد منصور"
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-right"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">رقم الهاتف / الجوال</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="مثال: 01000000000"
                    className="w-full pr-9 pl-3 py-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-right"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">تاريخ التسليم المتوقع</label>
              <div className="relative">
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => {
                    setDeliveryDate(e.target.value);
                    if (capacityError) setCapacityError(null);
                  }}
                  className="w-full pr-9 pl-3 py-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-right"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting || cart.length === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
              isSubmitting || cart.length === 0
                ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500 shadow-none'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-[0.99]'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                <span>جاري إرسال وحفظ الطلب...</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>إرسال واعتماد الطلب ({runningTotal.toFixed(2)} ج.م)</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* MODAL: Configure Apparel Tier or Carpet Dimensions */}
      {modalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-right">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleUp">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {modalItem.category === 'apparel' ? 'ملابس' : modalItem.category === 'carpet' ? 'سجاد' : 'مفروشات'} - تحديد الخيارات
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{modalItem.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Apparel Options */}
            {modalItem.category === 'apparel' && (
              <div className="space-y-4 my-4">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">اختر نوع الخدمة المطلوبة:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setApparelService('fullService')}
                    className={`p-4 rounded-xl border-2 text-right transition-all ${
                      apparelService === 'fullService'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/50 text-blue-950 dark:text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm">غسيل وكوي شامل</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">غسيل، تنشيف، وكوي</div>
                    <div className="font-mono font-black text-blue-600 dark:text-blue-400 mt-2 text-left">
                      {modalItem.pricing?.fullService || 0} ج.م
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setApparelService('ironOnly')}
                    className={`p-4 rounded-xl border-2 text-right transition-all ${
                      apparelService === 'ironOnly'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/50 text-blue-950 dark:text-white shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm">كوي فقط</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">كوي بالبخار فقط</div>
                    <div className="font-mono font-black text-blue-600 dark:text-blue-400 mt-2 text-left">
                      {modalItem.pricing?.ironOnly || 0} ج.م
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Carpet Options (Live Area + Price Preview) */}
            {modalItem.category === 'carpet' && (
              <div className="space-y-4 my-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">سعر المتر المربع:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{modalItem.pricePerMeter || 0} ج.م / م²</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">الطول (متر)</label>
                    <div className="relative">
                      <Ruler className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={carpetLength}
                        onChange={(e) => setCarpetLength(e.target.value)}
                        className="w-full pr-9 pl-3 py-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">العرض (متر)</label>
                    <div className="relative">
                      <Ruler className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" size={15} />
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={carpetWidth}
                        onChange={(e) => setCarpetWidth(e.target.value)}
                        className="w-full pr-9 pl-3 py-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* Live Area + Price Preview */}
                <div className="p-4 bg-blue-900 dark:bg-slate-950 text-white rounded-xl shadow-inner flex items-center justify-between border border-blue-800 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] font-bold text-blue-300 block">
                      المساحة المحسوبة
                    </span>
                    <span className="text-sm font-medium">
                      {Number(carpetLength) || 0}م × {Number(carpetWidth) || 0}م ={' '}
                      <strong className="font-bold">
                        {((Number(carpetLength) || 0) * (Number(carpetWidth) || 0)).toFixed(2)} م²
                      </strong>
                    </span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-[11px] font-bold text-blue-300 block">
                      السعر الإجمالي للصنف
                    </span>
                    <span className="text-xl font-black text-emerald-400">
                      {(
                        (Number(carpetLength) || 0) *
                        (Number(carpetWidth) || 0) *
                        (Number(modalItem.pricePerMeter) || 0)
                      ).toFixed(2)}{' '}
                      ج.م
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Linen Options */}
            {modalItem.category === 'linen' && (
              <div className="p-4 my-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-bold">سعر الوحدة:</span>
                <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">{modalItem.basePrice || 0} ج.م</span>
              </div>
            )}

            {/* Quantity Selector for ALL categories */}
            <div className="my-5 p-4 bg-slate-50/80 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-slate-800 dark:text-white">العدد / الكمية المطلوبة:</label>
                <div className="flex gap-1.5 font-mono">
                  {[1, 2, 5, 10].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setModalQuantity(q)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        modalQuantity === q
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 py-1">
                <button
                  type="button"
                  onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                  className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-black text-2xl flex items-center justify-center shadow-sm transition-transform active:scale-95"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={modalQuantity}
                  onChange={(e) => setModalQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 h-12 bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-xl text-center font-mono font-black text-2xl text-slate-900 dark:text-white outline-none shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setModalQuantity((q) => q + 1)}
                  className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-blue-600/25 transition-transform active:scale-95"
                >
                  +
                </button>
              </div>

              {/* Live Price Summary */}
              {(() => {
                let unitPrice = 0;
                if (modalItem.category === 'apparel') {
                  unitPrice = Number(modalItem.pricing?.[apparelService]) || 0;
                } else if (modalItem.category === 'carpet') {
                  const len = Number(carpetLength) || 0;
                  const wid = Number(carpetWidth) || 0;
                  unitPrice = Number((len * wid * (Number(modalItem.pricePerMeter) || 0)).toFixed(2));
                } else {
                  unitPrice = Number(modalItem.basePrice) || 0;
                }
                return (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>إجمالي السعر ({modalQuantity} قطع × {unitPrice.toFixed(2)} ج.م):</span>
                    <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                      {(unitPrice * modalQuantity).toFixed(2)} ج.م
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-3 mt-6 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="w-1/3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors text-sm"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmModalItem}
                className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 text-sm"
              >
                <Plus size={16} />
                إضافة للسلة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
