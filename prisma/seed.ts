// Script para popular banco com dados de teste
// Execute com: node --loader tsx prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Criar usuário de teste
  const passwordHash = await bcrypt.hash("senha123", 10);

  const user = await prisma.user.upsert({
    where: { email: "teste@astrotarot.com" },
    update: {},
    create: {
      email: "teste@astrotarot.com",
      passwordHash,
      name: "Usuário Teste",
      birthDate: new Date("1990-05-15"),
      birthTime: "14:30",
      birthLocation: "São Paulo, BR",
    },
  });

  console.log("✅ Usuário teste criado:", user.email);

  // Criar mapa astral de exemplo
  const birthChart = await prisma.birthChart.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      chartData: {
        planets: {
          sun: { sign: "Touro", degree: 24.5, house: 10 },
          moon: { sign: "Câncer", degree: 12.3, house: 12 },
          mercury: { sign: "Gêmeos", degree: 8.7, house: 11 },
          venus: { sign: "Áries", degree: 28.1, house: 9 },
          mars: { sign: "Leão", degree: 15.4, house: 1 },
        },
        houses: {
          "1": { sign: "Leão", degree: 5 },
          "2": { sign: "Virgem", degree: 5 },
          "3": { sign: "Libra", degree: 5 },
          "4": { sign: "Escorpião", degree: 5 },
        },
        aspects: [
          { planet1: "sun", planet2: "moon", aspect: "sextil", orb: 2.5 },
        ],
      },
      transits: {
        date: new Date().toISOString().split("T")[0],
        events: [
          {
            planet: "Lua",
            event: "Em Touro",
            significance: "Estabilidade emocional",
          },
        ],
      },
    },
  });

  console.log("✅ Mapa astral criado");

  // Criar tiragem de exemplo
  const reading = await prisma.tarotReading.create({
    data: {
      userId: user.id,
      deckType: "NORMAL",
      spreadType: "THREE_CARD",
      cards: [
        {
          cardName: "O Louco",
          cardNameEn: "The Fool",
          position: 1,
          positionName: "Passado",
          upright: true,
          keywords: ["início", "liberdade", "aventura"],
          imageUrl: "/cards/rider-waite/00-fool.jpg",
        },
        {
          cardName: "O Mago",
          cardNameEn: "The Magician",
          position: 2,
          positionName: "Presente",
          upright: true,
          keywords: ["poder", "ação", "criação"],
          imageUrl: "/cards/rider-waite/01-magician.jpg",
        },
        {
          cardName: "A Imperatriz",
          cardNameEn: "The Empress",
          position: 3,
          positionName: "Futuro",
          upright: false,
          keywords: ["abundância", "natureza", "fertilidade"],
          imageUrl: "/cards/rider-waite/03-empress.jpg",
        },
      ],
      interpretation:
        "Sua jornada começou com O Louco, representando novos começos e liberdade...",
      isPremium: true,
    },
  });

  console.log("✅ Tiragem de teste criada");

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("\n📧 Credenciais de teste:");
  console.log("   Email: teste@astrotarot.com");
  console.log("   Senha: senha123");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
