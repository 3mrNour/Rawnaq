import type { NotificationService, OrderNotificationDetails } from './NotificationService.interface.js';
import { SessionExpiredError, NotificationError, formatWhatsAppPhone, buildOrderReadyMessage } from './NotificationService.interface.js';
import { WhatsAppBaileysGateway } from './WhatsAppBaileysGateway.js';
import { WhatsAppLinkGateway } from './WhatsAppLinkGateway.js';
import { WhatsAppMetaCloudGateway } from './WhatsAppMetaCloudGateway.js';

export type { NotificationService, OrderNotificationDetails };
export {
  SessionExpiredError,
  NotificationError,
  formatWhatsAppPhone,
  buildOrderReadyMessage,
  WhatsAppBaileysGateway,
  WhatsAppLinkGateway,
  WhatsAppMetaCloudGateway,
};

export class FallbackNotificationService implements NotificationService {
  public baileys: WhatsAppBaileysGateway;
  public link: WhatsAppLinkGateway;
  public meta: WhatsAppMetaCloudGateway;

  constructor() {
    this.baileys = new WhatsAppBaileysGateway();
    this.link = new WhatsAppLinkGateway();
    this.meta = new WhatsAppMetaCloudGateway();
  }

  public async sendOrderReadyMessage(
    phone: string,
    orderNumber: string,
    shopName: string,
    details?: OrderNotificationDetails
  ): Promise<void> {
    const gatewayMode = (process.env.NOTIFICATION_GATEWAY || 'fallback').toLowerCase();

    if (gatewayMode === 'meta') {
      return this.meta.sendOrderReadyMessage(phone, orderNumber, shopName, details);
    }
    if (gatewayMode === 'link') {
      return this.link.sendOrderReadyMessage(phone, orderNumber, shopName, details);
    }
    if (gatewayMode === 'baileys') {
      return this.baileys.sendOrderReadyMessage(phone, orderNumber, shopName, details);
    }

    // Default: 'fallback' mode (MVP strategy: try Baileys first, fallback to Link Gateway if Baileys session is expired or unavailable)
    try {
      console.log('[NotificationService] Attempting delivery via primary gateway (WhatsApp Baileys)...');
      await this.baileys.sendOrderReadyMessage(phone, orderNumber, shopName, details);
    } catch (error: any) {
      console.warn(`[NotificationService] Primary gateway (Baileys) failed or unauthenticated (${error?.message || error}). Falling back to WhatsApp Link Gateway...`);
      await this.link.sendOrderReadyMessage(phone, orderNumber, shopName, details);
    }
  }
}

export const notificationService: NotificationService = new FallbackNotificationService();
