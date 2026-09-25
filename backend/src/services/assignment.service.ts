import mongoose from 'mongoose';
import { StaffMember } from '../modules/staff/staff.model.js';
import { Order } from '../modules/order/order.model.js';
import { OrderService } from '../modules/order/order.service.js';
import { AppError } from '../utils/AppError.js';

export interface AssignItemInput {
  shopId: string;
  itemId: string;
  pinCode: string;
}

export const assignItemToWorker = async ({ shopId, itemId, pinCode }: AssignItemInput) => {
  // 1. Resolve StaffMember by { shopId, pinCode }
  const staff = await StaffMember.findOne({
    shopId: new mongoose.Types.ObjectId(shopId),
    pinCode,
  });

  // Reject if not found or if workerType === 'none' with generic error per DoD
  if (!staff || staff.workerType === 'none') {
    throw new AppError(400, 'PIN not recognized');
  }

  // 2. Find matching item within its order
  let order = await Order.findOne({
    shopId: new mongoose.Types.ObjectId(shopId),
    'items.itemId': itemId,
  });

  // Fallback check in case _id string was provided instead of string itemId
  if (!order) {
    if (mongoose.Types.ObjectId.isValid(itemId)) {
      order = await Order.findOne({
        shopId: new mongoose.Types.ObjectId(shopId),
        'items._id': new mongoose.Types.ObjectId(itemId),
      });
    }
  }

  if (!order) {
    throw new AppError(404, 'Order item not found');
  }

  const item = order.items.find(
    (i: any) => i.itemId === itemId || i._id?.toString() === itemId
  );

  if (!item) {
    throw new AppError(404, 'Item not found in order');
  }

  // 3. Reject if item is already assigned to someone else (no silent reassignment)
  if (item.assignedWorkerId) {
    const currentAssignee = await StaffMember.findById(item.assignedWorkerId);
    const assigneeName = currentAssignee ? currentAssignee.name : 'another worker';
    throw new AppError(400, `Item is already assigned to ${assigneeName}`);
  }

  // 4. Compute workerRateSnapshot based on current pay config
  let workerRateSnapshot = 0;
  if (staff.payType === 'percentage') {
    workerRateSnapshot = Number(((item.finalPrice * (staff.payValue || 0)) / 100).toFixed(2));
  } else if (staff.payType === 'fixed-per-piece') {
    workerRateSnapshot = staff.payValue || 0;
  } else if (staff.payType === 'fixed-daily') {
    // Task 1.2: Fixed-daily pay handling -> workerRateSnapshot set to 0 at item level
    workerRateSnapshot = 0;
  }

  // 5. Save assignedWorkerId, workerRateSnapshot, and assignedAt onto the item
  item.assignedWorkerId = staff._id;
  item.workerRateSnapshot = workerRateSnapshot;
  item.assignedAt = new Date();

  await order.save();

  // 6. Task 2.1: Auto-transition order to 'ready' when fully assigned
  const allAssigned = order.items.every(
    (i: any) => i.assignedWorkerId !== null && i.assignedWorkerId !== undefined
  );

  let autoTransitionedToReady = false;
  if (allAssigned && order.status === 'received') {
    await OrderService.updateStatus(shopId, order._id.toString(), 'ready');
    autoTransitionedToReady = true;
    // Reload order to reflect status change
    const updatedOrder = await Order.findById(order._id);
    if (updatedOrder) {
      order = updatedOrder;
    }
  }

  return {
    order,
    item,
    staff: {
      id: staff._id.toString(),
      name: staff.name,
      workerType: staff.workerType,
      payType: staff.payType,
    },
    autoTransitionedToReady,
  };
};

export const AssignmentService = {
  assignItemToWorker,
};
