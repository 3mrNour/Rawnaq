import { useEffect, useState, useCallback } from 'react';
import apiClient from '../../shared/api/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export interface Shop {
  _id: string;
  name: string;
  licenseKey: string;
  subscriptionStatus: 'active' | 'suspended' | 'expired';
  dailyCapacityLimit: number;
  expiryDate: string;
  deviceFingerprint: string | null;
}

export function ShopsTable({
  refreshKey,
  onRowClick,
}: {
  refreshKey: number;
  onRowClick: (shop: Shop) => void;
}) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<string>('all');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch shops
  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (status !== 'all') params.append('status', status);

      const res = await apiClient.get(`/api/admin/shops?${params.toString()}`);
      setShops(res.data.data);
    } catch (err) {
      console.error('Failed to fetch shops', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, refreshKey]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const getStatusBadge = (status: Shop['subscriptionStatus']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 font-bold px-2.5 py-0.5">نشط (Active)</Badge>;
      case 'suspended':
        return <Badge variant="destructive" className="font-bold px-2.5 py-0.5">موقوف (Suspended)</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="font-bold px-2.5 py-0.5">منتهي (Expired)</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const maskLicenseKey = (key: string) => {
    if (!key) return '';
    const parts = key.split('-');
    if (parts.length < 2) return '****';
    return `****-${parts[parts.length - 1]}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="بحث عن مغسلة باسم أو رمز الترخيص..."
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
          className="max-w-sm bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px] bg-white dark:bg-slate-900 dark:border-slate-800 dark:text-white">
            <SelectValue placeholder="فلترة بحسب الحالة" />
          </SelectTrigger>
          <SelectContent className="dark:bg-slate-900 dark:border-slate-800 dark:text-white">
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="active">نشط (Active)</SelectItem>
            <SelectItem value="suspended">موقوف (Suspended)</SelectItem>
            <SelectItem value="expired">منتهي (Expired)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">اسم المغسلة</TableHead>
              <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">مفتاح الترخيص (License Key)</TableHead>
              <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">حالة الاشتراك</TableHead>
              <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">السعة اليومية (قطعة/يوم)</TableHead>
              <TableHead className="text-left font-bold text-slate-700 dark:text-slate-300">تاريخ انتهاء الترخيص</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-slate-500 font-medium">
                  جاري تحميل قائمة المغاسل من قاعدة البيانات...
                </TableCell>
              </TableRow>
            ) : shops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-slate-500 font-medium">
                  لا توجد مغاسل مطابقة لخيارات البحث والحالة.
                </TableCell>
              </TableRow>
            ) : (
              shops.map((shop) => (
                <TableRow
                  key={shop._id}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  onClick={() => onRowClick(shop)}
                >
                  <TableCell className="font-bold text-slate-900 dark:text-white">{shop.name}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {maskLicenseKey(shop.licenseKey)}
                  </TableCell>
                  <TableCell>{getStatusBadge(shop.subscriptionStatus)}</TableCell>
                  <TableCell className="font-mono font-bold text-slate-700 dark:text-slate-300">{shop.dailyCapacityLimit} قطعة</TableCell>
                  <TableCell className="text-left font-mono text-sm text-slate-600 dark:text-slate-400">
                    {format(new Date(shop.expiryDate), 'yyyy-MM-dd')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
