import type { NotificationService, OrderNotificationDetails } from './NotificationService.interface.js';
import { NotificationError, formatWhatsAppPhone, buildOrderReadyMessage } from './NotificationService.interface.js';

export class WhatsAppMetaCloudGateway implements NotificationService {
  private phoneNumberId: string;
  private accessToken: string;
  private templateName: string;

  constructor(
    phoneNumberId?: string,
    accessToken?: string,
    templateName: string = 'order_ready_pickup'
  ) {
    this.phoneNumberId = phoneNumberId || process.env.META_PHONE_NUMBER_ID || '';
    this.accessToken = accessToken || process.env.META_ACCESS_TOKEN || '';
    this.templateName = templateName;
  }

  public async sendOrderReadyMessage(
    phone: string,
    orderNumber: string,
    shopName: string,
    details?: OrderNotificationDetails
  ): Promise<void> {
    const cleanPhone = formatWhatsAppPhone(phone);

    if (!this.phoneNumberId || !this.accessToken) {
      console.warn('[WhatsAppMetaCloudGateway] Missing META_PHONE_NUMBER_ID or META_ACCESS_TOKEN. Simulating Cloud API dispatch.');
      const simulatedText = buildOrderReadyMessage(orderNumber, shopName, details);
      console.log(`[WhatsAppMetaCloudGateway Sim] To: +${cleanPhone}\nSimulated Message:\n${simulatedText}`);
      return;
    }

    const url = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'template',
      template: {
        name: this.templateName,
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: orderNumber },
              { type: 'text', text: shopName },
            ],
          },
        ],
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Meta Cloud API responded with ${response.status}: ${errorData}`);
      }

      console.log(`[WhatsAppMetaCloudGateway] Successfully dispatched order ready template to +${cleanPhone} via Meta Cloud API.`);
    } catch (error: any) {
      throw new NotificationError(`Meta Cloud Gateway error: ${error?.message || error}`);
    }
  }
}
