import fs from 'fs';
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import type { NotificationService, OrderNotificationDetails } from './NotificationService.interface.js';
import { SessionExpiredError, NotificationError, formatWhatsAppPhone, buildOrderReadyMessage } from './NotificationService.interface.js';

export class WhatsAppBaileysGateway implements NotificationService {
  private socket: any = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private authFolder: string;

  constructor(authFolder: string = './.auth_info_baileys') {
    this.authFolder = authFolder;
    // Eagerly initialize WhatsApp connection in the background on startup so it's ready before the first order
    this.init().catch((err) => {
      console.error('[WhatsAppBaileysGateway] Eager background init failed:', err);
    });
  }

  private async waitForConnection(timeoutMs: number = 15000): Promise<boolean> {
    if (this.isConnected && this.socket) return true;

    if (!this.isConnecting && (!this.socket || !this.isConnected)) {
      await this.init();
    }

    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      if (this.isConnected && this.socket) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return this.isConnected && this.socket;
  }

  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionAttempts: number = 0;

  public async init(): Promise<void> {
    if (this.isConnected || this.isConnecting) return;
    this.isConnecting = true;

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);

      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }) as any,
        browser: ['Ubuntu', 'Chrome', '20.0.04'], // Helps prevent Connection Failure on some WhatsApp web versions
      });

      this.socket.ev.on('creds.update', saveCreds);

      this.socket.ev.on('connection.update', (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('\n==================================================');
          console.log('[WhatsAppBaileysGateway] Scan QR Code to authenticate:');
          qrcode.generate(qr, { small: true });
          console.log('==================================================\n');
        }

        if (connection === 'close') {
          this.isConnected = false;
          this.isConnecting = false;
          
          const errorMsg = lastDisconnect?.error?.message || lastDisconnect?.error?.toString() || 'Unknown Error';
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;
          
          this.connectionAttempts++;
          const isUnrecoverable = errorMsg.includes('Connection Failure') && this.connectionAttempts >= 3;
          
          const shouldReconnect = !isLoggedOut && !isUnrecoverable;

          console.log(`[WhatsAppBaileysGateway] Connection closed due to ${errorMsg}, reconnecting: ${shouldReconnect}`);

          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

          if (shouldReconnect) {
            this.reconnectTimer = setTimeout(() => this.init(), 5000);
          } else {
            console.warn('[WhatsAppBaileysGateway] Session logged out or unrecoverable error. Cleaning old session files to request new QR code...');
            this.socket = null;
            this.connectionAttempts = 0;
            try {
              if (fs.existsSync(this.authFolder)) {
                fs.rmSync(this.authFolder, { recursive: true, force: true });
              }
            } catch (err) {
              console.error('[WhatsAppBaileysGateway] Error clearing auth folder:', err);
            }
            this.reconnectTimer = setTimeout(() => this.init(), 2000);
          }
        } else if (connection === 'open') {
          this.isConnected = true;
          this.isConnecting = false;
          this.connectionAttempts = 0;
          console.log('[WhatsAppBaileysGateway] WhatsApp Web connection opened successfully!');
        }
      });
    } catch (error) {
      this.isConnecting = false;
      this.isConnected = false;
      console.error('[WhatsAppBaileysGateway] Failed to initialize WASocket:', error);
    }
  }

  public async sendOrderReadyMessage(
    phone: string,
    orderNumber: string,
    shopName: string,
    details?: OrderNotificationDetails
  ): Promise<void> {
    try {
      const connected = await this.waitForConnection(15000);
      if (!connected) {
        throw new SessionExpiredError('WhatsApp Baileys session is not connected or timed out waiting for connection.');
      }

      const cleanPhone = formatWhatsAppPhone(phone);
      const jid = `${cleanPhone}@s.whatsapp.net`;
      const text = buildOrderReadyMessage(orderNumber, shopName, details);

      await this.socket.sendMessage(jid, { text });
      console.log(`[WhatsAppBaileysGateway] Sent order ready notification for order #${orderNumber} to ${phone} (${jid})`);
    } catch (error: any) {
      if (error instanceof SessionExpiredError) {
        throw error;
      }
      throw new NotificationError(`Baileys failed to send message: ${error?.message || error}`);
    }
  }
}
