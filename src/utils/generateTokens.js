import { User } from "../models/user.model.js";

export const generateTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    const accessToken = await user.generateToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", error.message);
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // Only secure in production
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  path: "/", // Ensure cookie is available for all paths
};

// Additional option for access token (shorter expiry)
export const accessTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};
