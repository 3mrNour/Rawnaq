import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scan, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  Delete, 
  RotateCcw, 
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';
import apiClient from '../../../shared/api/client';

interface SuccessData {
  workerName: string;
  itemName: string;
  itemId: string;
  autoTransitionedToReady: boolean;
}

export const ScanScreen: React.FC = () => {
  const [itemId, setItemId] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const itemIdInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (status === 'idle' && itemIdInputRef.current) {
      itemIdInputRef.current.focus();
    }
  }, [status]);

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('button') && status === 'idle' && itemIdInputRef.current) {
      itemIdInputRef.current.focus();
    }
  };

  const handleKeypadPress = (val: string) => {
    if (status !== 'idle') return;

    if (val === 'clear') {
      setPinCode('');
    } else if (val === 'backspace') {
      setPinCode((prev) => prev.slice(0, -1));
    } else if (pinCode.length < 4) {
      const nextPin = pinCode + val;
      setPinCode(nextPin);
      if (nextPin.length === 4 && itemId.trim().length > 0) {
        submitAssignment(itemId.trim(), nextPin);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (itemId.trim().length > 0 && pinCode.length === 4) {
        submitAssignment(itemId.trim(), pinCode);
      }
    }
  };

  const submitAssignment = async (targetItemId: string, targetPin: string) => {
    if (!targetItemId || targetPin.length !== 4 || status === 'loading') return;

    setStatus('loading');
    setErrorMsg(null);

    try {
      const res = await apiClient.post('/api/tenant/assignments', {
        itemId: targetItemId,
        pinCode: targetPin,
      });

      const data = res.data.data;
      setSuccessData({
        workerName: data.staff.name,
        itemName: data.item.name,
        itemId: data.item.itemId || targetItemId,
        autoTransitionedToReady: data.autoTransitionedToReady || false,
      });
      setStatus('success');

      setTimeout(() => {
        resetForNextScan();
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'فشل تسجيل العامل للقطعة';
      setErrorMsg(msg);
      setStatus('error');

      setTimeout(() => {
        setStatus((current) => {
          if (current === 'error') {
            setPinCode('');
            return 'idle';
          }
          return current;
        });
      }, 5000);
    }
  };

  const resetForNextScan = () => {
    setItemId('');
    setPinCode('');
    setSuccessData(null);
    setErrorMsg(null);
    setStatus('idle');
  };

  const dismissError = () => {
    setPinCode('');
    setErrorMsg(null);
    setStatus('idle');
  };

  // ---------------------------------------------------------------------------
  // FULL-SCREEN SUCCESS STATE
  // ---------------------------------------------------------------------------
  if (status === 'success' && successData) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-950 flex flex-col items-center justify-center p-8 select-none animate-in fade-in duration-300 text-right">
        <div className="max-w-4xl w-full flex flex-col items-center text-center space-y-8 bg-emerald-900/20 border-2 border-emerald-500/40 p-12 rounded-3xl shadow-[0_0_100px_rgba(16,185,129,0.25)] backdrop-blur-md">
          <div className="w-32 h-32 rounded-full bg-emerald-500/20 border-4 border-emerald-400 flex items-center justify-center animate-bounce shadow-[0_0_40px_rgba(52,211,153,0.5)]">
            <CheckCircle2 className="w-20 h-20 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-black tracking-wider text-emerald-400 drop-shadow-md">
              تم التسجيل والربط بنجاح!
            </h1>
            <p className="text-2xl text-emerald-200/80 font-bold tracking-wide">
              تم قفل القطعة واحتساب المستحقات للعامل
            </p>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-6 flex flex-col items-center justify-center shadow-inner">
              <span className="text-xl text-slate-400 font-bold uppercase tracking-wider mb-1">اسم العامل</span>
              <span className="text-4xl md:text-5xl font-extrabold text-white truncate w-full">
                {successData.workerName}
              </span>
            </div>

            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-6 flex flex-col items-center justify-center shadow-inner">
              <span className="text-xl text-slate-400 font-bold uppercase tracking-wider mb-1">القطعة المسجلة</span>
              <span className="text-4xl md:text-5xl font-extrabold text-cyan-400 truncate w-full">
                {successData.itemName} <span className="text-2xl text-slate-300">#{successData.itemId}</span>
              </span>
            </div>
          </div>

          {successData.autoTransitionedToReady && (
            <div className="w-full bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-500/20 border-2 border-amber-400/80 rounded-2xl p-5 flex items-center justify-center space-x-3 space-x-reverse text-amber-300 shadow-[0_0_30px_rgba(251,191,36,0.2)] animate-pulse">
              <Sparkles className="w-8 h-8 flex-shrink-0 text-amber-400" />
              <span className="text-2xl font-bold tracking-wide">
                جميع قطع الطلب اكتملت — الفاتورة جاهزة الآن! (تم إرسال إشعار واتساب للعميل)
              </span>
              <Sparkles className="w-8 h-8 flex-shrink-0 text-amber-400" />
            </div>
          )}

          <div className="w-full pt-6 flex flex-col items-center space-y-3">
            <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden border border-slate-700">
              <div className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full w-full animate-[shrink_2s_linear_forwards]" />
            </div>
            <span className="text-2xl font-bold text-slate-400 animate-pulse">
              إعادة التعيين للقطعة التالية خلال ثانيتين...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // FULL-SCREEN ERROR STATE
  // ---------------------------------------------------------------------------
  if (status === 'error' && errorMsg) {
    return (
      <div 
        onClick={dismissError}
        className="fixed inset-0 z-50 bg-gradient-to-br from-red-950 via-slate-950 to-slate-950 flex flex-col items-center justify-center p-8 select-none animate-in fade-in duration-200 cursor-pointer text-right"
      >
        <div className="max-w-4xl w-full flex flex-col items-center text-center space-y-10 bg-red-900/30 border-4 border-red-500/80 p-16 rounded-3xl shadow-[0_0_120px_rgba(239,68,68,0.4)] backdrop-blur-lg">
          <div className="w-36 h-36 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.6)]">
            <AlertOctagon className="w-24 h-24 text-red-500 animate-spin" style={{ animationDuration: '6s' }} />
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-black tracking-widest text-red-500 drop-shadow-lg">
              تم رفض التسجيل
            </h1>
            <p className="text-2xl text-red-200/80 font-bold tracking-wide">
              يرجى التأكد من باركود القطعة أو صحة رمز PIN للعامل
            </p>
          </div>

          <div className="w-full bg-slate-950/90 border-2 border-red-500/50 rounded-2xl p-8 shadow-inner">
            <span className="text-2xl text-slate-400 font-bold uppercase tracking-wider block mb-2">
              تفاصيل الخطأ
            </span>
            <div className="text-3xl md:text-4xl font-extrabold text-white tracking-wide leading-tight break-words">
              {errorMsg}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismissError();
            }}
            className="w-full bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-3xl md:text-4xl py-6 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.5)] border-2 border-red-400 transition-all transform flex items-center justify-center space-x-4 space-x-reverse"
          >
            <RotateCcw className="w-10 h-10" />
            <span>إخفاء ومسح القطعة التالية</span>
          </button>
          
          <span className="text-xl text-slate-400 font-bold">
            (اضغط في أي مكان على الشاشة للمتابعة فوراً)
          </span>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN KIOSK SCAN SCREEN
  // ---------------------------------------------------------------------------
  return (
    <div 
      onClick={handleContainerClick}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-8 select-none font-sans text-right"
    >
      {/* Top Bar / Branding */}
      <header className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-3xl px-6 py-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
            <Scan className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h1 className="text-2xl font-black tracking-wider text-white">شاشة رونق لخط الإنتاج والمصنع</h1>
              <span className="bg-cyan-500/20 text-cyan-400 text-xs font-bold px-3 py-0.5 rounded-full border border-cyan-500/30 uppercase tracking-widest">
                شاشة حائطية
              </span>
            </div>
            <p className="text-sm text-slate-400 font-bold">نظام تسجيل وتتبع قطع الغسيل والكوي</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 space-x-reverse">
          <div className="hidden sm:flex items-center space-x-2 space-x-reverse bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-slate-300">
            <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="text-xl font-mono font-bold tracking-wider">
              {currentTime.toLocaleTimeString('ar-EG', { hour12: false })}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/pos')}
            className="flex items-center space-x-2 space-x-reverse bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white font-bold px-5 py-3 rounded-2xl border border-slate-700 transition-all text-base"
            title="العودة لنظام نقطة البيع"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="hidden md:inline font-bold">خروج من الشاشة</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Right Item ID / Left PIN Keypad in RTL */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 my-6 items-stretch">
        {/* Item ID Entry */}
        <section className="lg:col-span-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 flex flex-col justify-between shadow-xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-cyan-500 to-blue-600" />
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold tracking-widest text-cyan-400 uppercase flex items-center space-x-2 space-x-reverse">
                <span className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-sm font-black">1</span>
                <span>امسح الباركود أو أدخل رقم القطعة</span>
              </span>
              {itemId && (
                <button
                  type="button"
                  onClick={() => {
                    setItemId('');
                    itemIdInputRef.current?.focus();
                  }}
                  className="text-slate-400 hover:text-red-400 flex items-center space-x-1 space-x-reverse text-sm font-bold transition-colors bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>مسح الرقم</span>
                </button>
              )}
            </div>

            <div className="relative">
              <input
                ref={itemIdInputRef}
                type="text"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="امسح باركود القطعة..."
                className="w-full bg-slate-950 border-4 border-slate-800 focus:border-cyan-500 rounded-2xl py-6 px-8 text-4xl md:text-5xl font-mono font-black tracking-wider text-white placeholder:text-slate-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 transition-all shadow-inner text-center"
              />
              <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                <Scan className={`w-12 h-12 ${itemId ? 'text-cyan-400 animate-pulse' : 'text-slate-700'}`} />
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
              <div className="flex items-center space-x-3 space-x-reverse text-slate-300 font-bold text-lg">
                <Lock className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                <span>جاهز لاستقبال قارئ الباركود (Scanner)</span>
              </div>
              <p className="text-base text-slate-400 leading-relaxed font-medium">
                قم بتوجيه جهاز قارئ الباركود نحو ملصق القطعة. سيتم كتابة رقم القطعة تلقائياً هنا، أو يمكنك كتابته يدوياً باستخدام لوحة المفاتيح ثم إدخال رمز العامل.
              </p>
            </div>
          </div>

          {/* Live Status indicator */}
          <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between text-base font-bold text-slate-400">
            <span>القطعة المحددة حالياً:</span>
            <span className="text-2xl font-mono font-black text-white bg-slate-950 px-5 py-2 rounded-xl border border-slate-800">
              {itemId || '— لم يتم تحديد قطعة —'}
            </span>
          </div>
        </section>

        {/* Numeric Keypad for PIN */}
        <section className="lg:col-span-6 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 flex flex-col justify-between shadow-xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-blue-600 to-indigo-600" />

          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold tracking-widest text-blue-400 uppercase flex items-center space-x-2 space-x-reverse">
                <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-black">2</span>
                <span>أدخل رمز العامل (4 أرقام PIN)</span>
              </span>
              <span className="text-sm font-mono font-bold text-slate-400 bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700">
                {pinCode.length} من 4 أرقام
              </span>
            </div>

            {/* PIN Display Boxes */}
            <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto w-full my-4" style={{ direction: 'ltr' }}>
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = idx < pinCode.length;
                const isNext = idx === pinCode.length;
                return (
                  <div
                    key={idx}
                    className={`h-20 sm:h-24 rounded-2xl flex items-center justify-center border-2 transition-all transform ${
                      isFilled
                        ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-105'
                        : isNext
                        ? 'bg-slate-950 border-blue-500/60 animate-pulse'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    {isFilled ? (
                      <span className="w-6 h-6 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,1)]" />
                    ) : (
                      <span className="text-slate-800 font-mono text-2xl">•</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Touch Keypad Grid (3x4) */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto w-full flex-1" style={{ direction: 'ltr' }}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeypadPress(num)}
                  disabled={status === 'loading'}
                  className="bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-600 active:scale-95 text-white font-extrabold text-3xl sm:text-4xl h-20 sm:h-22 rounded-2xl border border-slate-700/80 shadow-lg transition-all flex items-center justify-center select-none"
                >
                  {num}
                </button>
              ))}

              {/* Clear Key */}
              <button
                type="button"
                onClick={() => handleKeypadPress('clear')}
                disabled={status === 'loading' || pinCode.length === 0}
                className="bg-red-950/40 hover:bg-red-900/60 active:bg-red-700 active:scale-95 text-red-400 font-bold text-xl sm:text-2xl h-20 sm:h-22 rounded-2xl border border-red-800/50 shadow-lg transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none select-none uppercase tracking-wider font-sans"
              >
                مسح
              </button>

              {/* Zero Key */}
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                disabled={status === 'loading'}
                className="bg-slate-800/90 hover:bg-slate-700 active:bg-cyan-600 active:scale-95 text-white font-extrabold text-3xl sm:text-4xl h-20 sm:h-22 rounded-2xl border border-slate-700/80 shadow-lg transition-all flex items-center justify-center select-none"
              >
                0
              </button>

              {/* Backspace Key */}
              <button
                type="button"
                onClick={() => handleKeypadPress('backspace')}
                disabled={status === 'loading' || pinCode.length === 0}
                className="bg-slate-800/90 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-slate-300 h-20 sm:h-22 rounded-2xl border border-slate-700/80 shadow-lg transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none select-none"
              >
                <Delete className="w-8 h-8" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Action Button */}
      <footer className="mt-4">
        <button
          type="button"
          onClick={() => submitAssignment(itemId.trim(), pinCode)}
          disabled={!itemId.trim() || pinCode.length !== 4 || status === 'loading'}
          className={`w-full h-24 rounded-3xl font-black text-3xl sm:text-4xl tracking-widest uppercase transition-all transform flex items-center justify-center space-x-4 space-x-reverse shadow-2xl border-2 ${
            !itemId.trim() || pinCode.length !== 4
              ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
              : status === 'loading'
              ? 'bg-blue-600 text-white border-blue-400 animate-pulse cursor-wait'
              : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 active:scale-[0.99] text-slate-950 border-white shadow-[0_0_40px_rgba(6,182,212,0.5)]'
          }`}
        >
          {status === 'loading' ? (
            <>
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
              <span>جاري التحقق والتسجيل...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-10 h-10" />
              <span>تأكيد تسجيل القطعة للعامل</span>
            </>
          )}
        </button>
      </footer>
    </div>
  );
};
