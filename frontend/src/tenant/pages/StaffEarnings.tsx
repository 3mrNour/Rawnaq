import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { 
  DollarSign, 
  Users, 
  Calendar, 
  RefreshCw, 
  Tag, 
  Award, 
  Clock, 
  X,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { useTenantAuth } from '../context/TenantAuthContext';
import apiClient from '../../shared/api/client';

interface StaffMember {
  _id: string;
  name: string;
  role: 'owner' | 'cashier' | null;
  workerType: 'dry-cleaner' | 'ironer' | 'none';
  payType?: 'percentage' | 'fixed-daily' | 'fixed-per-piece';
  payValue?: number;
}

interface WorkerItemLog {
  itemId: string;
  name: string;
  category: string;
  finalPrice: number;
  workerRateSnapshot: number;
  assignedAt: string | null;
}

interface WorkerEarningsReport {
  workerId: string;
  workerName: string;
  workerType: string;
  payType: string;
  payValue: number;
  totalEarnings: number;
  itemsCount: number;
  uniqueDaysWorked: number;
  items: WorkerItemLog[];
}

type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';

export const StaffEarnings: React.FC = () => {
  const { user } = useTenantAuth();

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [reports, setReports] = useState<Record<string, WorkerEarningsReport>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedWorkerLog, setSelectedWorkerLog] = useState<WorkerEarningsReport | null>(null);

  const [preset, setPreset] = useState<DatePreset>('week');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });

  if (user?.role !== 'owner') {
    return <Navigate to="/" replace />;
  }

  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset);
    const todayStr = new Date().toISOString().slice(0, 10);
    
    if (newPreset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (newPreset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (newPreset === 'week') {
      const w = new Date();
      w.setDate(w.getDate() - 7);
      setStartDate(w.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (newPreset === 'month') {
      const m = new Date();
      m.setDate(1);
      setStartDate(m.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (newPreset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const fetchEarningsData = async () => {
    setIsLoading(true);
    try {
      const staffRes = await apiClient.get('/api/tenant/staff');
      const allStaff: StaffMember[] = staffRes.data.data || [];
      setStaffList(allStaff);

      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const reportMap: Record<string, WorkerEarningsReport> = {};

      await Promise.all(
        allStaff.map(async (worker) => {
          try {
            const res = await apiClient.get(`/api/tenant/staff/${worker._id}/earnings${queryString}`);
            if (res.data?.data) {
              reportMap[worker._id] = res.data.data;
            }
          } catch (err) {
            console.error(`Failed to fetch earnings for worker ${worker._id}:`, err);
          }
        })
      );

      setReports(reportMap);
    } catch (err) {
      console.error('Error fetching staff earnings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, [startDate, endDate]);

  const totalPayroll = Object.values(reports).reduce((sum, r) => sum + (r.totalEarnings || 0), 0);
  const totalItemsProcessed = Object.values(reports).reduce((sum, r) => sum + (r.itemsCount || 0), 0);
  const activeWorkersCount = Object.values(reports).filter((r) => r.itemsCount > 0 || r.uniqueDaysWorked > 0).length;

  const presetLabels: Record<string, string> = {
    today: 'اليوم',
    yesterday: 'أمس',
    week: 'آخر 7 أيام',
    month: 'هذا الشهر',
    all: 'كل الأوقات',
    custom: 'مخصص'
  };

  const workerTypeLabels: Record<string, string> = {
    'dry-cleaner': 'غسيل وتنشيف',
    ironer: 'كوي وبخار',
    none: 'بدون'
  };

  const categoryLabels: Record<string, string> = {
    apparel: 'ملابس',
    carpet: 'سجاد',
    linen: 'مفروشات'
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300 text-right transition-colors duration-300">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-md shadow-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              تقرير الإنتاج ومستحقات العمال
            </h1>
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} />
              خاص بمالك المغسلة فقط
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium pr-14">
            احتساب فوري لرواتب وعمولات العمال بناءً على عمليات المسح في شاشات المصنع ونظام الرواتب المحدد.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchEarningsData}
            disabled={isLoading}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-slate-200 dark:border-slate-700 active:scale-95 disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>تحديث البيانات</span>
          </button>

          <Link
            to="/staff"
            className="flex items-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
          >
            <Users className="w-4 h-4 text-slate-300" />
            <span>إدارة رواتب العمال</span>
          </Link>
        </div>
      </header>

      {/* Top Summary KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">إجمالي المستحقات (للمدة المحددة)</span>
            <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black mt-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-300 font-mono">
            {totalPayroll.toFixed(2)} <span className="text-lg font-bold">ج.م</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            محتسبة بدقة من عمولات القطع واليوميات الثابتة
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">إجمالي القطع المنجزة</span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 dark:text-white mt-4 font-mono">
            {totalItemsProcessed} <span className="text-xl font-bold text-slate-400 dark:text-slate-500">قطعة</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            تم مسحها وإنجازها عبر شاشات خطوط الإنتاج
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">العمال النشطون في الإنتاج</span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 dark:text-white mt-4 font-mono">
            {activeWorkersCount} <span className="text-xl font-bold text-slate-400 dark:text-slate-500">من أصل {staffList.length}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            عمال لديهم إنجاز مسجل خلال هذه الفترة
          </p>
        </div>
      </section>

      {/* Date Range Control Bar */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <span className="font-bold text-slate-800 dark:text-white text-sm tracking-wide">فلترة حسب الفترة الزمنية:</span>
          </div>

          {/* Preset Pills */}
          <div className="flex items-center flex-wrap gap-2">
            {(['today', 'yesterday', 'week', 'month', 'all'] as DatePreset[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePresetChange(p)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  preset === p
                    ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-md scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {presetLabels[p] || p}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Inputs */}
        <div className="flex items-center justify-start flex-wrap gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            <span>من:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setPreset('custom');
                setStartDate(e.target.value);
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-800 dark:text-slate-100 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            <span>إلى:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setPreset('custom');
                setEndDate(e.target.value);
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-800 dark:text-slate-100 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* Workers Table */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">تفاصيل إنجاز ومستحقات كل عامل</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">اضغط على "عرض السجل" لمراجعة تفاصيل كل قطعة قام العامل بإنجازها ومسحها</p>
          </div>
          <span className="text-xs font-bold px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
            إجمالي الموظفين: {staffList.length}
          </span>
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 dark:text-slate-400 font-bold animate-pulse">جاري احتساب وتجميع مستحقات العمال من قاعدة البيانات...</p>
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400 font-bold">
            لا يوجد موظفون مضافون في هذه المغسلة بعد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6 font-bold">اسم العامل والوظيفة</th>
                  <th className="py-4 px-6 font-bold">نوع العمل</th>
                  <th className="py-4 px-6 font-bold">نظام الراتب والعمولة</th>
                  <th className="py-4 px-6 text-center font-bold">القطع المنجزة</th>
                  <th className="py-4 px-6 text-center font-bold">أيام العمل</th>
                  <th className="py-4 px-6 text-left font-bold">إجمالي المستحقات</th>
                  <th className="py-4 px-6 text-center font-bold">سجل العمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-sm font-medium text-slate-700 dark:text-slate-300">
                {staffList.map((worker) => {
                  const report = reports[worker._id] || {
                    totalEarnings: 0,
                    itemsCount: 0,
                    uniqueDaysWorked: 0,
                    items: [],
                  };
                  const isProductionWorker = worker.workerType !== 'none';

                  return (
                    <tr 
                      key={worker._id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${!isProductionWorker ? 'opacity-60 bg-slate-50/40 dark:bg-slate-950/40' : ''}`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                            worker.role === 'owner' ? 'bg-amber-600' : isProductionWorker ? 'bg-blue-600' : 'bg-slate-500'
                          }`}>
                            {worker.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{worker.name}</div>
                            <span className="text-xs text-slate-400 dark:text-slate-500">{worker.role === 'owner' ? 'مالك المغسلة' : 'موظف'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          worker.workerType === 'dry-cleaner'
                            ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800'
                            : worker.workerType === 'ironer'
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {workerTypeLabels[worker.workerType] || worker.workerType}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-mono text-xs">
                        {worker.payType === 'percentage' && (
                          <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-bold">
                            {worker.payValue || 0}% من سعر القطعة
                          </span>
                        )}
                        {worker.payType === 'fixed-per-piece' && (
                          <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 font-bold">
                            {(worker.payValue || 0).toFixed(2)} ج.م / قطعة
                          </span>
                        )}
                        {worker.payType === 'fixed-daily' && (
                          <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 font-bold">
                            {(worker.payValue || 0).toFixed(2)} ج.م / يوم عمل
                          </span>
                        )}
                        {!worker.payType && <span className="text-slate-400 dark:text-slate-500">— غير محدد —</span>}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block font-mono font-bold px-3 py-1 rounded-xl ${
                          report.itemsCount > 0 ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' : 'text-slate-400 bg-slate-50 dark:bg-slate-800/50'
                        }`}>
                          {report.itemsCount}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center">
                        {worker.payType === 'fixed-daily' ? (
                          <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                            {report.uniqueDaysWorked} {report.uniqueDaysWorked === 1 ? 'يوم' : 'أيام'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-left">
                        <span className={`font-mono font-black text-base ${
                          report.totalEarnings > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                        }`}>
                          {(report.totalEarnings || 0).toFixed(2)} ج.م
                        </span>
                      </td>

                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedWorkerLog(report)}
                          disabled={report.itemsCount === 0}
                          className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-all border border-slate-200 dark:border-slate-700 disabled:opacity-40 disabled:pointer-events-none"
                        >
                          <span>عرض السجل ({report.itemsCount})</span>
                          <ChevronLeft size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Slide-Over Modal for Worker Item Log Details */}
      {selectedWorkerLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-start animate-in fade-in duration-200 text-right">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-300 border-r border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">سجل إنجاز العامل: {selectedWorkerLog.workerName}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  الرقم التعريفي: {selectedWorkerLog.workerId} | إجمالي القطع المنجزة: {selectedWorkerLog.itemsCount} قطعة
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWorkerLog(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">نظام الاحتساب الحالي</span>
                <div className="font-bold text-slate-800 dark:text-white uppercase text-sm font-mono">
                  {selectedWorkerLog.payType} (@ {selectedWorkerLog.payValue})
                </div>
              </div>
              <div className="text-left space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">الإجمالي المستحق (للفترة)</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {selectedWorkerLog.totalEarnings.toFixed(2)} ج.م
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">سجل القطع المنجزة بالتفصيل</h4>
              {selectedWorkerLog.items.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold">
                  لا توجد قطع منجزة لهذا العامل خلال الفترة المحددة.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedWorkerLog.items.map((item, idx) => (
                    <div 
                      key={idx}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-emerald-500/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-lg uppercase font-bold">
                            {categoryLabels[item.category] || item.category || 'قطعة'}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">#{item.itemId}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono">
                          <Clock size={12} className="text-slate-400" />
                          <span>وقت الإنجاز: {item.assignedAt ? new Date(item.assignedAt).toLocaleString('ar-EG') : 'غير متوفر'}</span>
                        </div>
                      </div>

                      <div className="text-left font-mono">
                        <div className="text-xs text-slate-400 dark:text-slate-500">سعر العميل: {item.finalPrice?.toFixed(2)} ج.م</div>
                        <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          المستحق للعامل: +{item.workerRateSnapshot?.toFixed(2)} ج.م
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedWorkerLog(null)}
                className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
              >
                إغلاق السجل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
