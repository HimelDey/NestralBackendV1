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
  createdAt?: Date;
  updatedAt?: Date;
  verified?:boolean;
}

export interface IUser extends IUserBase, Document {}
