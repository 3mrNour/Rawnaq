import { StaffMember, IStaffMemberDocument } from './staff.model.js';
import { AppError } from '../../utils/AppError.js';
import { StaffRole } from '../../types/rawnaq.types.js';
import bcrypt from 'bcrypt';

const OWNER_WRITABLE_FIELDS = [
  'name',
  'workerType',
  'payType',
  'payValue',
  'role',
  'pinCode',
  'email',
  'passwordHash',
];
const CASHIER_WRITABLE_FIELDS: string[] = []; // Zero write access

export const createStaff = async (
  shopId: string,
  payload: Partial<IStaffMemberDocument>
) => {
  // Passwords must be hashed if provided in payload
  if (payload.passwordHash) {
    payload.passwordHash = await bcrypt.hash(payload.passwordHash, 10);
  }

  const staff = await StaffMember.create({
    ...payload,
    shopId,
  });

  return staff;
};

export const listStaff = async (shopId: string) => {
  return await StaffMember.find({ shopId }).select('-passwordHash');
};

export const updateStaff = async (
  shopId: string,
  staffId: string,
  payload: Record<string, any>,
  requestorRole: StaffRole
) => {
  const staff = await StaffMember.findOne({ _id: staffId, shopId });
  if (!staff) {
    throw new AppError(404, 'Staff member not found');
  }

  // 1. Determine allowed fields based on role
  const allowedFields = requestorRole === 'owner' ? OWNER_WRITABLE_FIELDS : CASHIER_WRITABLE_FIELDS;

  // 2. Filter payload explicitly
  const filteredPayload: Record<string, any> = {};
  for (const key of Object.keys(payload)) {
    if (allowedFields.includes(key)) {
      filteredPayload[key] = payload[key];
    }
  }

  // 3. Hash password if it's being updated
  if (filteredPayload.passwordHash) {
    filteredPayload.passwordHash = await bcrypt.hash(filteredPayload.passwordHash, 10);
  }

  // 4. Update and return
  Object.assign(staff, filteredPayload);
  await staff.save();

  return staff;
};

export const deleteStaff = async (shopId: string, staffId: string) => {
  const staff = await StaffMember.findOneAndDelete({ _id: staffId, shopId });
  if (!staff) {
    throw new AppError(404, 'Staff member not found');
  }
  return staff;
};
