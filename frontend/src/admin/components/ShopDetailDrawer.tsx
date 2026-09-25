import { useState } from 'react';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Key, Unlock, CalendarClock, Power, PowerOff } from 'lucide-react';
import apiClient from '../../shared/api/client';
import type { Shop } from './ShopsTable';
import { LicenseKeyModal } from './LicenseKeyModal';

interface ShopDetailDrawerProps {
  shop: Shop | null;
  onClose: () => void;
  onActionComplete: () => void;
}

export function ShopDetailDrawer({ shop, onClose, onActionComplete }: ShopDetailDrawerProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  const [showExtend, setShowExtend] = useState(false);
  const [newExpiry, setNewExpiry] = useState('');

  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [newLicenseKey, setNewLicenseKey] = useState<string | null>(null);

  if (!shop) return null;

  const handleAction = async (actionId: string, request: () => Promise<any>, onSuccess?: (res: any) => void) => {
    setLoadingAction(actionId);
    try {
      const res = await request();
      if (onSuccess) onSuccess(res);
      onActionComplete();
    } catch (err: any) {
      alert(err.message || 'فشل تنفيذ الإجراء المطلـوب');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleToggleStatus = () => {
    const nextStatus = shop.subscriptionStatus === 'active' ? 'suspended' : 'active';
    handleAction('status', () => apiClient.patch(`/api/admin/shops/${shop._id}/status`, { status: nextStatus }));
  };

  const handleExtendExpiry = () => {
    if (!newExpiry) return;
    const dateStr = new Date(newExpiry).toISOString();
    handleAction('extend', () => apiClient.patch(`/api/admin/shops/${shop._id}/expiry`, { newExpiryDate: dateStr }), () => {
      setShowExtend(false);
      setNewExpiry('');
    });
  };

  const handleUnlockDevice = () => {
    handleAction('unlock', () => apiClient.post(`/api/admin/shops/${shop._id}/unlock-device`));
  };

  const handleRevokeKey = () => {
    handleAction('revoke', () => apiClient.post(`/api/admin/shops/${shop._id}/revoke-key`), (res) => {
      setNewLicenseKey(res.data.data.licenseKey || res.data.data.shop?.licenseKey);
      setShowRevokeConfirm(false);
    });
  };

  const isSuspended = shop.subscriptionStatus === 'suspended';

  return (
    <>
      <Sheet open={!!shop} onOpenChange={(open: boolean) => !open && onClose()}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto dark:bg-slate-900 dark:border-slate-800 dark:text-white text-right">
          <SheetHeader className="text-right">
            <SheetTitle className="text-xl font-black text-slate-900 dark:text-white">{shop.name}</SheetTitle>
            <SheetDescription className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              إدارة دورة حياة المغسلة والاشتراكات وربط الأجهزة وتجديد التراخيص.
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-8">
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b pb-2 border-slate-100 dark:border-slate-800">البيانات والتفاصيل</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">حالة الاشتراك</div>
                  <div className="font-bold capitalize mt-1 text-slate-900 dark:text-white">{shop.subscriptionStatus === 'active' ? 'نشط' : shop.subscriptionStatus === 'suspended' ? 'موقوف' : 'منتهي'}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">السعة اليومية (قطعة/يوم)</div>
                  <div className="font-bold font-mono mt-1 text-slate-900 dark:text-white">{shop.dailyCapacityLimit}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">تاريخ الانتهاء</div>
                  <div className="font-bold font-mono mt-1 text-slate-900 dark:text-white">{format(new Date(shop.expiryDate), 'yyyy-MM-dd')}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">جهاز مرخص مرتبط</div>
                  <div className="font-bold mt-1 text-slate-900 dark:text-white">{shop.deviceFingerprint ? 'نعم (مرتبط)' : 'لا (غير مرتبط)'}</div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b pb-2 border-slate-100 dark:border-slate-800">الإجراءات والتحكم</h3>
              
              <div className="space-y-3">
                <Button 
                  variant={isSuspended ? "default" : "destructive"} 
                  className="w-full justify-start font-bold h-11 rounded-xl shadow-sm gap-2"
                  onClick={handleToggleStatus}
                  disabled={!!loadingAction}
                >
                  {isSuspended ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                  <span>{isSuspended ? 'إعادة تفعيل الاشتراك والخدمة' : 'إيقاف الاشتراك مؤقتاً'}</span>
                </Button>

                <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border dark:border-slate-800">
                  {!showExtend ? (
                    <Button variant="outline" className="w-full justify-start font-bold h-10 gap-2 dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => setShowExtend(true)}>
                      <CalendarClock className="h-4 w-4 text-blue-500" />
                      <span>تجديد / تمديد تاريخ الصلاحية</span>
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Label className="font-bold text-xs">تاريخ الصلاحية الجديد</Label>
                      <Input type="date" value={newExpiry} onChange={(e: any) => setNewExpiry(e.target.value)} className="bg-white dark:bg-slate-900 dark:border-slate-700 font-mono" />
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowExtend(false)} className="flex-1 font-bold">إلغاء</Button>
                        <Button size="sm" onClick={handleExtendExpiry} disabled={!newExpiry || loadingAction === 'extend'} className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold text-white">
                          تأكيد التمديد
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  variant="outline" 
                  className="w-full justify-start text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:bg-slate-800 font-bold h-11 rounded-xl gap-2 dark:border-slate-800"
                  onClick={handleUnlockDevice}
                  disabled={!shop.deviceFingerprint || !!loadingAction}
                >
                  <Unlock className="h-4 w-4" />
                  <span>فك ارتباط الجهاز (للسماح بتسجيل الدخول من جهاز كاشير جديد)</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold h-11 rounded-xl gap-2 dark:border-slate-800"
                  onClick={() => setShowRevokeConfirm(true)}
                  disabled={!!loadingAction}
                >
                  <Key className="h-4 w-4" />
                  <span>إلغاء الترخيص الحالي وإصدار مفتاح جديد</span>
                </Button>
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={showRevokeConfirm} onOpenChange={setShowRevokeConfirm}>
        <DialogContent className="dark:bg-slate-900 dark:border-slate-800 dark:text-white text-right">
          <DialogHeader className="text-right">
            <DialogTitle className="font-black text-rose-600 dark:text-rose-400">إلغاء مفتاح الترخيص؟</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              هل أنت متأكد من إلغاء مفتاح الترخيص الحالي لمغسلة <strong className="text-slate-900 dark:text-white font-bold">{shop.name}</strong>؟ 
              سيؤدي ذلك لإيقاف نظام نقطة البيع والكاشير لديهم فوراً حتى يتم استلام المفتاح الجديد.
            </p>
          </div>
          <DialogFooter className="sm:justify-start gap-2">
            <Button variant="ghost" onClick={() => setShowRevokeConfirm(false)} className="font-bold">تراجع وإلغاء</Button>
            <Button variant="destructive" onClick={handleRevokeKey} disabled={loadingAction === 'revoke'} className="font-bold bg-rose-600 hover:bg-rose-700">
              نعم، إلغاء الترخيص وإصدار جديد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LicenseKeyModal 
        open={!!newLicenseKey} 
        licenseKey={newLicenseKey || ''} 
        onClose={() => setNewLicenseKey(null)} 
      />
    </>
  );
}
