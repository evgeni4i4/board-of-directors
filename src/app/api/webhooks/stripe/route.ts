import { NextResponse } from "next/server";
import Stripe from "stripe";
import { upsertSubscription } from "@/lib/supabase/queries";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  // If webhook secret is configured, verify signature
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    event = JSON.parse(body) as Stripe.Event;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.clerk_user_id;
        if (!userId) break;

        await upsertSubscription(userId, {
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan: "pro",
          status: "active",
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(
          subscription.customer as string
        );
        const userId = (customer as Stripe.Customer).metadata?.clerk_user_id;
        if (!userId) break;

        await upsertSubscription(userId, {
          status: subscription.status === "active" ? "active" : "past_due",
          current_period_end: subscription.items.data[0]?.current_period_end
            ? new Date(
                subscription.items.data[0].current_period_end * 1000
              ).toISOString()
            : undefined,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(
          subscription.customer as string
        );
        const userId = (customer as Stripe.Customer).metadata?.clerk_user_id;
        if (!userId) break;

        await upsertSubscription(userId, {
          plan: "free",
          status: "canceled",
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customer = await stripe.customers.retrieve(
          invoice.customer as string
        );
        const userId = (customer as Stripe.Customer).metadata?.clerk_user_id;
        if (!userId) break;

        await upsertSubscription(userId, { status: "past_due" });
        break;
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
  }

  return NextResponse.json({ received: true });
}
