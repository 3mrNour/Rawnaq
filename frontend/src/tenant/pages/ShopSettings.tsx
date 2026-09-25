import { useState, useEffect } from 'react';
import { useTenantAuth } from '../context/TenantAuthContext';
import { Navigate } from 'react-router-dom';
import apiClient from '../../shared/api/client';
import { useForm } from 'react-hook-form';
import { ShieldCheck, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface ShopSettingsData {
  name: string;
  licenseKey: string;
  subscriptionStatus: string;
  expiryDate: string;
  dailyCapacityLimit: number;
}

export const ShopSettings = () => {
  const { user } = useTenantAuth();
  const [shop, setShop] = useState<ShopSettingsData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ dailyCapacityLimit: number }>();

  if (user?.role !== 'owner') {
    return <Navigate to="/" replace />;
  }

  const loadShopMe = async () => {
    try {
      const res = await apiClient.get('/api/tenant/shop/me');
      setShop(res.data.data);
      reset({ dailyCapacityLimit: res.data.data.dailyCapacityLimit });
    } catch (err) {
      console.error('Failed to load shop details', err);
    }
  };

  useEffect(() => {
    loadShopMe();
  }, []);

  const onSubmit = async (data: { dailyCapacityLimit: number }) => {
    setIsSaving(true);
    try {
      await apiClient.patch('/api/tenant/shop/me', {
        dailyCapacityLimit: Number(data.dailyCapacityLimit)
      });
      alert('تم تحديث الإعدادات بنجاح!');
      loadShopMe();
    } catch (err) {
      console.error(err);
      alert('فشل تحديث الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  if (!shop) {
    return <div className="flex justify-center items-center h-full text-slate-500 font-bold py-20">جاري تحميل الإعدادات...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-right transition-colors duration-300">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">إعدادات المغسلة والترخيص</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">إدارة الطاقة الاستيعابية اليومية ومتابعة حالة الاشتراك والترخيص.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Activity className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
              <span>إعدادات التشغيل والطاقة الاستيعابية</span>
            </h2>
            
            <div className="space-y-6 font-medium">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">اسم المغسلة</label>
                <input
                  type="text"
                  value={shop.name}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl cursor-not-allowed font-bold text-sm text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">الحد الأقصى للطلبات اليومية</label>
                <div className="relative">
                  <input
                    {...register('dailyCapacityLimit')}
                    type="number"
                    min="1"
                    className="w-full pl-24 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-right transition-all"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none border-r border-slate-200 dark:border-slate-800 pr-3">
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-bold">طلب / يوم</span>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">الحد الأقصى لعدد الفواتير التي يمكن استقبالها وتلبيتها في المغسلة يومياً.</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-600/25 active:scale-95"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="md:col-span-1">
          <div className="bg-slate-900 dark:bg-slate-950 rounded-3xl shadow-xl border border-slate-800 p-6 text-white">
            <h2 className="text-lg font-black mb-6 flex items-center gap-2">
              <ShieldCheck className="text-blue-400 shrink-0" size={20} />
              <span>بيانات الترخيص</span>
            </h2>
            
            <div className="space-y-5 font-medium">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">حالة الاشتراك</label>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                  shop.subscriptionStatus === 'active' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {shop.subscriptionStatus === 'active' ? 'نشط (مفعل)' : 'منتهي أو متوقف'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">مفتاح الترخيص (License Key)</label>
                <code className="block px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono text-xs font-bold select-all text-left">
                  {shop.licenseKey}
                </code>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">تاريخ انتهاء الترخيص</label>
                <div className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm font-mono font-bold">
                  {format(new Date(shop.expiryDate), 'yyyy-MM-dd')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
