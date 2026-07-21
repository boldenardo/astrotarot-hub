import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
).trim();

// Dev-only sanity check of the Supabase credentials (browser console)
if (typeof window !== "undefined") {
  const isLegacyJwt = supabaseAnonKey.startsWith("eyJ");
  const isPublishable = supabaseAnonKey.startsWith("sb_publishable_");

  if (supabaseAnonKey && !isLegacyJwt && !isPublishable) {
    console.error(
      "The Supabase key looks invalid. Use the 'anon' key (starts with 'eyJ') or the new 'publishable' key (starts with 'sb_publishable_'). Check your environment variables."
    );
  } else if (isLegacyJwt) {
    try {
      const [, payload] = supabaseAnonKey.split(".");
      const decoded = JSON.parse(atob(payload));
      const projectRef = supabaseUrl.match(
        /https:\/\/([^.]+)\.supabase\.co/
      )?.[1];

      if (projectRef && decoded.ref && projectRef !== decoded.ref) {
        console.error(
          `Supabase mismatch: the URL points to project '${projectRef}', but the key belongs to '${decoded.ref}'. Fix your environment variables.`
        );
      }
    } catch (e) {
      console.error("Could not decode the Supabase key:", e);
    }
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not configured.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types para as tabelas (pós-migração Stripe)
export interface User {
  id: string;
  auth_id: string;
  email: string;
  name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_location?: string;
  subscription_plan: "FREE" | "PREMIUM_MONTHLY";
  subscription_status: "active" | "cancelled" | "suspended" | "pending";
  subscription_start_date?: string;
  subscription_end_date?: string;
  readings_left: number;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string; // 'usd'
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  payment_type: "READINGS_PACK" | "SUBSCRIPTION";
  stripe_payment_intent_id?: string;
  stripe_checkout_session_id?: string;
  expires_at?: string;
  paid_at?: string;
  created_at: string;
}

export interface TarotReading {
  id: string;
  user_id: string;
  deck_type?: string;
  spread_type?: string;
  cards: any; // JSON
  interpretation?: string;
  question?: string;
  is_premium?: boolean;
  created_at: string;
}

export interface BirthChart {
  id: string;
  user_id: string;
  birth_date: string;
  birth_time: string;
  birth_location: string;
  latitude: number;
  longitude: number;
  chart_data: any; // JSON
  transits?: any; // JSON
  created_at: string;
}
