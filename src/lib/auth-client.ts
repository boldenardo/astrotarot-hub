import { supabase } from "./supabase";

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Registra um novo usuário usando Supabase Auth
 */
export async function signUp(data: SignUpData) {
  const { email, password, name, birthDate, birthTime, birthLocation } = data;

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        name: name || "",
        birth_date: birthDate,
        birth_time: birthTime,
        birth_location: birthLocation,
      },
    },
  });

  if (error) {
    console.error("❌ Erro detalhado no SignUp:", {
      message: error.message,
      status: error.status,
      name: error.name,
      code: error.code, // Se disponível
    });
    throw new Error(error.message);
  }

  // Se o usuário foi criado mas não tem sessão, é porque precisa confirmar email
  // OU se o Supabase retornou user mas sem session (comum quando email confirm is on)
  if (authData.user && !authData.session) {
    console.log("✅ Usuário criado, aguardando confirmação de email.");
    return {
      user: authData.user,
      session: null,
      requiresConfirmation: true,
    };
  }

  return {
    user: authData.user,
    session: authData.session,
    requiresConfirmation: false,
  };
}

/**
 * Faz login usando Supabase Auth
 */
export async function signIn(data: SignInData) {
  const { email, password } = data;

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    user: authData.user,
    session: authData.session,
  };
}

/**
 * Faz logout
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Obtém o usuário atual
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return user;
}

/**
 * Obtém a sessão atual
 */
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  return session;
}

/**
 * Obtém o perfil do usuário (tabela users)
 */
export async function getUserProfile() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Atualiza o perfil do usuário
 */
export async function updateUserProfile(updates: {
  name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_location?: string;
}) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Usuário não autenticado");
  }

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("auth_id", user.id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
