import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import apiClient from '../../shared/api/client';
import { LicenseKeyModal } from '../components/LicenseKeyModal';

const createShopSchema = z.object({
  name: z.string().min(2, 'اسم المغسلة مطلوب (حرفين على الأقل)'),
  dailyCapacityLimit: z.coerce.number().min(1, 'السعة اليومية يجب أن تكون 1 على الأقل'),
  expiryDate: z.string().min(1, 'تاريخ انتهاء الترخيص مطلوب'),
  priceCatalogue: z.array(z.discriminatedUnion('category', [
    z.object({
      category: z.literal('apparel'),
      name: z.string().min(1, 'اسم الصنف مطلوب'),
      price: z.object({
        fullService: z.coerce.number().min(0, 'مطلوب'),
        ironOnly: z.coerce.number().min(0, 'مطلوب'),
      }),
    }),
    z.object({
      category: z.literal('carpet'),
      name: z.string().min(1, 'اسم الصنف مطلوب'),
      pricePerMeter: z.coerce.number().min(0, 'مطلوب'),
    }),
    z.object({
      category: z.literal('linen'),
      name: z.string().min(1, 'اسم الصنف مطلوب'),
      price: z.coerce.number().min(0, 'مطلوب'),
    }),
  ])).min(1, 'يجب إضافة صنف واحد على الأقل لكشوف الأسعار'),
});

type CreateShopForm = z.infer<typeof createShopSchema>;

export function CreateShop() {
  const navigate = useNavigate();
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<CreateShopForm>({
    // @ts-ignore
    resolver: zodResolver(createShopSchema),
    defaultValues: {
      name: '',
      dailyCapacityLimit: 100,
      expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      priceCatalogue: [{ category: 'apparel', name: 'قميص رجالي', price: { fullService: 50, ironOnly: 20 } }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'priceCatalogue',
  });

  const catalogueValues = watch('priceCatalogue');

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        expiryDate: new Date(data.expiryDate).toISOString()
      };
      const res = await apiClient.post('/api/admin/shops', payload);
      setCreatedKey(res.data.data.licenseKey || res.data.data.shop?.licenseKey);
    } catch (err: any) {
      console.error('Failed to create shop:', err);
      alert(err.message || 'فشل إنشاء المغسلة، تأكد من صحة البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setCreatedKey(null);
    navigate('/admin/shops');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-12 transition-colors">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shadow-sm">
        <Button variant="ghost" onClick={() => navigate('/admin/shops')} className="gap-2 font-bold dark:hover:bg-slate-800">
          <ArrowRight className="h-4 w-4" /> العودة لقائمة المغاسل
        </Button>
      </header>

      <main className="p-6 max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">إضافة مغسلة جديدة والاشتراك</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">توليد مفتاح ترخيص جديد وتهيئة السعة اليومية وقائمة الأسعار الابتدائية</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm">
            <CardHeader><CardTitle className="text-lg font-bold">البيانات الأساسية للمغسلة</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 text-right">
                <Label className="font-bold">اسم المغسلة</Label>
                <Input {...register('name')} placeholder="مثال: مغسلة النظافة الفائقة" className="bg-white dark:bg-slate-950 dark:border-slate-800" />
                {errors.name && <p className="text-xs text-red-500 font-bold">{errors.name.message}</p>}
              </div>
              <div className="space-y-2 text-right">
                <Label className="font-bold">السعة اليومية القصوى (قطعة/يوم)</Label>
                <Input type="number" {...register('dailyCapacityLimit')} className="bg-white dark:bg-slate-950 dark:border-slate-800 font-mono" />
                {errors.dailyCapacityLimit && <p className="text-xs text-red-500 font-bold">{errors.dailyCapacityLimit.message}</p>}
              </div>
              <div className="space-y-2 text-right">
                <Label className="font-bold">تاريخ انتهاء الصلاحية</Label>
                <Input type="date" {...register('expiryDate')} className="bg-white dark:bg-slate-950 dark:border-slate-800 font-mono" />
                {errors.expiryDate && <p className="text-xs text-red-500 font-bold">{errors.expiryDate.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">كتالوج الأسعار والخدمات</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">الأسعار مقدرة بالجنيه المصري (ج.م)</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ category: 'apparel', name: 'صنف جديد', price: { fullService: 30, ironOnly: 15 } })} className="font-bold gap-2 dark:border-slate-700">
                <Plus className="h-4 w-4" /> إضافة صنف
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.priceCatalogue?.root && <p className="text-xs text-red-500 font-bold">{errors.priceCatalogue.root.message}</p>}
              
              {fields.map((field, index) => {
                const cat = catalogueValues[index]?.category || 'apparel';
                
                return (
                  <div key={field.id} className="flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 relative">
                    <div className="grid gap-4 flex-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 text-right">
                          <Label className="font-bold text-xs">التصنيف</Label>
                          <Select 
                            value={cat} 
                            onValueChange={(val: 'apparel'|'carpet'|'linen') => {
                              const defaultForCat = val === 'apparel' 
                                ? { category: 'apparel', name: catalogueValues[index].name, price: { fullService: 0, ironOnly: 0 } }
                                : val === 'carpet'
                                ? { category: 'carpet', name: catalogueValues[index].name, pricePerMeter: 0 }
                                : { category: 'linen', name: catalogueValues[index].name, price: 0 };
                              
                              // @ts-ignore
                              append(defaultForCat);
                              remove(index);
                            }}
                          >
                            <SelectTrigger className="bg-white dark:bg-slate-900 dark:border-slate-700"><SelectValue /></SelectTrigger>
                            <SelectContent className="dark:bg-slate-900 dark:border-slate-700">
                              <SelectItem value="apparel">ملابس (Apparel)</SelectItem>
                              <SelectItem value="carpet">سجاد (Carpet)</SelectItem>
                              <SelectItem value="linen">مفروشات (Linen)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 text-right">
                          <Label className="font-bold text-xs">اسم الصنف</Label>
                          <Input {...register(`priceCatalogue.${index}.name`)} placeholder="مثال: قميص، بدلة، سجادة 2×3" className="bg-white dark:bg-slate-900 dark:border-slate-700" />
                          {errors.priceCatalogue?.[index]?.name && <p className="text-xs text-red-500 font-bold">{errors.priceCatalogue[index]?.name?.message}</p>}
                        </div>
                      </div>

                      {cat === 'apparel' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2 text-right">
                            <Label className="font-bold text-xs">سعر غسيل وكوي (ج.م)</Label>
                            <Input type="number" step="0.5" {...register(`priceCatalogue.${index}.price.fullService`)} className="bg-white dark:bg-slate-900 dark:border-slate-700 font-mono font-bold text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="space-y-2 text-right">
                            <Label className="font-bold text-xs">سعر كوي فقط (ج.م)</Label>
                            <Input type="number" step="0.5" {...register(`priceCatalogue.${index}.price.ironOnly`)} className="bg-white dark:bg-slate-900 dark:border-slate-700 font-mono font-bold text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                      )}

                      {cat === 'carpet' && (
                        <div className="space-y-2 w-1/2 pl-2 text-right">
                          <Label className="font-bold text-xs">سعر المتر المربع (ج.م)</Label>
                          <Input type="number" step="0.5" {...register(`priceCatalogue.${index}.pricePerMeter`)} className="bg-white dark:bg-slate-900 dark:border-slate-700 font-mono font-bold text-emerald-600 dark:text-emerald-400" />
                        </div>
                      )}

                      {cat === 'linen' && (
                        <div className="space-y-2 w-1/2 pl-2 text-right">
                          <Label className="font-bold text-xs">السعر الثابت للقطعة (ج.م)</Label>
                          <Input type="number" step="0.5" {...register(`priceCatalogue.${index}.price`)} className="bg-white dark:bg-slate-900 dark:border-slate-700 font-mono font-bold text-emerald-600 dark:text-emerald-400" />
                        </div>
                      )}

                    </div>
                    
                    <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 mt-6" onClick={() => remove(index)}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/shops')} className="font-bold px-6 h-11 dark:border-slate-700">إلغاء</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 font-bold px-8 h-11 shadow-lg shadow-blue-600/20">{loading ? 'جاري الإنشاء والحفظ...' : 'إنشاء المغسلة والترخيص'}</Button>
          </div>
        </form>
      </main>

      <LicenseKeyModal 
        open={!!createdKey} 
        licenseKey={createdKey || ''} 
        onClose={handleModalClose} 
      />
    </div>
  );
}
