import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePasswords, generateToken } from "@/lib/auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = loginSchema.parse(body);

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Verificar senha
    const isPasswordValid = await comparePasswords(
      validatedData.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    // Gerar token
    const token = generateToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erro no login:", error);
    return NextResponse.json({ error: "Erro ao fazer login" }, { status: 500 });
  }
}
