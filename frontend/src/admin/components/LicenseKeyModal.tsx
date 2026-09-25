import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Copy, Check, KeyRound } from 'lucide-react';

interface LicenseKeyModalProps {
  licenseKey: string;
  open: boolean;
  onClose: () => void;
}

export function LicenseKeyModal({ licenseKey, open, onClose }: LicenseKeyModalProps) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val && confirmed) onClose();
    }}>
      <DialogContent className="sm:max-w-md dark:bg-slate-900 dark:border-slate-800 dark:text-white">
        <DialogHeader className="text-right">
          <div className="flex items-center gap-2 mb-1 text-emerald-500">
            <KeyRound className="w-5 h-5" />
            <DialogTitle className="text-lg font-black">تم توليد مفتاح الترخيص بنجاح</DialogTitle>
          </div>
          <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium text-xs leading-relaxed">
            تنبيه هام: هذه هي المرة الوحيدة التي يظهر فيها مفتاح الترخيص بشكل كامل. يرجى نسخه فوراً وحفظه في مكان آمن لتسليمه لصاحب المغسلة.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-sm">
            <span className="font-bold text-slate-800 dark:text-amber-400 select-all tracking-wider">{licenseKey}</span>
            <Button size="icon" variant="ghost" onClick={handleCopy} className="h-9 w-9 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">
              {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-3 rounded-xl">
          <input 
            type="checkbox" 
            id="confirm" 
            checked={confirmed} 
            onChange={(e) => setConfirmed(e.target.checked)} 
            className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="confirm"
            className="text-xs font-bold text-amber-800 dark:text-amber-300 leading-tight cursor-pointer select-none"
          >
            أؤكد أنني قمت بنسخ وحفظ مفتاح الترخيص في مكان آمن
          </label>
        </div>

        <DialogFooter className="sm:justify-start pt-2">
          <Button type="button" variant="default" onClick={onClose} disabled={!confirmed} className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 shadow-lg shadow-blue-600/20">
            إتمام وإغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
