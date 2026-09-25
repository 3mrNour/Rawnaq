import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import apiClient from '../../shared/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '../../shared/context/ThemeContext';
import { ShieldAlert } from 'lucide-react';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiClient.post('/api/admin/auth/login', { email, password });
      login(res.data.data.token);
      navigate('/admin/shops');
    } catch (err: any) {
      if (err.statusCode === 401 || err.response?.status === 401) {
        setError('بيانات الدخول غير صحيحة، تأكد من البريد وكلمة المرور');
      } else {
        setError('حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative transition-colors duration-300">
      <div className="absolute top-6 left-6">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-[420px] shadow-xl dark:border-slate-800 dark:bg-slate-900/90 backdrop-blur-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            بوابة الإدارة العليا (SuperAdmin)
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            أدخل بيانات الاعتماد للوصول إلى لوحة التحكم المركزية لمنصة رونق
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-right">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
                placeholder="admin@rawnaq.com"
                className="text-right font-mono bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2 text-right">
              <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-bold text-sm">
                كلمة المرور
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required
                className="text-right font-mono bg-white dark:bg-slate-950 dark:border-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 rounded-xl text-xs text-red-600 dark:text-red-400 font-bold text-center animate-in fade-in">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-2">
            <Button 
              type="submit" 
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all" 
              disabled={loading}
            >
              {loading ? 'جاري التحقق والدخول...' : 'تسجيل الدخول'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
