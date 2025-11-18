import { NextRequest, NextResponse } from "next/server";
import { hashPassword, generateToken } from "@/lib/auth";
import { getUserByEmail, createUser } from "@/lib/supabase";
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

    // Verificar se usuário já existe
    const existingUser = await getUserByEmail(validatedData.email);

    if (existingUser) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    // Criar usuário com plano FREE
    const user = await createUser({
      email: validatedData.email,
      password: passwordHash,
      name: validatedData.name,
      birth_date: validatedData.birthDate
        ? new Date(validatedData.birthDate).toISOString()
        : undefined,
      birth_time: validatedData.birthTime,
      birth_location: validatedData.birthLocation,
      subscription_plan: "FREE",
      subscription_status: "active",
      readings_left: 4, // 4 leituras grátis
    });

    if (!user) {
      return NextResponse.json(
        { error: "Erro ao criar usuário" },
        { status: 500 }
      );
    }

    // Gerar token
    const token = generateToken({ userId: user.id, email: user.email });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.created_at,
          subscription: {
            plan: user.subscription_plan,
            status: user.subscription_status,
          },
        },
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
