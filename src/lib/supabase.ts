import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
).trim();

// Debug para verificar credenciais no console do navegador
if (typeof window !== "undefined") {
  console.log("🔌 Supabase Config:", {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    keyLength: supabaseAnonKey?.length,
    keyStart: supabaseAnonKey?.substring(0, 5) + "...",
    isJWT: supabaseAnonKey?.startsWith("eyJ"),
  });

  if (!supabaseAnonKey.startsWith("eyJ")) {
    console.error(
      "❌ A chave do Supabase (Anon Key) parece inválida. Ela deve começar com 'eyJ'. Verifique suas variáveis de ambiente."
    );
  } else {
    try {
      const [, payload] = supabaseAnonKey.split(".");
      const decoded = JSON.parse(atob(payload));
      const projectRef = supabaseUrl.match(
        /https:\/\/([^.]+)\.supabase\.co/
      )?.[1];

      console.log("🔍 Supabase Diagnostics:", {
        urlProjectRef: projectRef,
        keyProjectRef: decoded.ref,
        match: projectRef === decoded.ref,
        iat: new Date(decoded.iat * 1000).toISOString(),
        exp: new Date(decoded.exp * 1000).toISOString(),
      });

      if (projectRef && decoded.ref && projectRef !== decoded.ref) {
        console.error(
          `❌ MISMATCH: A URL do Supabase aponta para o projeto '${projectRef}', mas a chave (Anon Key) pertence ao projeto '${decoded.ref}'. Corrija as variáveis de ambiente.`
        );
      }
    } catch (e) {
      console.error("❌ Erro ao decodificar a chave do Supabase:", e);
    }
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase credentials not configured. Using mock data.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types para as tabelas
export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_location?: string;
  subscription_plan: "FREE" | "SINGLE_READING" | "PREMIUM_MONTHLY";
  subscription_status: "active" | "cancelled" | "suspended" | "pending";
  subscription_start_date?: string;
  subscription_end_date?: string;
  readings_left: number;
  pixup_customer_id?: string;
  pixup_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "cancelled" | "expired";
  payment_type: "single" | "subscription";
  pixup_payment_id?: string;
  pixup_qr_code?: string;
  pixup_qr_string?: string;
  expires_at?: string;
  paid_at?: string;
  created_at: string;
}

export interface TarotReading {
  id: string;
  user_id: string;
  cards: any; // JSON
  interpretation?: string;
  question?: string;
  created_at: string;
}

export interface BirthChart {
  id: string;
  user_id: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  latitude: number;
  longitude: number;
  chart_data: any; // JSON
  created_at: string;
}

// Helper functions
export const getUserByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }

  return data as User;
};

export const createUser = async (userData: Partial<User>) => {
  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        email: userData.email,
        password: userData.password,
        name: userData.name || "",
        subscription_plan: "FREE",
        subscription_status: "active",
        readings_left: 4,
        auto_renew: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating user:", error);
    throw error;
  }

  return data as User;
};

export const updateUser = async (userId: string, updates: Partial<User>) => {
  const { data, error } = await supabase
    .from("users")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user:", error);
    throw error;
  }

  return data as User;
};

export const createPayment = async (paymentData: Partial<Payment>) => {
  const { data, error } = await supabase
    .from("payments")
    .insert([
      {
        ...paymentData,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating payment:", error);
    throw error;
  }

  return data as Payment;
};

export const createTarotReading = async (reading: Partial<TarotReading>) => {
  const { data, error } = await supabase
    .from("tarot_readings")
    .insert([
      {
        ...reading,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating tarot reading:", error);
    throw error;
  }

  return data as TarotReading;
};

export const getUserReadings = async (userId: string) => {
  const { data, error } = await supabase
    .from("tarot_readings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching readings:", error);
    return [];
  }

  return data as TarotReading[];
};
