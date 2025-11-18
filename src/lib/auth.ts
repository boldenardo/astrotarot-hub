import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Ensure JWT_SECRET is always defined
const JWT_SECRET = process.env.JWT_SECRET as string;
// JWT_EXPIRES_IN needs to be typed as the literal value or what comes from env
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || "7d") as string | number;

// Validate JWT_SECRET at module load time
if (!JWT_SECRET || JWT_SECRET === "your-secret-key") {
  console.warn(
    "WARNING: JWT_SECRET is not properly configured. Using fallback (not secure for production)."
  );
}

// Use a secure fallback only for development
const SAFE_JWT_SECRET: Secret =
  JWT_SECRET && JWT_SECRET !== "your-secret-key"
    ? JWT_SECRET
    : "development-fallback-secret-min-32-chars-change-in-production";

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns True if passwords match
 */
export const comparePasswords = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a JWT token with proper typing
 * @param payload - Token payload containing userId and email
 * @returns Signed JWT token string
 */
export const generateToken = (payload: JWTPayload): string => {
  const tokenPayload = {
    userId: payload.userId,
    email: payload.email,
  };

  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(tokenPayload, SAFE_JWT_SECRET, options);
};

/**
 * Verify and decode a JWT token
 * @param token - JWT token string to verify
 * @returns Decoded payload or null if invalid
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, SAFE_JWT_SECRET) as JwtPayload;

    // Validate that required fields exist
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "userId" in decoded &&
      "email" in decoded
    ) {
      return {
        userId: decoded.userId as string,
        email: decoded.email as string,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    }

    return null;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
};
