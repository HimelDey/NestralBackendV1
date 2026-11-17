import jwt from "jsonwebtoken";
import User from "./user.model";
import { config } from "../../config";
import { IUser } from "../../interfaces/user.interface";
import { toAbsoluteUrl } from "../../utils/file-storage";

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
    const isVerifed = userDoc.firstName && userDoc.lastName?true:false;
    return {
      user: {
        id: userDoc._id.toString(),
        phoneNumber: userDoc.phoneNumber,
        email: userDoc.email ?? null,
        firstName: userDoc.firstName ?? null,
        lastName: userDoc.lastName ?? null,
        profileImageUrl: userDoc.profileImageUrl ? toAbsoluteUrl(userDoc.profileImageUrl) : null,
        approved: userDoc.approved,
        verified: isVerifed
      },
      token: accessToken,
      refreshToken,
    };
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

  async updateProfile(userId: string, updateData: Partial<IUser>): Promise<any> {
    const userDoc = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!userDoc) throw new Error('User not found');
    const isVerifed = userDoc.firstName && userDoc.lastName ? true : false;
    return {
      id: userDoc._id.toString(),
      phoneNumber: userDoc.phoneNumber,
      email: userDoc.email ?? null,
      firstName: userDoc.firstName ?? null,
      lastName: userDoc.lastName ?? null,
      profileImageUrl: userDoc.profileImageUrl ? toAbsoluteUrl(userDoc.profileImageUrl) : null,
      roles: userDoc.roles,
      approved: userDoc.approved,
      verified: isVerifed
    };
  }
}

export default new AuthService();
