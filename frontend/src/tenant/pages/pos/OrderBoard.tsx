import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Phone, 
  User, 
  Calendar, 
  ArrowLeft, 
  RefreshCw, 
  Package, 
  AlertCircle,
  Ban,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import apiClient from '../../../shared/api/client';
import type { OrderStatus } from '../../../types/rawnaq.types';

interface OrderItem {
  _id: string;
  itemId: string;
  name: string;
  category: 'apparel' | 'carpet' | 'linen';
  finalPrice: number;
  originalPrice?: number;
  overrideReason?: string;
  serviceOption?: string;
  dimensions?: {
    length: number;
    width: number;
    area?: number;
  };
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  deliveryDate: string;
  items: OrderItem[];
  createdAt: string;
}

export function OrderBoard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery.trim() !== '') {
        params.append('search', searchQuery.trim());
      }

      const res = await apiClient.get(`/api/tenant/orders?${params.toString()}`);
      setOrders(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(err.message || 'فشل تحميل لوحة الطلبات وحالات الغسيل');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, currentStatus: OrderStatus, nextStatus: OrderStatus) => {
    const isValidTransition = 
      (currentStatus === 'received' && nextStatus === 'ready') ||
      (currentStatus === 'ready' && nextStatus === 'delivered');

    if (!isValidTransition) return;

    setUpdatingId(orderId);
    setError(null);
    try {
      const res = await apiClient.patch(`/api/tenant/orders/${orderId}/status`, {
        status: nextStatus
      });
      
      const updatedOrder = res.data.data;
      
      setOrders(prevOrders => 
        prevOrders.map(o => o._id === orderId ? { ...o, status: updatedOrder.status } : o)
      );

      if (nextStatus === 'ready') {
        setSuccessToast(`تم تحويل الطلب رقم #${updatedOrder.orderNumber} إلى جاهز للاستلام! تم إرسال إشعار الواتساب تلقائياً.`);
      } else if (nextStatus === 'delivered') {
        setSuccessToast(`تم تسليم الطلب رقم #${updatedOrder.orderNumber} للمتعامل بنجاح!`);
      }

      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      console.error('Status update failed:', err);
      setError(err.message || 'فشل تحديث حالة الطلب');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'received':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-sm">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            قيد التجهيز والغسيل
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            جاهز للاستلام
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 shadow-sm">
            <Truck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            تم التسليم للمتعامل
          </span>
        );
    }
  };

  const calculateTotal = (items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + (item.finalPrice || 0), 0).toFixed(2);
  };

  const statusNames: Record<string, string> = {
    all: 'جميع الطلبات',
    received: 'قيد التجهيز',
    ready: 'جاهز للاستلام',
    delivered: 'تم التسليم'
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 space-y-6 text-right transition-colors duration-300">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            لوحة متابعة الطلبات وحالات الغسيل
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            متابعة حية لسير عمل الطلبات، البحث برقم الفاتورة أو جوال العميل، ونقل الحالة مع إشعارات واتساب التلقائية.
          </p>
        </div>
        
        <button
          type="button"
          onClick={() => fetchOrders()}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-white font-bold text-sm shadow transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث الفواتير
        </button>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 px-5 py-4 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm">{successToast}</span>
          </div>
          <button type="button" onClick={() => setSuccessToast(null)} className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 text-xs font-black px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors">
            إخفاء
          </button>
        </div>
      )}

      {/* Error Bar */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 px-5 py-4 rounded-2xl flex items-center gap-3 shadow-lg font-bold text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search Input */}
        <div className="md:col-span-6 relative">
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الفاتورة (مثال: 0001)، جوال العميل، أو الاسم..."
            className="w-full pr-12 pl-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-right font-medium text-sm"
          />
        </div>

        {/* Status Pills */}
        <div className="md:col-span-6 flex items-center gap-2 overflow-x-auto bg-white dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-3 flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5" /> تصنيف الحالة:
          </span>
          {['all', 'received', 'ready', 'delivered'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {statusNames[status] || status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid / List */}
      {loading && orders.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-white dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800/50 shadow-sm">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">جاري تحميل الفواتير من قاعدة البيانات...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800/50 shadow-sm">
          <Package className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto stroke-1" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">لا توجد طلبات مطابقة</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto font-medium">
            {searchQuery || statusFilter !== 'all' 
              ? 'حاول تعديل كلمات البحث أو إلغاء فلتر الحالة لرؤية المزيد من الطلبات.'
              : 'لا توجد أي فواتير مسجلة في النظام بعد. انتقل إلى نقطة البيع لإنشاء أول طلب!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((order) => {
            const isReceived = order.status === 'received';
            const isReady = order.status === 'ready';
            const isDelivered = order.status === 'delivered';
            const isUpdating = updatingId === order._id;

            return (
              <div 
                key={order._id}
                className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl hover:border-blue-500/50 transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
              >
                {/* Left Section: Order Info & Customer */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-lg font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700/80">
                      #{order.orderNumber}
                    </span>
                    {getStatusBadge(order.status)}
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      تاريخ الطلب: {format(new Date(order.createdAt), 'yyyy-MM-dd, h:mm a')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-slate-900 dark:text-white">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{order.customerPhone}</span>
                    </div>
                  </div>

                  {/* Items list preview */}
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800/60 space-y-2">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider pb-1 border-b border-slate-200 dark:border-slate-800/60">
                      <span>الأصناف ({order.items.length})</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">الإجمالي: {calculateTotal(order.items)} ج.م</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {order.items.map((item, idx) => (
                        <span 
                          key={item._id || idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm"
                        >
                          <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                          {item.category === 'carpet' && item.dimensions && (
                            <span className="text-slate-400 text-[10px]">({item.dimensions.length}×{item.dimensions.width}م)</span>
                          )}
                          <span className="text-blue-600 dark:text-blue-400 font-mono font-bold text-[11px] mr-1">{item.finalPrice} ج.م</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Section: Status Advance Controls */}
                <div className="flex flex-col sm:flex-row lg:flex-col justify-center gap-3 min-w-[220px] pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-r border-slate-200 dark:border-slate-800/80 lg:pr-6">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1 hidden lg:block text-center">
                    التحكم في المرحلة
                  </div>

                  {/* Button 1: Advance to Ready */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(order._id, order.status, 'ready')}
                    disabled={!isReceived || isUpdating}
                    title="تحويل الطلب إلى جاهز للاستلام وإرسال رسالة واتساب للعميل"
                    className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
                      isReceived
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer'
                        : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-70'
                    }`}
                  >
                    {isUpdating && isReceived ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>تحويل إلى (جاهز للاستلام)</span>
                  </button>

                  {/* Button 2: Advance to Delivered */}
                  <button
                    type="button"
                    onClick={() => handleStatusChange(order._id, order.status, 'delivered')}
                    disabled={!isReady || isUpdating}
                    title="تسليم الطلب للعميل وإغلاق الفاتورة"
                    className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 ${
                      isReady
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-95 cursor-pointer'
                        : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-70'
                    }`}
                  >
                    {isUpdating && isReady ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Truck className="w-4 h-4" />
                    )}
                    <span>تحويل إلى (تم التسليم)</span>
                  </button>

                  {/* Disabled transition feedback text */}
                  <div className="text-[11px] text-center text-slate-500 flex items-center justify-center gap-1 font-bold">
                    {isReceived && (
                      <span className="text-amber-600 dark:text-amber-400/80 flex items-center gap-1">
                        <ArrowLeft className="w-3 h-3" /> المرحلة التالية: جاهز للاستلام
                      </span>
                    )}
                    {isReady && (
                      <span className="text-emerald-600 dark:text-emerald-400/80 flex items-center gap-1">
                        <ArrowLeft className="w-3 h-3" /> المرحلة التالية: تم التسليم
                      </span>
                    )}
                    {isDelivered && (
                      <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Ban className="w-3 h-3" /> مكتمل ومغلق (لا يمكن التعديل)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
