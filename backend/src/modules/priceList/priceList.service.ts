import { Shop } from '../shop/shop.model.js';
import { AppError } from '../../utils/AppError.js';
import { PriceListItem } from '../../types/rawnaq.types.js';

export const addPriceListItem = async (shopId: string, payload: PriceListItem) => {
  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw new AppError(404, 'Shop not found');
  }

  shop.priceList.push(payload);
  await shop.save();

  // Return the newly added item (it's the last one in the array)
  return shop.priceList[shop.priceList.length - 1];
};

export const updatePriceListItem = async (
  shopId: string,
  itemId: string,
  payload: Partial<PriceListItem>
) => {
  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw new AppError(404, 'Shop not found');
  }

  const item = (shop.priceList as any).id(itemId);
  if (!item) {
    throw new AppError(404, 'Price list item not found');
  }

  // Use Mongoose `.set()` to apply updates purely in-place, preserving _id
  item.set(payload);
  await shop.save();

  return item;
};

export const removePriceListItem = async (shopId: string, itemId: string) => {
  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw new AppError(404, 'Shop not found');
  }

  const item = (shop.priceList as any).id(itemId);
  if (!item) {
    throw new AppError(404, 'Price list item not found');
  }

  item.deleteOne();
  await shop.save();

  return null;
};

export const listPriceListItems = async (shopId: string) => {
  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw new AppError(404, 'Shop not found');
  }

  return shop.priceList;
};
