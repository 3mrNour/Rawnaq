import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useTenantAuth } from '../context/TenantAuthContext';
import { LogOut, Users, FileText, Settings, ShoppingCart, DollarSign, Store } from 'lucide-react';
import { ThemeToggle } from '../../shared/context/ThemeContext';

export const TenantLayout = () => {
  const { token, user, logout } = useTenantAuth();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 overflow-hidden">
      <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-white flex flex-col border-l border-slate-800/80 shadow-2xl z-20">
        <div className="p-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white shadow-md">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                مغاسل رونق
              </h2>
              <p className="text-slate-400 text-xs font-semibold mt-0.5 truncate max-w-[140px]">{user.name}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center px-2.5 py-0.5 bg-slate-800 text-blue-300 text-xs font-bold rounded-full border border-slate-700">
              {user.role === 'owner' ? 'مالك المغسلة' : 'كاشير / موظف'}
            </span>
            <ThemeToggle size={18} className="!p-1.5 !bg-slate-800 !border-slate-700 !text-slate-300 hover:!text-white" />
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1.5 mt-4 overflow-y-auto">
          <Link 
            to="/pos" 
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm transition-all ${
              isActive('/pos') 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-[-2px]' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <ShoppingCart size={18} className={isActive('/pos') ? 'text-white' : 'text-blue-400'} />
            <span>نقطة البيع (إدخال طلب)</span>
          </Link>

          <Link 
            to="/orders" 
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm transition-all ${
              isActive('/orders') 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-[-2px]' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <FileText size={18} className={isActive('/orders') ? 'text-white' : 'text-cyan-400'} />
            <span>لوحة الطلبات والحالات</span>
          </Link>

          {user.role === 'owner' && (
            <>
              <Link 
                to="/staff" 
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm transition-all ${
                  isActive('/staff') 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-[-2px]' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Users size={18} className={isActive('/staff') ? 'text-white' : 'text-amber-400'} />
                <span>إدارة الموظفين والصلاحيات</span>
              </Link>

              <Link 
                to="/staff/earnings" 
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm transition-all ${
                  isActive('/staff/earnings') 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 translate-x-[-2px]' 
                    : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80'
                }`}
              >
                <DollarSign size={18} className={isActive('/staff/earnings') ? 'text-white' : 'text-emerald-400'} />
                <span>تقارير أرباح الموظفين</span>
              </Link>
            </>
          )}

          <Link 
            to="/price-catalogue" 
            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm transition-all ${
              isActive('/price-catalogue') 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-[-2px]' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <FileText size={18} className={isActive('/price-catalogue') ? 'text-white' : 'text-purple-400'} />
            <span>كتالوج الأسعار والخدمات</span>
          </Link>

          {user.role === 'owner' && (
            <Link 
              to="/settings" 
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm transition-all ${
                isActive('/settings') 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 translate-x-[-2px]' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Settings size={18} className={isActive('/settings') ? 'text-white' : 'text-slate-400'} />
              <span>إعدادات المغسلة والاشتراك</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 dark:bg-slate-950">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3.5 py-2.5 w-full text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-xl transition-all font-bold text-sm"
          >
            <LogOut size={18} className="text-red-400" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};
