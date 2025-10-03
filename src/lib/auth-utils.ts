import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { verifyJWT } from "./auth";

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
  error?: string;
}

export const verifyAuthToken = async (
  request: NextRequest
): Promise<AuthResult> => {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return { success: false, error: "No token provided" };
    }

    const decoded = verifyJWT(token) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.is_active) {
      return { success: false, error: "User not found or inactive" };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return { success: false, error: "Invalid token" };
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const isOTPExpired = (expiresAt: Date): boolean => {
  return new Date() > expiresAt;
};

export const generateOTPExpiry = (): Date => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10); // OTP expires in 10 minutes
  return expiry;
};
