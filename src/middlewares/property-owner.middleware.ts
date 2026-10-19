import { Request, Response, NextFunction } from "express";
import Property from "../modules/properties/property.model";
import User from "../modules/auth/user.model";

export const propertyOwnerMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ownerId = (req as any).user?.id;
  if (!ownerId) {
    return res
      .status(401)
      .json({ success: false, message: "User not authenticated" });
  }

  try {
    const user = await User.findById(ownerId).select("roles");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Authenticated user not found" });
    }

    if (user.roles.includes("propertyOwner")) {
      return next();
    }

    // Backfill the role for existing owners whose user documents predate roles.
    const ownsProperty = await Property.exists({ ownerId });
    if (!ownsProperty) {
      return res
        .status(403)
        .json({ success: false, message: "Property owner access required" });
    }

    await User.updateOne(
      { _id: ownerId },
      { $addToSet: { roles: "propertyOwner" } },
    );
    return next();
  } catch (error) {
    return next(error);
  }
};
