import { AppError } from '../utils/AppError.js';
import { IShopDocument } from '../modules/shop/shop.model.js';

export const enforceDeviceLock = async (
  shop: IShopDocument,
  incomingFingerprint: string
): Promise<void> => {
  if (!shop.deviceFingerprint) {
    // First login, bind the device fingerprint
    shop.deviceFingerprint = incomingFingerprint;
    await shop.save();
    return;
  }

  if (shop.deviceFingerprint !== incomingFingerprint) {
    throw new AppError(
      403,
      'Device locked. This shop is bound to another device. Please contact support to unlock your device.',
      'DEVICE_LOCKED'
    );
  }
};
