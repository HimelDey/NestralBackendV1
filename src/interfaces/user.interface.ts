import { Document } from 'mongoose';

export interface IUserBase {
  id?: string;
  email?: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  token?: string;
  refreshToken?: string;
  approved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser extends IUserBase, Document {}
