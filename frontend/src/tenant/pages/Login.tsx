import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail, KeyRound, AlertTriangle, Store } from 'lucide-react';
import fpPromise from '@fingerprintjs/fingerprintjs';
import apiClient from '../../shared/api/client';
import { useTenantAuth } from '../context/TenantAuthContext';
import { ThemeToggle } from '../../shared/context/ThemeContext';

const loginSchema = z.object({
  shopLicenseKeyOrSlug: z.string().min(1, 'مفتاح ترخيص المغسلة مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login = () => {
  const [errorMsg, setErrorMsg] = useState('');
  const [isDeviceLocked, setIsDeviceLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useTenantAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setErrorMsg('');
    setIsDeviceLocked(false);

    try {
      let deviceFingerprint = 'fallback-device-id';
      try {
        const fp = await fpPromise.load();
        const result = await fp.get();
        if (result?.visitorId) {
          deviceFingerprint = result.visitorId;
        }
      } catch (fpErr) {
        console.warn('FingerprintJS blocked or failed, using fallback device ID:', fpErr);
        let storedFp = localStorage.getItem('rawnaq_fallback_fp');
        if (!storedFp) {
          storedFp = 'device-' + Math.random().toString(36).substring(2, 10);
          localStorage.setItem('rawnaq_fallback_fp', storedFp);
        }
        deviceFingerprint = storedFp;
      }

      const res = await apiClient.post('/api/tenant/auth/login', {
        shopLicenseKeyOrSlug: data.shopLicenseKeyOrSlug.trim(),
        email: data.email.trim(),
        password: data.password,
        deviceFingerprint
      });

      login(res.data.data.token, res.data.data.staff);
      navigate('/');
    } catch (error: any) {
      if (error.response?.data?.code === 'DEVICE_LOCKED') {
        setIsDeviceLocked(true);
      } else {
        setErrorMsg(error.response?.data?.message || error.message || 'فشل تسجيل الدخول، تأكد من صحة البيانات ومفتاح الترخيص.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative transition-colors duration-300">
      <div className="absolute top-6 left-6">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-right">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
            <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">دخول الكاشير وإدارة المغسلة</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">أدخل بيانات الحساب ومفتاح الترخيص للوصول للنظام</p>
        </div>

        {isDeviceLocked ? (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-300">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">الجهاز غير مرخص (مرتبط بجهاز آخر)</h3>
            <p className="text-red-700 dark:text-red-300/80 text-xs leading-relaxed font-semibold">
              هذا الحساب مرتبط مسبقاً بجهاز كاشير آخر. لدواعي أمنية لا يمكن تسجيل الدخول من جهاز جديد إلا بعد قيام صاحب المغسلة أو الإدارة العليا بفك ارتباط الجهاز السابق.
            </p>
            <button 
              onClick={() => setIsDeviceLocked(false)}
              className="mt-4 px-4 py-2 text-xs font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-xl hover:bg-red-200 transition-colors"
            >
              المحاولة بحساب آخر
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {errorMsg && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold p-3.5 rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-right">مفتاح ترخيص المغسلة (License Key)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Store className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    {...register('shopLicenseKeyOrSlug')}
                    className="block w-full pr-10 pl-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-right font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="أدخل رمز الترخيص المستلم من الإدارة"
                  />
                </div>
                {errors.shopLicenseKeyOrSlug && <p className="mt-1 text-xs font-bold text-rose-500">{errors.shopLicenseKeyOrSlug.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-right">البريد الإلكتروني</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    {...register('email')}
                    className="block w-full pr-10 pl-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-right font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="example@rawnaq.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs font-bold text-rose-500">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-right">كلمة المرور</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    {...register('password')}
                    type="password"
                    className="block w-full pr-10 pl-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl py-2.5 text-slate-900 dark:text-white placeholder-slate-400 text-right font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs font-bold text-rose-500">{errors.password.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center h-[52px] text-base"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'تسجيل الدخول والبدء'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
