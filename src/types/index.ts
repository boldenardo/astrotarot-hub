export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface TarotCard {
  cardName: string;
  cardNameEn: string;
  position: number;
  positionName: string;
  upright: boolean;
  keywords: string[];
  imageUrl: string;
}

export interface TarotReading {
  id: string;
  cards: TarotCard[];
  interpretation?: string;
  isPremium: boolean;
  needsPayment: boolean;
  deckType: "NORMAL" | "EGIPCIO";
  spreadType: "SINGLE" | "THREE_CARD" | "CELTIC_CROSS";
  createdAt: string;
}

export interface BirthChart {
  planets: Record<
    string,
    {
      sign: string;
      degree: number;
      house: number;
    }
  >;
  houses: Record<
    string,
    {
      sign: string;
      degree: number;
    }
  >;
  aspects: Array<{
    planet1: string;
    planet2: string;
    aspect: string;
    orb: number;
  }>;
}

export interface Transit {
  date: string;
  events: Array<{
    planet: string;
    event: string;
    significance: string;
  }>;
}
