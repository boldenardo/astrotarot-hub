// /quiz/checkout — o checkout próprio (ver CustomCheckout.tsx).
import type { Metadata } from "next";
import CustomCheckout from "./CustomCheckout";

export const metadata: Metadata = {
  title: "Secure checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#0e0a1a]">
      <CustomCheckout />
    </main>
  );
}
