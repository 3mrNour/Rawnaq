export interface OrderNotificationDetails {
  customerName?: string;
  totalAmount?: number;
  items?: Array<{ name: string; category?: string; serviceOption?: string; finalPrice?: number }>;
}

export interface NotificationService {
  sendOrderReadyMessage(
    phone: string,
    orderNumber: string,
    shopName: string,
    details?: OrderNotificationDetails
  ): Promise<void>;
}

export function buildOrderReadyMessage(
  orderNumber: string,
  shopName: string,
  details?: OrderNotificationDetails
): string {
  const nameGreeting = details?.customerName ? ` يا ${details.customerName}` : '';

  let message = `🌟 أهلاً بك${nameGreeting} في ${shopName}! 👔\n`;
  message += `يسعدنا إبلاغك أن طلبك رقم #${orderNumber} أصبح جاهزاً للاستلام الآن! 🎉✨\n`;

  if (details?.items && details.items.length > 0) {
    message += `\n📋 تفاصيل الأصناف:\n`;

    const grouped = details.items.reduce<Record<string, { name: string; detailsText: string; count: number }>>(
      (acc, item) => {
        let detailsText = '';
        if (item.category === 'apparel') {
          detailsText = item.serviceOption === 'fullService' ? 'غسيل وكوي شامل' : 'كوي بالبخار فقط';
        } else if (item.category === 'carpet') {
          detailsText = 'سجاد';
        } else if (item.category === 'linen') {
          detailsText = 'مفروشات';
        } else {
          detailsText = 'خدمة قياسية';
        }
        const key = `${item.name}|${detailsText}`;
        if (!acc[key]) {
          acc[key] = { name: item.name, detailsText, count: 0 };
        }
        acc[key].count += 1;
        return acc;
      },
      {}
    );

    Object.values(grouped).forEach((g) => {
      message += `▪️ ${g.count} × ${g.name} (${g.detailsText})\n`;
    });
  }

  if (details?.totalAmount !== undefined && details.totalAmount !== null) {
    message += `\n💰 الإجمالي المطلوب: ${Number(details.totalAmount).toFixed(2)} ج.م\n`;
  }

  message += `\n🙏 نسعد دائماً بخدمتك ونتمنى لك يوماً رائعاً!\n📍 ${shopName}`;
  return message;
}

export function formatWhatsAppPhone(phone: string, defaultCountryCode: string = '20'): string {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');

  if (clean.startsWith('00')) {
    clean = clean.slice(2);
  }

  // If starts with 0 and is an Egyptian mobile number (010, 011, 012, 015 - 11 digits)
  if (clean.startsWith('0') && clean.length === 11 && /^01[0125]/.test(clean)) {
    clean = defaultCountryCode + clean.slice(1);
  } 
  // If 10 digits starting with 10, 11, 12, or 15 (e.g. 1121195198 because someone stripped 0)
  else if (clean.length === 10 && /^1[0125]/.test(clean)) {
    clean = defaultCountryCode + clean;
  } 
  // If starts with 0 for any other number, replace leading zeros with country code
  else if (clean.startsWith('0')) {
    clean = defaultCountryCode + clean.replace(/^0+/, '');
  }

  return clean;
}

export class SessionExpiredError extends Error {
  constructor(message: string = 'WhatsApp session expired or disconnected') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

export class NotificationError extends Error {
  constructor(message: string = 'Failed to send WhatsApp notification') {
    super(message);
    this.name = 'NotificationError';
  }
}
