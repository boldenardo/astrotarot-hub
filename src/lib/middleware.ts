import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";

export interface AuthRequest extends NextRequest {
  userId?: string;
  userEmail?: string;
}

export const withAuth = (
  handler: (req: AuthRequest) => Promise<NextResponse>
) => {
  return async (req: AuthRequest) => {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 401 }
      );
    }

    req.userId = payload.userId;
    req.userEmail = payload.email;

    return handler(req);
  };
};
