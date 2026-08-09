import type { Metadata } from "next";

// Checkout/carrinho — nunca indexar.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
