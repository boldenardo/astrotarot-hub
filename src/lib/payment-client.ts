/**
 * Starts the Stripe checkout for the chosen plan.
 * Redirects the browser to the Stripe payment page.
 */
export async function startCheckout(plan: "PACK5" | "PREMIUM"): Promise<void> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });

  if (res.status === 401) {
    window.location.href = "/auth/login?redirect=/cart";
    return;
  }

  let data: { url?: string; error?: string } = {};
  try {
    data = await res.json();
  } catch {
    // response without a JSON body — handled below
  }

  if (res.ok && data.url) {
    window.location.href = data.url;
    return;
  }

  throw new Error(
    data.error || "Could not start the payment. Please try again."
  );
}
