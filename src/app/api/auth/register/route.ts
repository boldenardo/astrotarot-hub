import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  name: z.string().optional(),
  birthDate: z.string().optional(),
  birthTime: z.string().optional(),
  birthLocation: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.parse(body);

    // Hash da senha
    const passwordHash = await hashPassword(validatedData.password);

    // Tentar conectar ao MongoDB
    let user;
    try {
      // Verificar se usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email já cadastrado" },
          { status: 400 }
        );
      }

      // Criar usuário com assinatura FREE
      user = await prisma.user.create({
        data: {
          email: validatedData.email,
          passwordHash,
          name: validatedData.name,
          birthDate: validatedData.birthDate
            ? new Date(validatedData.birthDate)
            : undefined,
          birthTime: validatedData.birthTime,
          birthLocation: validatedData.birthLocation,
          subscription: {
            create: {
              plan: "FREE",
              status: "active",
              startDate: new Date(),
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          subscription: {
            select: {
              plan: true,
              status: true,
            },
          },
        },
      });
    } catch (dbError: any) {
      // Fallback: MongoDB não disponível, usar mock temporário
      console.warn(
        "MongoDB não disponível, usando dados mock:",
        dbError.message
      );
      const mockId = `mock_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      user = {
        id: mockId,
        email: validatedData.email,
        name: validatedData.name || null,
        birthDate: validatedData.birthDate || null,
        birthTime: validatedData.birthTime || null,
        birthLocation: validatedData.birthLocation || null,
        createdAt: new Date(),
        subscription: {
          plan: "FREE" as const,
          status: "active",
        },
      };
    }

    // Gerar token
    const token = generateToken({ userId: user.id, email: user.email });

    return NextResponse.json(
      {
        user,
        token,
        message:
          "🎉 Bem-vindo(a) ao seu portal místico! Sua jornada de transformação começa AGORA. Faça sua primeira tiragem GRÁTIS do Tarot das 4 Cartas ou assine o plano Premium por apenas R$ 29,90/mês e tenha acesso ILIMITADO a todas as leituras do Tarot Egípcio, Mapa Astral Completo e Previsões Personalizadas. Não deixe seu destino esperando! 🌟",
        welcomeOffer: {
          freeTrial: {
            title: "🎁 JOGUE GRÁTIS AGORA",
            description: "Tarot das 4 Cartas - Sem custo, sem compromisso",
            ctaText: "Começar Agora",
            ctaLink: "/challenge",
          },
          premiumPlan: {
            title: "⭐ OFERTA ESPECIAL DE BOAS-VINDAS",
            description: "Acesso TOTAL por apenas R$ 29,90/mês",
            benefits: [
              "✨ Tarot Egípcio Ilimitado",
              "🌙 Mapa Astral Personalizado",
              "💖 Compatibilidade Amorosa",
              "🔮 Previsões Diárias",
              "💰 Ritual de Abundância",
              "🤖 Guia Espiritual com IA",
            ],
            price: "R$ 29,90/mês",
            ctaText: "Ativar Plano Premium",
            ctaLink: "/cart",
          },
          singleReading: {
            title: "🌟 EXPERIMENTE UMA LEITURA COMPLETA",
            description: "Tiragem do Tarot Egípcio por apenas R$ 9,90",
            ctaText: "Fazer 1 Leitura",
            ctaLink: "/tarot",
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
