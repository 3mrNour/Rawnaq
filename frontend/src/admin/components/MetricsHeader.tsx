import { useEffect, useState } from 'react';
import apiClient from '../../shared/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';

interface Metrics {
  active: number;
  suspended: number;
  expired: number;
  expiringSoon: number;
}

export function MetricsHeader({ refreshKey }: { refreshKey: number }) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    apiClient.get('/api/admin/shops/metrics')
      .then(res => {
        if (mounted) {
          setMetrics(res.data.data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to fetch metrics:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>)}
    </div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="dark:bg-slate-900/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400">المغاسل النشطة (Active)</CardTitle>
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{metrics?.active ?? 0}</div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">تعمل بشكل طبيعي</p>
        </CardContent>
      </Card>
      
      <Card className="dark:bg-slate-900/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400">تنتهي قريباً (أقل من 7 أيام)</CardTitle>
          <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{metrics?.expiringSoon ?? 0}</div>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">تتطلب تجديد الاشتراك</p>
        </CardContent>
      </Card>

      <Card className="dark:bg-slate-900/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400">مغاسل موقوفة (Suspended)</CardTitle>
          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
            <AlertCircle className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{metrics?.suspended ?? 0}</div>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">تم إيقاف الخدمة عنها</p>
        </CardContent>
      </Card>

      <Card className="dark:bg-slate-900/80 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold text-slate-600 dark:text-slate-400">اشتراكات منتهية (Expired)</CardTitle>
          <div className="p-2 bg-slate-500/10 rounded-xl text-slate-500">
            <XCircle className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2">{metrics?.expired ?? 0}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">انتهت فترة الترخيص</p>
        </CardContent>
      </Card>
    </div>
  );
}
