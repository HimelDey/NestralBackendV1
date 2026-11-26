import jwt from "jsonwebtoken";
import User from "./user.model";
import Lease from "../properties/lease.model";
import "../properties/property.model";
import { config } from "../../config";

const FIXED_OTP = "123456";

class AuthService {
  /**
   * Generate access token
   */
  private generateAccessToken(payload: object): string {
    return jwt.sign(payload, config.jwtAccessSecret, {
      expiresIn: config.jwtAccessExpiresIn || "15m",
    });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(payload: object): string {
    return jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiresIn || "7d",
    });
  }

  private monthsBetween(start: Date, end: Date): number {
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      (end.getDate() >= start.getDate() ? 0 : -1);
    return Math.max(months, 1);
  }

  private leaseTermLabel(months: number): string {
    if (months >= 12 && months % 12 === 0) return `${months / 12}-Year Lease`;
    return `${months}-Month Lease`;
  }

  async verifyOtp(
    phone: string,
    otp: string,
  ): Promise<{
    user: Record<string, unknown>;
    token: string;
    refreshToken: string;
  } | null> {
    if (otp !== FIXED_OTP) return null;

    let userDoc = await User.findOne({ phoneNumber: phone });
    if (!userDoc) {
      userDoc = await User.create({ phoneNumber: phone, roles: [] });
    }

    const isOwnerOnly =
      userDoc.roles.includes("propertyOwner") && !userDoc.roles.includes("tenant");

    const activeLease = isOwnerOnly
      ? null
      : await Lease.findOne({
          tenantId: userDoc._id,
          status: "active",
        }).populate("propertyId", "streetAddress");

    const populatedProperty = activeLease?.propertyId as unknown as
      | { _id: { toString: () => string }; streetAddress: string }
      | null
      | undefined;

    const property = populatedProperty
      ? {
          id: populatedProperty._id.toString(),
          streetAddress: populatedProperty.streetAddress,
        }
      : null;

    const leaseMonths = activeLease
      ? this.monthsBetween(activeLease.startDate, activeLease.endDate)
      : 0;
    const lease = activeLease
      ? {
          id: activeLease._id.toString(),
          monthlyRent: activeLease.monthlyRent,
          startDate: activeLease.startDate,
          endDate: activeLease.endDate,
          durationMonths: leaseMonths,
          term: this.leaseTermLabel(leaseMonths),
        }
      : null;
      
    if (activeLease && !userDoc.roles.includes("tenant")) {
      userDoc.roles.push("tenant");
      await User.updateOne({ _id: userDoc._id }, { $addToSet: { roles: "tenant" } });
    }

    const payload: { id: string; phoneNumber: string; email?: string } = {
      id: userDoc._id.toString(),
      phoneNumber: userDoc.phoneNumber,
    };
    if (userDoc.email) payload.email = userDoc.email;

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    await User.findByIdAndUpdate(userDoc._id, {
      token: accessToken,
      refreshToken,
    });

    return {
      user: {
        id: userDoc._id.toString(),
        phoneNumber: userDoc.phoneNumber,
        ...(userDoc.email ? { email: userDoc.email } : {}),
        ...(userDoc.firstName ? { firstName: userDoc.firstName } : {}),
        ...(userDoc.lastName ? { lastName: userDoc.lastName } : {}),
        ...(userDoc.profileImageUrl
          ? { profileImageUrl: userDoc.profileImageUrl }
          : {}),
        roles: userDoc.roles,
        approved: userDoc.approved,
        ...(userDoc.roles.includes("tenant")
          ? { isOnboarded: userDoc.isOnboarded ?? false }
          : {}),
        ...(property ? { property } : {}),
        ...(lease ? { lease } : {}),
      },
      token: accessToken,
      refreshToken,
    };
  }

  async completeOnboarding(userId: string) {
    return User.findOneAndUpdate(
      { _id: userId, roles: "tenant" },
      { $set: { isOnboarded: true } },
      { new: true },
    );
  }

  /**
   * Rotate tokens using refresh token
   */
  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken) throw new Error("Refresh token missing");

    let decoded: any;

    try {
      decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
    } catch (err) {
      throw new Error("Invalid refresh token");
    }

    const userDoc = await User.findById(decoded.id);
    if (!userDoc || userDoc.refreshToken !== refreshToken) {
      throw new Error("Refresh token not recognized");
    }

    const payload: { id: string; phoneNumber: string; email?: string } = {
      id: userDoc._id.toString(),
      phoneNumber: userDoc.phoneNumber,
    };
    if (userDoc.email) payload.email = userDoc.email;

    // Rotate: Generate new tokens
    const newAccessToken = this.generateAccessToken(payload);
    const newRefreshToken = this.generateRefreshToken(payload);

    // Save new refresh token (invalidate old)
    await User.findByIdAndUpdate(userDoc._id, {
      refreshToken: newRefreshToken,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout user - invalidate refresh token
   */
  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }
}

export default new AuthService();
