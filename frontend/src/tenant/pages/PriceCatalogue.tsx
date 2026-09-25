import { useState, useEffect } from 'react';
import { useTenantAuth } from '../context/TenantAuthContext';
import apiClient from '../../shared/api/client';
import { Edit2, Plus, Trash2, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';

type Category = 'apparel' | 'carpet' | 'linen';

interface PriceItem {
  _id: string;
  category: Category;
  name: string;
  pricing?: { fullService: number; ironOnly: number };
  pricePerMeter?: number;
  basePrice?: number;
}

export const PriceCatalogue = () => {
  const { user } = useTenantAuth();
  const [items, setItems] = useState<PriceItem[]>([]);
  const [activeTab, setActiveTab] = useState<Category>('apparel');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<any>();

  const loadItems = async () => {
    try {
      const res = await apiClient.get('/api/tenant/price-list');
      setItems(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    reset({
      category: activeTab,
      name: '',
      fullService: '',
      ironOnly: '',
      pricePerMeter: '',
      basePrice: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: PriceItem) => {
    setEditingId(item._id);
    reset({
      category: item.category,
      name: item.name,
      fullService: item.pricing?.fullService || '',
      ironOnly: item.pricing?.ironOnly || '',
      pricePerMeter: item.pricePerMeter || '',
      basePrice: item.basePrice || ''
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      let payload: any = { category: activeTab, name: data.name };
      
      if (activeTab === 'apparel') {
        payload.pricing = {
          fullService: Number(data.fullService),
          ironOnly: Number(data.ironOnly)
        };
      } else if (activeTab === 'carpet') {
        payload.pricePerMeter = Number(data.pricePerMeter);
      } else if (activeTab === 'linen') {
        payload.basePrice = Number(data.basePrice);
      }

      if (editingId) {
        await apiClient.patch(`/api/tenant/price-list/${editingId}`, payload);
      } else {
        await apiClient.post('/api/tenant/price-list', payload);
      }

      setIsModalOpen(false);
      loadItems();
    } catch (err) {
      console.error(err);
      alert('فشل حفظ الصنف، يرجى المحاولة لاحقاً');
    }
  };

  const deleteItem = async (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الصنف من قائمة الأسعار؟')) {
      try {
        await apiClient.delete(`/api/tenant/price-list/${id}`);
        loadItems();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredItems = items.filter(i => i.category === activeTab);

  const categoryNames: Record<Category, string> = {
    apparel: 'الملابس',
    carpet: 'السجاد',
    linen: 'المفروشات والأغطية'
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-right transition-colors duration-300">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">قائمة الأسعار والأصناف</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">إدارة وتعديل أسعار خدمات الغسيل، الكوي، السجاد والمفروشات.</p>
        </div>
        {user?.role === 'owner' && (
          <button
            type="button"
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-600/25 active:scale-95"
          >
            <Plus size={18} />
            <span>إضافة صنف جديد</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {(['apparel', 'carpet', 'linen'] as Category[]).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveTab(cat)}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                activeTab === cat 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/40' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {categoryNames[cat]}
            </button>
          ))}
        </div>

        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4 pr-6 font-bold">اسم الصنف</th>
              <th className="p-4 font-bold">الأسعار والخدمات</th>
              {user?.role === 'owner' && (
                <th className="p-4 pl-6 text-left font-bold">الإجراءات</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {filteredItems.map((item) => (
              <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                <td className="p-4 pr-6 text-slate-900 dark:text-white font-bold flex items-center gap-2">
                  <Tag size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>{item.name}</span>
                </td>
                <td className="p-4 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                  {item.category === 'apparel' && (
                    <div className="flex flex-wrap gap-3">
                      <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800">
                        شامل: {item.pricing?.fullService || 0} ج.م
                      </span>
                      <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                        كوي: {item.pricing?.ironOnly || 0} ج.م
                      </span>
                    </div>
                  )}
                  {item.category === 'carpet' && (
                    <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      {item.pricePerMeter || 0} ج.م / م²
                    </span>
                  )}
                  {item.category === 'linen' && (
                    <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
                      {item.basePrice || 0} ج.م (سعر أساسي)
                    </span>
                  )}
                </td>
                {user?.role === 'owner' && (
                  <td className="p-4 pl-6 text-left">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="تعديل الصنف"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItem(item._id)}
                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="حذف الصنف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={3} className="p-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                  لا توجد أصناف مضافة في قسم ({categoryNames[activeTab]}) حالياً.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-right">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {editingId ? 'تعديل الصنف' : 'إضافة صنف جديد'} ({categoryNames[activeTab]})
              </h2>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">اسم الصنف</label>
                <input
                  {...register('name')}
                  placeholder="مثال: ثوب رجالي، قميص، سجاد حرير..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-right placeholder-slate-400"
                  required
                />
              </div>

              {activeTab === 'apparel' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">سعر الغسيل والكوي (ج.م)</label>
                    <input
                      {...register('fullService')}
                      type="number" step="0.5"
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-left placeholder-slate-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">سعر الكوي فقط (ج.م)</label>
                    <input
                      {...register('ironOnly')}
                      type="number" step="0.5"
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-left placeholder-slate-400"
                      required
                    />
                  </div>
                </div>
              )}

              {activeTab === 'carpet' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">سعر المتر المربع (ج.م / م²)</label>
                  <input
                    {...register('pricePerMeter')}
                    type="number" step="0.5"
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-left placeholder-slate-400"
                    required
                  />
                </div>
              )}

              {activeTab === 'linen' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">السعر الأساسي للقطعة (ج.م)</label>
                  <input
                    {...register('basePrice')}
                    type="number" step="0.5"
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-left placeholder-slate-400"
                    required
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-600/25 active:scale-95"
                >
                  حفظ الصنف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
