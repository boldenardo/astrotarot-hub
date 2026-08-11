// Controle de acesso da área /admin.
//
// Autorização por e-mail do Clerk, lista em ADMIN_EMAILS (separada por
// vírgula). Sem a env, NINGUÉM entra — falha fechada de propósito, para um
// deploy sem configuração não expor o painel.

import { currentUser } from "@clerk/nextjs/server";

export async function isAdmin(): Promise<boolean> {
  const allowList = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowList.length === 0) return false;

  const user = await currentUser();
  if (!user) return false;

  const emails = user.emailAddresses
    .map((e) => e.emailAddress?.toLowerCase())
    .filter(Boolean) as string[];

  return emails.some((email) => allowList.includes(email));
}
