/**
 * Every visible Arabic string on the page lives here so the copy can be reviewed
 * and translated in one pass. No em-dashes or en-dashes anywhere.
 */

export const BRAND = {
  name: 'رونق',
  wordmark: 'رونق',
  tagline: 'نظام إدارة المغاسل',
} as const;

export const CONTACT = {
  email: 'amrnour1010@gmail.com',
  /** wa.me needs the bare number: country code, no plus, no spaces. */
  whatsappNumber: '201121195198',
  whatsappDisplay: '+20 112 119 5198',
} as const;

/** Single primary CTA label. Reused verbatim in nav, hero, closing band, footer. */
export const CTA_LABEL = 'احجز عرضاً توضيحياً';

export const HERO = {
  eyebrow: 'نظام إدارة المغاسل',
  headline: ['مغسلتك كلها', 'في شاشة واحدة'],
  subtext: 'نقطة بيع، باركود لكل قطعة، وشاشة خط إنتاج تصلح للحيط. العميل بياخد إشعار واتساب أول ما الطلب يجهز.',
  primaryCta: CTA_LABEL,
  secondaryCta: 'دخول العملاء',
  secondaryHref: '/login',
  floatingChip: {
    title: 'طلب #0181 جاهز',
    body: 'العميل استلم إشعار واتساب بالتفاصيل',
  },
} as const;

export const STATEMENT = {
  headline: ['القطعة الواحدة بتمشي', 'من الباب لحد التسليم', 'وهي مختومة برقم'],
  body: 'من غير كشكول ورقية عشان تعرف القطعة فين. رقم الفاتورة، ورقم القطعة عليها، والعامل اللي ماسكها، كلهم في نفس السجل.',
} as const;

export type BentoItem = {
  eyebrow?: string;
  title: string;
  body: string;
  image?: { src: string; alt: string; width: number; height: number };
  span?: string;
  kind: 'image' | 'message' | 'text';
};

export const BENTO: BentoItem[] = [
  {
    kind: 'image',
    eyebrow: 'لوحة الطلبات',
    title: 'حالة كل طلب على البعد',
    body: 'استلم، جاهز، تم التسليم. التقديم بين الحالات بس走得 قدام، ومين حاول يرجع بطلب ورا النظام اترفض.',
    image: {
      src: '/screenshots/orders.webp',
      alt: 'لوحة طلبات رونق تعرض طلبات بحالات استلام وتجهيز وتسليم',
      width: 1440,
      height: 900,
    },
    span: 'lg:col-span-3',
  },
  {
    kind: 'message',
    eyebrow: 'إشعار العميل',
    title: 'واتساب بيوصل لوحده',
    body: 'أول ما كل القطع تخلص، الرسالة بتتبعت للعميل باسمه وبأصناف طلبه ومبلغه. لو القناة وقعت، النظام بيرجع لقناة تانية تلقائياً.',
    span: 'lg:col-span-2',
  },
  {
    kind: 'image',
    eyebrow: 'شاشة خط الإنتاج',
    title: 'باركود ورقم عامل',
    body: 'العامل يمسح رقم القطعة ويدخل الرقم السري بتاعه. القفل بيتسجل في ثانية، ومستحقات العامل بتتحسب معاه.',
    image: {
      src: '/screenshots/floor-success.webp',
      alt: 'شاشة خط إنتاج رونق بعد قفل القطعة على العامل محمود عبد الفتاح',
      width: 1440,
      height: 900,
    },
    span: 'lg:col-span-2',
  },
  {
    kind: 'image',
    eyebrow: 'مستحقات العمالة',
    title: 'كشف حساب مبني على الشغل',
    body: 'نسبة من سعر القطعة، أو مبلغ لكل قطعة، أو يومية ثابتة. سعر العامل بيتقفل وقت التسليم، فمفيش خلاف بعدين.',
    image: {
      src: '/screenshots/earnings.webp',
      alt: 'شاشة مستحقات عمالة رونق تعرض أرباح كل عامل وعدد القطع',
      width: 1440,
      height: 900,
    },
    span: 'lg:col-span-3',
  },
  {
    kind: 'image',
    eyebrow: 'كتالوج الأسعار',
    title: 'تلات أنواع خدمة بأسعار مختلفة',
    body: 'ملابس، سجاد بالمتر، ومفروشات بالساعة. أي تعديل يدوي على السعر لازم يكتب سببه، والسبب بيتطبع على فاتورة العميل.',
    image: {
      src: '/screenshots/catalogue.webp',
      alt: 'كتالوج أسعار رونق مقسم لملابس وسجاد ومفروشات',
      width: 1440,
      height: 900,
    },
    span: 'lg:col-span-2',
  },
];

/** The literal message the backend builds and sends. Source:
 *  backend/src/services/notification/NotificationService.interface.ts
 *
 * `body` is the exact text that goes over the wire, kept verbatim. The chat UI
 * reads the structured fields, so the bubble can lay out like a real message
 * without the emoji being re-parsed at render time. */
export const WHATSAPP_MESSAGE = {
  sender: 'مغسلة رونق',
  recipient: 'هبة اعتماد',
  timestamp: '١١:٤٢ ص',
  greeting: '🌟 أهلاً بك يا هبة اعتماد في مغسلة رونق! 👔',
  headline: 'يسعدنا إبلاغك أن طلبك رقم #0181 أصبح جاهزاً للاستلام الآن! 🎉✨',
  itemsLabel: '📋 تفاصيل الأصناف:',
  items: ['▪️ 2 × فستان (غسيل وكوي شامل)', '▪️ 2 × تيشيرت (غسيل وكوي شامل)'],
  totalLabel: '💰 الإجمالي المطلوب:',
  total: '180.00 ج.م',
  signOff: '🙏 نسعد دائماً بخدمتك ونتمنى لك يوماً رائعاً!',
  address: '📍 مغسلة رونق',
  /** Flat list of the real sent text, in order. */
  body: [
    '🌟 أهلاً بك يا هبة اعتماد في مغسلة رونق! 👔',
    'يسعدنا إبلاغك أن طلبك رقم #0181 أصبح جاهزاً للاستلام الآن! 🎉✨',
    '📋 تفاصيل الأصناف:',
    '▪️ 2 × فستان (غسيل وكوي شامل)',
    '▪️ 2 × تيشيرت (غسيل وكوي شامل)',
    '💰 الإجمالي المطلوب: 180.00 ج.م',
    '🙏 نسعد دائماً بخدمتك ونتمنى لك يوماً رائعاً!',
    '📍 مغسلة رونق',
  ],
} as const;

export type JourneyStep = {
  verb: string;
  detail: string;
  meta?: string;
};

export const JOURNEY: JourneyStep[] = [
  {
    verb: 'استلام',
    detail: 'الكاشير بيفتح طلب جديد، بيدخل صنف من الكتالوج وبيختار الخدمة، وبيحدد تاريخ التسليم.',
    meta: 'فاتورة 0185',
  },
  {
    verb: 'طباعة',
    detail: 'فاتورة للعميل، وملصق باركود لكل قطعة لحالها بالاسم ورقم القطعة وتاريخ التسليم.',
    meta: '0185-01',
  },
  {
    verb: 'توزيع',
    detail: 'العامل بيمسح رقم القطعة ويدخل الرقم السري بتاعه على شاشة الحيط. مفيش واسطة.',
    meta: 'PIN 2101',
  },
  {
    verb: 'غسيل وكوي',
    detail: 'نظامين شغل: غسيل وتنشيف، وكوي وبخار. سعر كل مقطع بيتقفل لحظة التوزيع.',
    meta: '8.00 ج.م',
  },
  {
    verb: 'تسليم',
    detail: 'أول ما آخر قطعة تتحجز الطلب بيبقى جاهز والعميل بياخد إشعار واتساب. بعد التوريد بيتقفل الحساب.',
    meta: 'تم التسليم',
  },
];

export const PLATFORM = {
  headline: 'من جهة واحدة، كل المغاسل',
  body: 'كل مغسلة ليها اشتراك وحالة ومفتاح ترخيص. تقدر توقفها، تجدد ليها، أو تبطّل المفتاح وتصدر واحد جديد، كلها من نفس اللوحة.',
  points: [
    { label: 'مؤشرات فورية', value: 'نشط، موقوف، منتهي، وبيخلص خلال 7 أيام' },
    { label: 'تحكم في الاشتراك', value: 'إيقاف، تفعيل، وتجديد تاريخ الانتهاء' },
    { label: 'مفتاح الترخيص', value: 'إصدار وبطالة. المفتاح بيتشال من المتجر أول ما تبطّله' },
    { label: 'فتح الجهاز', value: 'لو العميل غيّر موبايله، بتفتح له الجهاز من اللوحة' },
  ],
} as const;

export type ProofStat = { value: number; unit?: string; label: string; note: string };

export const PROOF: ProofStat[] = [
  { value: 3, label: 'حالات للطلب', note: 'استلم، جاهز، تم التسليم' },
  { value: 3, label: 'قنوات إشعار', note: 'بتترجع لوحدها لو واحدة وقعت' },
  { value: 3, label: 'طرق محاسبة', note: 'نسبة، لكل قطعة، أو يومية' },
  { value: 2, label: 'صلاحيات دخول', note: 'مالك وكاشير، والعمالة برقم سري' },
];

export const SECURITY = {
  headline: 'الاشتراك بيتحكم في كل حاجة',
  body: 'كل استعلام بينتهي بمعرف المغسلة اللي في التذاكر، مش حد بيبعته. والجهاز بيتقفل على أول ماهاش يفتح اشتراكه.',
  items: [
    {
      title: 'مفتاح ترخيص لكل مغسلة',
      body: 'بيتولّد تلقائياً وبيظهر مرة واحدة بس وقت الإنشاء، وبعدها بيتعرض مخفي.',
    },
    {
      title: 'قفل الجهاز',
      body: 'أول دخول بيقفل النظام على جهاز واحد. أي جهاز تاني يطلع رفض، ولحد ما الأدمن يفتحه.',
    },
    {
      title: 'فصل كامل بين المغاسل',
      body: 'الطلبات والموظفين والأسعار ليهم معرّف مغسلة واحد. مفيش استعلام بيعدّي حدود المغسلة.',
    },
    {
      title: 'حالة الاشتراك على كل المسارات',
      body: 'اشتراك موقوف أو منتهي بيقفل المسارات كلها برمز واحد واضح.',
    },
  ],
} as const;

export const CLOSING = {
  headline: ['خلّي المغسلتك', 'بتشتغل لوحدها'],
  body: 'عرض توضيحي على نظامك الحالي: نتكلم في نقطة البيع، وخط الإنتاج، وإشعارات واتساب.',
} as const;

export const FOOTER = {
  blurb: 'رونق نظام إدارة مغاسل وسلاسل عناية بالملابس. عربي بالكامل، وبشتغل على أي جهاز في المحل.',
  columns: [
    {
      title: 'المنتج',
      links: [
        { label: 'نقطة البيع', href: '#capabilities' },
        { label: 'خط الإنتاج', href: '#journey' },
        { label: 'لوحة المنصة', href: '#platform' },
        { label: 'كتالوج الأسعار', href: '#capabilities' },
      ],
    },
    {
      title: 'الحساب',
      links: [
        { label: 'دخول العملاء', href: '/login' },
        { label: 'دخول الإدارة', href: '/admin/login' },
        { label: CTA_LABEL, href: `mailto:${CONTACT.email}` },
      ],
    },
  ],
  licenseNote: 'صيغة مفتاح الترخيص: RWNQ-XXXX-XXXX',
  rights: 'كل الحقوق محفوظة.',
} as const;
