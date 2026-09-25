import { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Plus, ShieldCheck } from 'lucide-react';
import { MetricsHeader } from '../components/MetricsHeader';
import { ShopsTable, type Shop } from '../components/ShopsTable';
import { ShopDetailDrawer } from '../components/ShopDetailDrawer';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../../shared/context/ThemeContext';

export function Dashboard() {
  const { logout } = useAdminAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const navigate = useNavigate();

  const bumpRefreshKey = () => setRefreshKey(prev => prev + 1);

  const handleRowClick = (shop: Shop) => {
    setSelectedShop(shop);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              منصة رونق - الإدارة العليا (SuperAdmin)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">لوحة التحكم المركزية وإدارة الاشتراكات والتراخيص</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={logout} className="gap-2 font-bold dark:border-slate-700 dark:hover:bg-slate-800">
            <LogOut className="h-4 w-4 text-red-500" />
            <span>تسجيل الخروج</span>
          </Button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">نظرة عامة على المغاسل</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">متابعة الاشتراكات وحالة التراخيص الحالية لكافة المغاسل المشتركة</p>
          </div>
          <Button onClick={() => navigate('/admin/shops/create')} className="bg-blue-600 hover:bg-blue-700 font-bold gap-2 shadow-lg shadow-blue-600/20 rounded-xl px-5 h-11">
            <Plus className="h-5 w-5" />
            <span>إضافة مغسلة جديدة</span>
          </Button>
        </div>
        
        <MetricsHeader refreshKey={refreshKey} />
        <ShopsTable refreshKey={refreshKey} onRowClick={handleRowClick} />
      </main>

      <ShopDetailDrawer 
        shop={selectedShop} 
        onClose={() => setSelectedShop(null)} 
        onActionComplete={bumpRefreshKey} 
      />
    </div>
  );
}
