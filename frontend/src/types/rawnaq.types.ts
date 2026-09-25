// SYNC: keep identical to backend/src/types/rawnaq.types.ts

export type ServiceCategory = 'apparel' | 'carpet' | 'linen';
export type SubscriptionStatus = 'active' | 'suspended' | 'expired';
export type OrderStatus = 'received' | 'ready' | 'delivered';

export interface ApparelPriceListItem {
  category: 'apparel';
  name: string;
  pricing: {
    fullService: number;
    ironOnly: number;
  };
}

export interface CarpetPriceListItem {
  category: 'carpet';
  name: string;
  pricePerMeter: number;
}

export interface LinenPriceListItem {
  category: 'linen';
  name: string;
  basePrice: number;
}

export type PriceListItem = ApparelPriceListItem | CarpetPriceListItem | LinenPriceListItem;

export interface IShop {
  id?: string;
  name: string;
  licenseKey: string;
  subscriptionStatus: SubscriptionStatus;
  expiryDate: Date | string; // Often strings when fetched from API
  dailyCapacityLimit: number;
  deviceFingerprint?: string | null;
  priceList: PriceListItem[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
