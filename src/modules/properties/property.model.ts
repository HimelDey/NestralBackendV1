import mongoose, { Schema } from "mongoose";
import { IProperty } from "../../interfaces/property.interface";

// Image subdocument schema
const imageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true, timestamps: true },
);

const PropertySchema = new Schema<IProperty>(
  {
    imageUrl: { type: String, default: null },
    images: {
      type: [imageSchema],
      default: [],
      required: false,
    },

    streetAddress: { type: String, required: true },

    country: { type: String, default: "Canada" },

    propertyType: {
      type: String,
      enum: ["apartment", "house", "condo", "townhouse", "other"],
      required: true,
    },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    garage: { type: Number, default: 0, min: 0 },
    isFurnished: { type: Boolean, default: false },
    inUnitLaundry: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "inactive", "rented", "archived", "pending"],
      default: "active",
    },
    ownerId: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model<IProperty>("Property", PropertySchema);
