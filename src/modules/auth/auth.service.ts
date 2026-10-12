import jwt from "jsonwebtoken";
import User from "./user.model";
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
      userDoc = await User.create({ phoneNumber: phone });
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
        approved: userDoc.approved,
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
}

export default new AuthService();
