import mongoose from 'mongoose';
import { Order, IOrderDocument, OrderStatus } from './order.model.js';
import { Shop } from '../shop/shop.model.js';
import { generateOrderNumber, generateItemId } from './orderNumber.service.js';
import { calculateOriginalPrice } from './pricing.service.js';
import { notificationService } from '../../services/notification/index.js';
import { AppError } from '../../utils/AppError.js';

export const countScheduledItems = async (shopId: string, targetDate: Date | string): Promise<number> => {
  const dateObj = new Date(targetDate);
  
  // Calculate boundaries for the target date to perfectly cover 00:00:00 to 23:59:59 in UTC
  const startOfDay = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate()));
  const endOfDay = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate(), 23, 59, 59, 999));

  const result = await Order.aggregate([
    {
      $match: {
        shopId: new mongoose.Types.ObjectId(shopId),
        deliveryDate: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }
    },
    {
      $group: {
        _id: null,
        totalItems: { $sum: { $size: "$items" } }
      }
    }
  ]);

  return result.length > 0 ? result[0].totalItems : 0;
};

export const createOrder = async (shopId: string, orderData: any): Promise<IOrderDocument> => {
  const shop = await Shop.findById(shopId);
  if (!shop) {
    throw new AppError(404, 'Shop not found');
  }

  const catalogueMap = new Map<string, any>();
  if (shop.priceList && shop.priceList.length > 0) {
    shop.priceList.forEach((item: any) => {
      catalogueMap.set(item._id.toString(), item);
    });
  }

  const orderNumber = await generateOrderNumber(shopId);

  const processedItems = orderData.items.map((itemInput: any, index: number) => {
    const priceListRefStr = itemInput.priceListRef.toString();
    const catalogueEntry = catalogueMap.get(priceListRefStr);
    if (!catalogueEntry) {
      throw new AppError(400, `Catalogue item not found for priceListRef: ${priceListRefStr}`);
    }

    if (catalogueEntry.category !== itemInput.category) {
      throw new AppError(400, `Category mismatch for item "${itemInput.name}": expected ${catalogueEntry.category}, got ${itemInput.category}`);
    }

    const calcResult = calculateOriginalPrice(catalogueEntry, itemInput);
    const originalPrice = calcResult.originalPrice;
    const finalPrice = itemInput.finalPrice !== undefined ? itemInput.finalPrice : originalPrice;

    if (finalPrice !== originalPrice && (!itemInput.overrideReason || itemInput.overrideReason.trim() === '')) {
      throw new AppError(400, 'overrideReason is required when finalPrice differs from originalPrice');
    }

    const itemId = generateItemId(orderNumber, index);

    const baseItem: any = {
      itemId,
      priceListRef: new mongoose.Types.ObjectId(priceListRefStr),
      name: itemInput.name,
      category: itemInput.category,
      originalPrice,
      finalPrice,
      overrideReason: itemInput.overrideReason || undefined,
      assignedWorkerId: itemInput.assignedWorkerId ? new mongoose.Types.ObjectId(itemInput.assignedWorkerId.toString()) : null,
      workerRateSnapshot: itemInput.workerRateSnapshot ?? null,
    };

    if (itemInput.category === 'apparel') {
      baseItem.serviceOption = itemInput.serviceOption;
    } else if (itemInput.category === 'carpet') {
      baseItem.dimensions = {
        length: itemInput.dimensions.length,
        width: itemInput.dimensions.width,
        area: calcResult.area!,
      };
      baseItem.pricePerMeterSnapshot = catalogueEntry.pricePerMeter;
    }

    return baseItem;
  });

  const newOrder = await Order.create({
    shopId: new mongoose.Types.ObjectId(shopId),
    orderNumber,
    customerName: orderData.customerName,
    customerPhone: orderData.customerPhone,
    deliveryDate: new Date(orderData.deliveryDate),
    items: processedItems,
  });

  return newOrder;
};

export const getOrders = async (shopId: string, query: any = {}) => {
  const filter: any = { shopId: new mongoose.Types.ObjectId(shopId) };

  if (query.status && ['received', 'ready', 'delivered'].includes(query.status)) {
    filter.status = query.status;
  }

  if (query.search && query.search.trim() !== '') {
    const regex = new RegExp(query.search.trim(), 'i');
    filter.$or = [
      { orderNumber: regex },
      { customerPhone: regex },
      { customerName: regex },
    ];
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Number(query.limit) || 10);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateStatus = async (shopId: string, orderId: string, newStatus: OrderStatus): Promise<IOrderDocument> => {
  const order = await Order.findOne({
    _id: new mongoose.Types.ObjectId(orderId),
    shopId: new mongoose.Types.ObjectId(shopId),
  });

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  const currentStatus = order.status;

  const isValidTransition =
    (currentStatus === 'received' && newStatus === 'ready') ||
    (currentStatus === 'ready' && newStatus === 'delivered');

  if (!isValidTransition) {
    throw new AppError(400, `Invalid status transition from "${currentStatus}" to "${newStatus}"`);
  }

  order.status = newStatus;
  await order.save();

  if (newStatus === 'ready') {
    const shop = await Shop.findById(shopId);
    const shopName = shop ? shop.name : 'Rawnaq Laundry';
    const orderNum = order.orderNumber || order._id.toString();

    const totalAmount = order.items.reduce((sum, item) => sum + (Number(item.finalPrice) || 0), 0);
    const details = {
      customerName: order.customerName,
      totalAmount,
      items: order.items.map((i) => ({
        name: i.name,
        category: (i as any).category,
        serviceOption: i.serviceOption,
        finalPrice: i.finalPrice,
      })),
    };

    // Async fire-and-forget notification
    notificationService.sendOrderReadyMessage(order.customerPhone, orderNum, shopName, details)
      .catch((err) => {
        console.error(`[OrderService] Fire-and-forget WhatsApp notification failed for order #${orderNum}:`, err);
      });
  }

  return order;
};

export const OrderService = {
  countScheduledItems,
  createOrder,
  getOrders,
  updateStatus,
};
