import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { userprofile } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    console.log("🚀 Polar webhook called!", event.type);

    const data = event.data;
    const customerId = data.customer_id || data.customer?.id;
    const userId =
      data.customer_external_id || data.customer?.external_id || data.user_id; // BetterAuth userId

    // =========================
    // Handle checkout.created
    // =========================
    if (event.type === "checkout.created") {
      console.log("🛒 Handling checkout.created");

      if (!userId) {
        console.warn("⚠️ No external_id in checkout.created. Skipping profile creation.");
        return NextResponse.json({ ignored: true });
      }

      const existingProfile = await db
        .select()
        .from(userprofile)
        .where(eq(userprofile.userId, userId))
        .limit(1);

      if (existingProfile?.length) {
        console.log("✅ Userprofile already exists. Skipping creation.");
      } else {
        console.log("🆕 Creating default userprofile from checkout.created");
        await db.insert(userprofile).values({
          id: crypto.randomUUID(),
          userId,
          plan: "free",
          paid: false,
          customerId: null, // keep null until order.paid
        });
      }

      return NextResponse.json({ received: true });
    }

    // =========================
    // Handle order.paid
    // =========================
    if (event.type === "order.paid") {
      console.log("💳 Handling order.paid event");

      if (!userId) {
        console.warn("⚠️ No external_id found in order.paid. Cannot process.");
        return NextResponse.json({ error: "No userId in webhook" }, { status: 400 });
      }

      // Determine plan and paid status
      let plan = "free";
      let paid = false;

      if (data.product_price?.amount_type === "fixed" && data.product_price.price_amount > 0) {
        plan = "pro"; // You can map product IDs to specific plans if needed
        paid = true;
      } else if (data.product_price?.amount_type === "free" || data.amount === 0) {
        plan = "free";
        paid = false;
      }

      // Check if profile exists
      const existingProfile = await db
        .select()
        .from(userprofile)
        .where(eq(userprofile.userId, userId))
        .limit(1);

      if (existingProfile?.length) {
        console.log("✅ Updating userprofile with plan:", plan);
        await db
          .update(userprofile)
          .set({ plan, paid, customerId })
          .where(eq(userprofile.userId, userId));
      } else {
        console.log("🆕 Creating userprofile from order.paid for user:", userId);
        await db.insert(userprofile).values({
          id: crypto.randomUUID(),
          userId,
          plan,
          paid,
          customerId,
        });
      }

      console.log("🎉 order.paid processed successfully for plan:", plan);
      return NextResponse.json({ received: true });
    }

    console.log("ℹ️ Event ignored:", event.type);
    return NextResponse.json({ ignored: true });
  } catch (err) {
    console.error("❌ Polar webhook error:", err);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
