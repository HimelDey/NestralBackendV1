import { Document, Types } from "mongoose";

export interface IPropertyImage {
  _id?: Types.ObjectId;
  url: string;
  filename: string;
  isPrimary: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProperty extends Document {
  id: string;
  imageUrl?: string;
  images?: IPropertyImage[];

  streetAddress: string;

  country: string;

  propertyType: "apartment" | "house" | "condo" | "townhouse" | "other";
  bedrooms: number;
  bathrooms: number;
  garage: number;
  isFurnished: boolean;
  inUnitLaundry: boolean;
  status: "active" | "inactive" | "rented" | "archived" | "pending";
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPropertyBase {
  imageUrl?: string;

  streetAddress: string;

  country?: string;

  propertyType: "apartment" | "house" | "condo" | "townhouse" | "other";
  bedrooms: number;
  bathrooms: number;
  garage: number;
  isFurnished: boolean;
  inUnitLaundry: boolean;
}
