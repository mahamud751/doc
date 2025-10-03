import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";

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
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { success: false, error: "No valid authorization header" };
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return { success: false, error: "JWT secret not configured" };
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Fetch user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        is_active: true,
      },
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
