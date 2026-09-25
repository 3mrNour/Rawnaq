// SYNC: keep identical to frontend/src/types/rawnaq.types.ts

export type ServiceCategory = 'apparel' | 'carpet' | 'linen';
export type SubscriptionStatus = 'active' | 'suspended' | 'expired';

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

export type StaffRole = 'owner' | 'cashier' | null;

export type WorkerType = 'dry-cleaner' | 'ironer' | 'none';
export type PayType = 'percentage' | 'fixed-daily' | 'fixed-per-piece';

export interface IStaffMember {
  id?: string;
  shopId: string; // or ObjectId in mongoose
  name: string;
  email?: string;
  passwordHash?: string;
  pinCode?: string;
  role?: StaffRole;
  workerType?: WorkerType;
  payType?: PayType;
  payValue?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
