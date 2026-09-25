import type { NotificationService, OrderNotificationDetails } from './NotificationService.interface.js';
import { formatWhatsAppPhone, buildOrderReadyMessage } from './NotificationService.interface.js';

export class WhatsAppLinkGateway implements NotificationService {
  public lastGeneratedUrl: string | null = null;

  public async sendOrderReadyMessage(
    phone: string,
    orderNumber: string,
    shopName: string,
    details?: OrderNotificationDetails
  ): Promise<void> {
    const cleanPhone = formatWhatsAppPhone(phone);
    const message = buildOrderReadyMessage(orderNumber, shopName, details);
    const encodedText = encodeURIComponent(message);
    
    this.lastGeneratedUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    
    console.log('\n-------------------------------------------------------------');
    console.log(`[WhatsAppLinkGateway] Order Ready Link Generated for Order #${orderNumber}:`);
    console.log(`Customer Phone: +${cleanPhone}`);
    console.log(`Click-to-Chat URL: ${this.lastGeneratedUrl}`);
    console.log('-------------------------------------------------------------\n');
  }
}
