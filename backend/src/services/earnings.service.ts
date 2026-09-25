import mongoose from 'mongoose';
import { StaffMember } from '../modules/staff/staff.model.js';
import { Order } from '../modules/order/order.model.js';
import { AppError } from '../utils/AppError.js';

export interface DateRange {
  startDate?: string | Date;
  endDate?: string | Date;
}

export const getWorkerEarnings = async (
  shopId: string,
  workerId: string,
  dateRange: DateRange = {}
) => {
  const staff = await StaffMember.findOne({
    _id: new mongoose.Types.ObjectId(workerId),
    shopId: new mongoose.Types.ObjectId(shopId),
  });

  if (!staff) {
    throw new AppError(404, 'Staff member not found');
  }

  let startOfDay: Date | null = null;
  if (dateRange.startDate) {
    const startObj = new Date(dateRange.startDate);
    if (!isNaN(startObj.getTime())) {
      startOfDay = new Date(Date.UTC(startObj.getUTCFullYear(), startObj.getUTCMonth(), startObj.getUTCDate()));
    }
  }

  let endOfDay: Date | null = null;
  if (dateRange.endDate) {
    const endObj = new Date(dateRange.endDate);
    if (!isNaN(endObj.getTime())) {
      endOfDay = new Date(Date.UTC(endObj.getUTCFullYear(), endObj.getUTCMonth(), endObj.getUTCDate(), 23, 59, 59, 999));
    }
  }

  const orders = await Order.find({
    shopId: new mongoose.Types.ObjectId(shopId),
    'items.assignedWorkerId': new mongoose.Types.ObjectId(workerId),
  });

  const workerItems: any[] = [];
  const uniqueCalendarDays = new Set<string>();

  for (const order of orders) {
    for (const item of order.items) {
      if (item.assignedWorkerId && item.assignedWorkerId.toString() === workerId.toString()) {
        const assignDate = new Date(item.assignedAt || order.updatedAt || order.createdAt || Date.now());

        if (startOfDay && assignDate < startOfDay) {
          continue;
        }
        if (endOfDay && assignDate > endOfDay) {
          continue;
        }

        workerItems.push(item);
        const dayStr = assignDate.toISOString().slice(0, 10);
        uniqueCalendarDays.add(dayStr);
      }
    }
  }

  const itemsSum = workerItems.reduce((acc, item) => acc + (item.workerRateSnapshot || 0), 0);

  let totalEarnings = itemsSum;
  if (staff.payType === 'fixed-daily') {
    totalEarnings = itemsSum + uniqueCalendarDays.size * (staff.payValue || 0);
  }

  return {
    workerId: staff._id.toString(),
    workerName: staff.name,
    workerType: staff.workerType,
    payType: staff.payType,
    payValue: staff.payValue || 0,
    totalEarnings: Number(totalEarnings.toFixed(2)),
    itemsCount: workerItems.length,
    uniqueDaysWorked: uniqueCalendarDays.size,
    items: workerItems.map((item) => ({
      itemId: item.itemId || item._id?.toString(),
      name: item.name,
      category: item.category,
      finalPrice: item.finalPrice,
      workerRateSnapshot: item.workerRateSnapshot || 0,
      assignedAt: item.assignedAt || null,
    })),
  };
};

export const EarningsService = {
  getWorkerEarnings,
};
