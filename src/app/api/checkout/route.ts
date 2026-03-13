import { getAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSubscription } from "@/lib/supabase/queries";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { userId } = await getAuth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Try to get email from Clerk if available
  let email: string | undefined;
  try {
    const { currentUser } = await import("@clerk/nextjs/server");
    const user = await currentUser();
    email = user?.emailAddresses?.[0]?.emailAddress;
  } catch {
    // Clerk not configured — skip email
  }

  const body = await req.json();
  const interval = body.interval === "annual" ? "annual" : "monthly";
  const priceId =
    interval === "annual"
      ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID!
      : process.env.STRIPE_PRO_MONTHLY_PRICE_ID!;

  try {
    // Check if user already has a Stripe customer
    const sub = await getSubscription(userId);
    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: { clerk_user_id: userId },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/ask?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: { clerk_user_id: userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
