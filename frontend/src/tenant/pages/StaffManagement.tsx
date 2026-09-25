import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useTenantAuth } from '../context/TenantAuthContext';
import apiClient from '../../shared/api/client';
import { Edit2, Plus, Trash2, Shield, Settings2, DollarSign } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface StaffMember {
  _id: string;
  name: string;
  role: 'owner' | 'cashier' | null;
  workerType: 'dry-cleaner' | 'ironer' | 'none';
  payType?: 'percentage' | 'fixed-daily' | 'fixed-per-piece';
  payValue?: number;
}

export const StaffManagement = () => {
  const { user } = useTenantAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch } = useForm<any>({
    defaultValues: {
      role: 'cashier',
      workerType: 'none'
    }
  });

  const watchWorkerType = watch('workerType');

  if (user?.role !== 'owner') {
    return <Navigate to="/" replace />;
  }

  const loadStaff = async () => {
    try {
      const res = await apiClient.get('/api/tenant/staff');
      setStaff(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    reset({
      name: '',
      pinCode: '',
      password: '',
      role: 'cashier',
      workerType: 'none',
      payType: 'fixed-daily',
      payValue: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (member: StaffMember) => {
    setEditingId(member._id);
    reset({
      name: member.name,
      role: member.role || 'none',
      workerType: member.workerType,
      payType: member.payType || 'fixed-daily',
      payValue: member.payValue || 0
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = { ...data };
      if (payload.role === 'none') payload.role = null;
      if (payload.workerType === 'none') {
        delete payload.payType;
        delete payload.payValue;
      } else {
        payload.payValue = Number(payload.payValue);
      }

      if (editingId) {
        delete payload.pinCode;
        delete payload.password;
        await apiClient.patch(`/api/tenant/staff/${editingId}`, payload);
      } else {
        await apiClient.post('/api/tenant/staff', payload);
      }

      setIsModalOpen(false);
      loadStaff();
    } catch (err) {
      console.error(err);
      alert('فشل حفظ بيانات الموظف، يرجى المحاولة لاحقاً أو التأكد من صحة البيانات.');
    }
  };

  const deleteStaff = async (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الموظف نهائياً؟')) {
      try {
        await apiClient.delete(`/api/tenant/staff/${id}`);
        loadStaff();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const payTypeLabels: Record<string, string> = {
    percentage: 'نسبة مئوية (%)',
    'fixed-daily': 'يومية ثابتة (ج.م)',
    'fixed-per-piece': 'لكل قطعة (ج.م)'
  };

  const workerTypeLabels: Record<string, string> = {
    'dry-cleaner': 'غسيل وتنشيف',
    ironer: 'كوي وبخار',
    none: 'بدون'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-right transition-colors duration-300">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">إدارة طاقم العمل والموظفين</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">إدارة الكاشير وموظفي خطوط الإنتاج وإعدادات الرواتب والعمولات.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/staff/earnings"
            className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm"
          >
            <DollarSign size={18} />
            <span>تقارير مستحقات العمال</span>
          </Link>
          <button
            type="button"
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-600/25 active:scale-95"
          >
            <Plus size={18} />
            <span>إضافة موظف جديد</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4 pr-6 font-bold">اسم الموظف</th>
              <th className="p-4 font-bold">صلاحية النظام</th>
              <th className="p-4 font-bold">وظيفة خط الإنتاج</th>
              <th className="p-4 font-bold">نظام الاحتساب والراتب</th>
              <th className="p-4 pl-6 text-left font-bold">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {staff.map((s) => (
              <tr key={s._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                <td className="p-4 pr-6 text-slate-900 dark:text-white font-bold">{s.name}</td>
                <td className="p-4">
                  {s.role ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      <Shield size={12} />
                      {s.role === 'owner' ? 'مالك المغسلة' : 'كاشير'}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold">بدون صلاحية</span>
                  )}
                </td>
                <td className="p-4">
                  {s.workerType !== 'none' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      <Settings2 size={12} />
                      {workerTypeLabels[s.workerType] || s.workerType}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold">ليس عامل إنتاج</span>
                  )}
                </td>
                <td className="p-4">
                  {s.workerType !== 'none' && s.payType ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                        {s.payValue} {s.payType === 'percentage' ? '%' : 'ج.م'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{payTypeLabels[s.payType] || s.payType}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-sm">-</span>
                  )}
                </td>
                <td className="p-4 pl-6 text-left">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => openEditModal(s)}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="تعديل بيانات الموظف"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteStaff(s._id)}
                      className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="حذف الموظف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-500 dark:text-slate-400 font-bold">
                  لا يوجد موظفون مضافون حالياً. قم بإضافة أول موظف للبدء.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-right">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {editingId ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">اسم الموظف</label>
                <input
                  {...register('name')}
                  placeholder="مثال: محمد علي"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-right placeholder-slate-400"
                  required
                />
              </div>

              {!editingId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">رمز الدخول (PIN 4 أرقام)</label>
                    <input
                      {...register('pinCode')}
                      maxLength={4}
                      placeholder="مثال: 1234"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-center placeholder-slate-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">كلمة المرور للنظام</label>
                    <input
                      {...register('password')}
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-left placeholder-slate-400"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">صلاحية الدخول لنظام الكاشير والإدارة</label>
                <select
                  {...register('role')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-right"
                >
                  <option value="none">بدون صلاحية دخول (عامل إنتاج فقط)</option>
                  <option value="cashier">كاشير نقطة البيع</option>
                  <option value="owner">مالك المغسلة (صلاحيات كاملة)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">الوظيفة في خط الإنتاج (شاشات المصنع)</label>
                <select
                  {...register('workerType')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-right"
                >
                  <option value="none">ليس عامل خط إنتاج</option>
                  <option value="dry-cleaner">عامل غسيل وتنشيف</option>
                  <option value="ironer">عامل كوي بالبخار</option>
                </select>
              </div>

              {/* Conditional rendering for Pay Fields */}
              {watchWorkerType !== 'none' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">طريقة الاحتساب</label>
                    <select
                      {...register('payType')}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-right"
                    >
                      <option value="percentage">نسبة مئوية (%)</option>
                      <option value="fixed-daily">يومية ثابتة (ج.م)</option>
                      <option value="fixed-per-piece">لكل قطعة (ج.م)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">القيمة (ج.م أو %)</label>
                    <input
                      {...register('payValue')}
                      type="number"
                      step="0.5"
                      className="w-full px-3 py-2 font-mono font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-left text-emerald-600 dark:text-emerald-400"
                      required
                    />
                  </div>
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
                  {editingId ? 'حفظ التعديلات' : 'إضافة الموظف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
