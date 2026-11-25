import { Document } from 'mongoose';

export type UserRole = 'propertyOwner' | 'tenant';

export interface IUserBase {
  id?: string;
  email?: string;
  phoneNumber: string;
  roles: UserRole[];
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  token?: string;
  refreshToken?: string;
  approved: boolean;
  isOnboarded: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser extends IUserBase, Document {}
