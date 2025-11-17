import axios from "axios";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "astrologer.p.rapidapi.com";
const RAPIDAPI_URL = "https://astrologer.p.rapidapi.com/api/v4";

export interface BirthData {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
  city: string;
  nation: string;
  timezone: string;
  name?: string;
}

export interface BirthChartData {
  planets: {
    [key: string]: {
      sign: string;
      degree: number;
      house: number;
    };
  };
  houses: {
    [key: string]: {
      sign: string;
      degree: number;
    };
  };
  aspects: Array<{
    planet1: string;
    planet2: string;
    aspect: string;
    orb: number;
  }>;
}

export interface TransitData {
  date: string;
  events: Array<{
    planet: string;
    event: string;
    significance: string;
  }>;
}

export class AstrologerService {
  private apiKey: string;
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.apiKey = RAPIDAPI_KEY || "";
    this.baseUrl = RAPIDAPI_URL;
    this.headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": this.apiKey,
    };
  }

  async generateBirthChart(birthData: BirthData): Promise<BirthChartData> {
    if (!this.apiKey) {
      console.warn("RAPIDAPI_KEY não configurada. Usando dados mock.");
      return this.getMockBirthChart();
    }

    try {
      const subject = {
        year: birthData.year,
        month: birthData.month,
        day: birthData.day,
        hour: birthData.hour,
        minute: birthData.minute,
        longitude: birthData.longitude,
        latitude: birthData.latitude,
        city: birthData.city,
        nation: birthData.nation,
        timezone: birthData.timezone,
        name: birthData.name || "User",
        zodiac_type: "Tropic",
        sidereal_mode: null,
        perspective_type: "Apparent Geocentric",
        houses_system_identifier: "P",
      };

      const response = await axios.post(
        `${this.baseUrl}/birth-chart`,
        {
          subject,
          theme: "classic",
          language: "EN",
          wheel_only: false,
        },
        { headers: this.headers }
      );

      return this.parseBirthChartResponse(response.data);
    } catch (error) {
      console.error("Erro ao gerar mapa astral:", error);
      return this.getMockBirthChart();
    }
  }

  async getTransits(
    birthData: BirthData,
    transitDate?: Date
  ): Promise<TransitData> {
    if (!this.apiKey) {
      console.warn("RAPIDAPI_KEY não configurada. Usando dados mock.");
      return this.getMockTransits(new Date().toISOString());
    }

    try {
      const date = transitDate || new Date();

      const firstSubject = {
        year: birthData.year,
        month: birthData.month,
        day: birthData.day,
        hour: birthData.hour,
        minute: birthData.minute,
        longitude: birthData.longitude,
        latitude: birthData.latitude,
        city: birthData.city,
        nation: birthData.nation,
        timezone: birthData.timezone,
        name: birthData.name || "User",
        zodiac_type: "Tropic",
        sidereal_mode: null,
        perspective_type: "Apparent Geocentric",
        houses_system_identifier: "P",
      };

      const transitSubject = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        longitude: birthData.longitude,
        latitude: birthData.latitude,
        city: birthData.city,
        nation: birthData.nation,
        timezone: birthData.timezone,
        zodiac_type: "Tropic",
        sidereal_mode: null,
        perspective_type: "Apparent Geocentric",
        houses_system_identifier: "P",
      };

      const response = await axios.post(
        `${this.baseUrl}/transit-aspects-data`,
        {
          first_subject: firstSubject,
          transit_subject: transitSubject,
          theme: "classic",
          language: "EN",
          wheel_only: false,
          active_points: [
            "Sun",
            "Moon",
            "Mercury",
            "Venus",
            "Mars",
            "Jupiter",
            "Saturn",
            "Uranus",
            "Neptune",
            "Pluto",
          ],
          active_aspects: [
            { name: "conjunction", orb: 10 },
            { name: "opposition", orb: 10 },
            { name: "trine", orb: 8 },
            { name: "sextile", orb: 6 },
            { name: "square", orb: 5 },
          ],
        },
        { headers: this.headers }
      );

      return this.parseTransitResponse(response.data, date.toISOString());
    } catch (error) {
      console.error("Erro ao buscar trânsitos:", error);
      return this.getMockTransits(new Date().toISOString());
    }
  }

  async getNatalAspects(birthData: BirthData): Promise<any> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const subject = {
        year: birthData.year,
        month: birthData.month,
        day: birthData.day,
        hour: birthData.hour,
        minute: birthData.minute,
        longitude: birthData.longitude,
        latitude: birthData.latitude,
        city: birthData.city,
        nation: birthData.nation,
        timezone: birthData.timezone,
        name: birthData.name || "User",
        zodiac_type: "Tropic",
        sidereal_mode: null,
        perspective_type: "Apparent Geocentric",
        houses_system_identifier: "P",
      };

      const response = await axios.post(
        `${this.baseUrl}/natal-aspects-data`,
        {
          subject,
          theme: "classic",
          language: "EN",
          wheel_only: false,
        },
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      console.error("Erro ao buscar aspectos natais:", error);
      return null;
    }
  }

  private parseBirthChartResponse(data: any): BirthChartData {
    // Converte resposta da API para formato interno
    const planets: any = {};
    const houses: any = {};
    const aspects: any[] = [];

    if (data.data?.points) {
      Object.entries(data.data.points).forEach(
        ([key, value]: [string, any]) => {
          const planetName = key.toLowerCase().replace("_", "");
          planets[planetName] = {
            sign: value.sign || "Unknown",
            degree: value.abs_pos || 0,
            house: value.house || 0,
          };
        }
      );
    }

    if (data.data?.houses) {
      Object.entries(data.data.houses).forEach(
        ([key, value]: [string, any]) => {
          houses[key] = {
            sign: value.sign || "Unknown",
            degree: value.abs_pos || 0,
          };
        }
      );
    }

    if (data.data?.aspects) {
      data.data.aspects.forEach((aspect: any) => {
        aspects.push({
          planet1: aspect.first_point?.toLowerCase().replace("_", "") || "",
          planet2: aspect.second_point?.toLowerCase().replace("_", "") || "",
          aspect: aspect.type || "",
          orb: aspect.orb || 0,
        });
      });
    }

    return { planets, houses, aspects };
  }

  private parseTransitResponse(data: any, date: string): TransitData {
    const events: any[] = [];

    if (data.data?.aspects) {
      data.data.aspects.forEach((aspect: any) => {
        events.push({
          planet: aspect.second_point || "Unknown",
          event: `${aspect.type} com ${aspect.first_point}`,
          significance: this.getAspectSignificance(aspect.type),
        });
      });
    }

    return {
      date: date.split("T")[0],
      events: events.slice(0, 5), // Limita a 5 eventos principais
    };
  }

  private getAspectSignificance(aspectType: string): string {
    const significances: Record<string, string> = {
      conjunction: "União de energias planetárias",
      opposition: "Tensão que pede equilíbrio",
      trine: "Harmonia e fluxo natural",
      sextile: "Oportunidades favoráveis",
      square: "Desafio que promove crescimento",
      quintile: "Criatividade e talento",
    };
    return significances[aspectType] || "Influência planetária";
  }

  // Mock para desenvolvimento sem API key
  private getMockBirthChart(): BirthChartData {
    return {
      planets: {
        sun: { sign: "Escorpião", degree: 15.5, house: 8 },
        moon: { sign: "Câncer", degree: 22.3, house: 4 },
        mercury: { sign: "Escorpião", degree: 8.7, house: 8 },
        venus: { sign: "Libra", degree: 28.1, house: 7 },
        mars: { sign: "Áries", degree: 12.4, house: 1 },
        jupiter: { sign: "Sagitário", degree: 5.9, house: 9 },
        saturn: { sign: "Capricórnio", degree: 18.2, house: 10 },
        uranus: { sign: "Aquário", degree: 3.6, house: 11 },
        neptune: { sign: "Peixes", degree: 11.8, house: 12 },
        pluto: { sign: "Escorpião", degree: 25.3, house: 8 },
      },
      houses: {
        "1": { sign: "Áries", degree: 0 },
        "2": { sign: "Touro", degree: 0 },
        "3": { sign: "Gêmeos", degree: 0 },
        "4": { sign: "Câncer", degree: 0 },
        "5": { sign: "Leão", degree: 0 },
        "6": { sign: "Virgem", degree: 0 },
        "7": { sign: "Libra", degree: 0 },
        "8": { sign: "Escorpião", degree: 0 },
        "9": { sign: "Sagitário", degree: 0 },
        "10": { sign: "Capricórnio", degree: 0 },
        "11": { sign: "Aquário", degree: 0 },
        "12": { sign: "Peixes", degree: 0 },
      },
      aspects: [
        { planet1: "sun", planet2: "moon", aspect: "trígono", orb: 2.5 },
        { planet1: "venus", planet2: "mars", aspect: "oposição", orb: 1.2 },
        { planet1: "mercury", planet2: "jupiter", aspect: "sextil", orb: 3.1 },
      ],
    };
  }

  private getMockTransits(date: string): TransitData {
    return {
      date,
      events: [
        {
          planet: "Lua",
          event: "Entrando em Touro",
          significance:
            "Momento favorável para estabilidade emocional e conforto",
        },
        {
          planet: "Mercúrio",
          event: "Trígono com Júpiter",
          significance: "Comunicação expansiva e oportunidades de aprendizado",
        },
        {
          planet: "Vênus",
          event: "Sextil com Marte",
          significance: "Harmonia entre desejo e ação em relacionamentos",
        },
      ],
    };
  }

  // Cruzar carta do tarot com mapa astral
  async crossReferenceWithTarot(
    cardName: string,
    cardKeywords: string[],
    birthChart: BirthChartData
  ): Promise<string> {
    // Análise simplificada baseada em correspondências astrológicas
    const astrologicalCorrespondence = this.getCardAstrologicalLink(cardName);

    if (!astrologicalCorrespondence) {
      return `A carta ${cardName} ressoa com temas de ${cardKeywords.join(
        ", "
      )}.`;
    }

    const planetData = birthChart.planets[astrologicalCorrespondence.planet];

    if (!planetData) {
      return `A carta ${cardName} está associada a ${
        astrologicalCorrespondence.planet
      }, trazendo temas de ${cardKeywords.join(", ")}.`;
    }

    return `A carta ${cardName} ressoa com ${astrologicalCorrespondence.planet} em ${planetData.sign} no seu mapa astral. ${astrologicalCorrespondence.meaning} Esta combinação sugere ${cardKeywords[0]} manifesto através de ${planetData.sign}.`;
  }

  private getCardAstrologicalLink(
    cardName: string
  ): { planet: string; meaning: string } | null {
    const correspondences: Record<string, { planet: string; meaning: string }> =
      {
        "O Louco": {
          planet: "uranus",
          meaning: "Representa mudanças súbitas e libertação.",
        },
        "O Mago": {
          planet: "mercury",
          meaning: "Simboliza comunicação e habilidade mental.",
        },
        "A Sacerdotisa": {
          planet: "moon",
          meaning: "Conecta-se com intuição e emoções.",
        },
        "A Imperatriz": {
          planet: "venus",
          meaning: "Representa amor, beleza e abundância.",
        },
        "O Imperador": {
          planet: "mars",
          meaning: "Simboliza autoridade e ação direta.",
        },
        "O Hierofante": {
          planet: "jupiter",
          meaning: "Conecta-se com sabedoria e expansão.",
        },
        "Os Amantes": {
          planet: "venus",
          meaning: "Representa escolhas em amor e relacionamentos.",
        },
        "O Carro": {
          planet: "mars",
          meaning: "Simboliza determinação e conquista.",
        },
        "A Força": {
          planet: "sun",
          meaning: "Representa vitalidade e coragem interior.",
        },
        "O Eremita": {
          planet: "saturn",
          meaning: "Conecta-se com introspecção e sabedoria.",
        },
        "A Roda da Fortuna": {
          planet: "jupiter",
          meaning: "Simboliza ciclos e expansão do destino.",
        },
        "A Justiça": {
          planet: "saturn",
          meaning: "Representa equilíbrio e responsabilidade.",
        },
        "O Enforcado": {
          planet: "neptune",
          meaning: "Simboliza sacrifício e transcendência.",
        },
        "A Morte": {
          planet: "pluto",
          meaning: "Representa transformação profunda.",
        },
        "A Temperança": {
          planet: "jupiter",
          meaning: "Conecta-se com equilíbrio e moderação.",
        },
        "O Diabo": {
          planet: "saturn",
          meaning: "Simboliza limitações e vícios materiais.",
        },
        "A Torre": {
          planet: "mars",
          meaning: "Representa ruptura súbita e liberação.",
        },
        "A Estrela": {
          planet: "venus",
          meaning: "Simboliza esperança e inspiração.",
        },
        "A Lua": {
          planet: "moon",
          meaning: "Conecta-se com ilusões e intuição profunda.",
        },
        "O Sol": {
          planet: "sun",
          meaning: "Representa vitalidade e sucesso radiante.",
        },
        "O Julgamento": {
          planet: "pluto",
          meaning: "Simboliza renascimento e decisões finais.",
        },
        "O Mundo": {
          planet: "saturn",
          meaning: "Representa completude e realização.",
        },
      };

    return correspondences[cardName] || null;
  }
}

export const astrologerService = new AstrologerService();
export const astroSeekService = astrologerService; // Alias para compatibilidade
