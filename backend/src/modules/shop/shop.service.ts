import { Shop, IShopDocument } from './shop.model.js';
import { generateLicenseKey } from './licenseKey.service.js';
import { AppError } from '../../utils/AppError.js';
import { SubscriptionStatus, PriceListItem } from '../../types/rawnaq.types.js';

export class ShopNotFoundError extends AppError {
  constructor(id: string) {
    super(404, `Shop with id ${id} not found`);
  }
}

export const createShop = async (
  name: string,
  dailyCapacityLimit: number,
  expiryDate: Date,
  priceList: PriceListItem[] = []
): Promise<IShopDocument> => {
  const licenseKey = await generateLicenseKey();

  // TODO: confirm with PM whether this should be hashed
  const newShop = new Shop({
    name,
    dailyCapacityLimit,
    expiryDate,
    priceList,
    licenseKey,
    subscriptionStatus: 'active',
  });

  return await newShop.save();
};

export const getShops = async (
  search?: string,
  status?: SubscriptionStatus
): Promise<IShopDocument[]> => {
  const query: any = {};

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }
  
  if (status) {
    query.subscriptionStatus = status;
  }

  return await Shop.find(query);
};

export const getMetrics = async () => {
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const result = await Shop.aggregate([
    {
      $facet: {
        byStatus: [
          {
            $group: {
              _id: '$subscriptionStatus',
              count: { $sum: 1 },
            },
          },
        ],
        expiringSoon: [
          {
            $match: {
              subscriptionStatus: 'active',
              expiryDate: { $gte: now, $lte: next7Days },
            },
          },
          {
            $count: 'count',
          },
        ],
      },
    },
  ]);

  const facetResult = result[0];
  const metrics = {
    active: 0,
    suspended: 0,
    expired: 0,
    expiringSoon: 0,
  };

  facetResult.byStatus.forEach((item: { _id: string; count: number }) => {
    if (item._id in metrics) {
      metrics[item._id as keyof typeof metrics] = item.count;
    }
  });

  if (facetResult.expiringSoon.length > 0) {
    metrics.expiringSoon = facetResult.expiringSoon[0].count;
  }

  return metrics;
};

export const updateStatus = async (
  id: string,
  status: SubscriptionStatus
): Promise<IShopDocument> => {
  const shop = await Shop.findByIdAndUpdate(
    id,
    { subscriptionStatus: status },
    { new: true, runValidators: true }
  );

  if (!shop) throw new ShopNotFoundError(id);
  return shop;
};

export const extendExpiry = async (
  id: string,
  newExpiryDate: Date
): Promise<IShopDocument> => {
  const shop = await Shop.findById(id);
  if (!shop) throw new ShopNotFoundError(id);

  if (newExpiryDate <= shop.expiryDate) {
    throw new AppError(400, 'New expiry date must be after the current expiry date');
  }

  shop.expiryDate = newExpiryDate;
  return await shop.save();
};

export const revokeKey = async (id: string): Promise<IShopDocument> => {
  const shop = await Shop.findById(id);
  if (!shop) throw new ShopNotFoundError(id);

  const newKey = await generateLicenseKey();
  shop.licenseKey = newKey;
  return await shop.save();
};

export const unlockDevice = async (id: string): Promise<IShopDocument> => {
  const shop = await Shop.findByIdAndUpdate(
    id,
    { deviceFingerprint: null },
    { new: true }
  );

  if (!shop) throw new ShopNotFoundError(id);
  return shop;
};
