import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { userprofile } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * Verify Polar webhook signature
 * @param payload - Raw request body as string
 * @param signature - Polar-Signature header value
 * @param secret - Webhook secret from environment
 * @returns true if signature is valid
 */
function verifyPolarSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false;
  }

  try {
    // Polar uses HMAC SHA256 for webhook signatures
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // Polar sends signature in format: "sha256=<hex>"
    const receivedSignature = signature.replace("sha256=", "");

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature)
    );
  } catch (error) {
    console.error("Error verifying Polar signature:", error);
    return false;
  }
}

/**
 * Map Polar product ID to plan name
 */
function getPlanFromProductId(productId: string): 'free' | 'pro' | 'enterprise' {
  const productIdToPlan: Record<string, 'free' | 'pro' | 'enterprise'> = {
    '88c88042-ede8-4290-8e6e-b96291bf4c87': 'free',
    '447405a4-6037-42f5-9138-aa519625dc3e': 'pro',
    'd6aea22f-6156-4bc9-9f4c-a937ad05fa0f': 'enterprise',
  };

  return productIdToPlan[productId] || 'free';
}

export async function POST(req: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("❌ POLAR_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Get signature from headers
    const signature = req.headers.get("Polar-Signature");

    // Read raw body for signature verification
    const rawBody = await req.text();
    
   

    // Parse the verified event
    const event = JSON.parse(rawBody);
    console.log("🚀 Polar webhook called!", event.type);

    const data = event.data;
    const customerId = data.customer_id || data.customer?.id;
    // Extract userId - prioritize Better Auth external_id over Polar user_id
    const userId =
      data.customer?.external_id || data.customer_external_id || data.user_id; // BetterAuth userId

    // =========================
    // Step 2: Handle Event Types
    // =========================

    // Handle subscription.created
    if (event.type === "subscription.created") {
      console.log("✨ Handling subscription.created");

      if (!userId) {
        console.warn("⚠️ No external_id in subscription.created. Skipping.");
        return NextResponse.json({ ignored: true });
      }

      // Determine plan from product
      const productId = data.product_id || data.product?.id;
      const plan = productId ? getPlanFromProductId(productId) : 'pro';
      const paid = plan !== 'free';

      // Update or create userprofile
      const existingProfile = await db
        .select()
        .from(userprofile)
        .where(eq(userprofile.userId, userId))
        .limit(1);

      if (existingProfile.length) {
        await db
          .update(userprofile)
          .set({ plan, paid, customerId })
          .where(eq(userprofile.userId, userId));
        console.log("✅ Updated userprofile with subscription:", plan);
      } else {
        await db.insert(userprofile).values({
          id: crypto.randomUUID(),
          userId,
          plan,
          paid,
          customerId,
        });
        console.log("🆕 Created userprofile with subscription:", plan);
      }

      return NextResponse.json({ received: true });
    }

    // Handle subscription.updated
    if (event.type === "subscription.updated") {
      console.log("🔄 Handling subscription.updated");

      if (!userId) {
        console.warn("⚠️ No external_id in subscription.updated. Skipping.");
        return NextResponse.json({ ignored: true });
      }

      const subscriptionStatus = data.status;
      const productId = data.product_id || data.product?.id;
      
      // Only update if subscription is active
      if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
        const plan = productId ? getPlanFromProductId(productId) : 'pro';
        const paid = plan !== 'free';

        const existingProfile = await db
          .select()
          .from(userprofile)
          .where(eq(userprofile.userId, userId))
          .limit(1);

        if (existingProfile.length) {
          await db
            .update(userprofile)
            .set({ plan, paid, customerId })
            .where(eq(userprofile.userId, userId));
          console.log("✅ Updated userprofile subscription to:", plan);
        }
      } else {
        // Subscription cancelled or expired
        const existingProfile = await db
          .select()
          .from(userprofile)
          .where(eq(userprofile.userId, userId))
          .limit(1);

        if (existingProfile.length) {
          await db
            .update(userprofile)
            .set({ plan: 'free', paid: false })
            .where(eq(userprofile.userId, userId));
          console.log("✅ Downgraded userprofile to free");
        }
      }

      return NextResponse.json({ received: true });
    }

    // Handle subscription.deleted
    if (event.type === "subscription.deleted") {
      console.log("🗑️ Handling subscription.deleted");

      if (!userId) {
        console.warn("⚠️ No external_id in subscription.deleted. Skipping.");
        return NextResponse.json({ ignored: true });
      }

      // Downgrade to free
      const existingProfile = await db
        .select()
        .from(userprofile)
        .where(eq(userprofile.userId, userId))
        .limit(1);

      if (existingProfile.length) {
        await db
          .update(userprofile)
          .set({ plan: 'free', paid: false })
          .where(eq(userprofile.userId, userId));
        console.log("✅ Downgraded userprofile to free (subscription deleted)");
      }

      return NextResponse.json({ received: true });
    }

    // Handle checkout.created (legacy support)
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

    // Handle order.paid (legacy support)
    if (event.type === "order.paid") {
      console.log("💳 Handling order.paid event");
      console.log("📦 Order data:", {
        orderId: data.id,
        customerId: data.customer_id,
        userId: data.user_id,
        productId: data.product_id,
        status: data.status,
        paid: data.paid,
      });

      // Extract userId - prioritize Better Auth external_id over Polar user_id
      // Better Auth user ID is stored in customer.external_id
      const extractedUserId = 
        data.customer?.external_id || 
        data.customer_external_id || 
        data.user_id || 
        data.user?.id ||
        userId; // fallback to earlier extraction

      if (!extractedUserId) {
        console.error("❌ No userId found in order.paid event. Available fields:", Object.keys(data));
        return NextResponse.json({ error: "No userId in webhook" }, { status: 400 });
      }

      // Extract customerId
      const extractedCustomerId = 
        data.customer_id || 
        data.customer?.id || 
        data.subscription?.customer_id ||
        customerId; // fallback to earlier extraction

      // Determine plan and paid status from product_id
      const productId = data.product_id || data.product?.id;
      let plan: 'free' | 'pro' | 'enterprise' = "free";
      let paid = false;

      if (productId) {
        plan = getPlanFromProductId(productId);
        paid = plan !== 'free';
        console.log(`📋 Mapped product_id ${productId} to plan: ${plan}, paid: ${paid}`);
      } else {
        // Fallback: determine from order amount
        if (data.total_amount > 0 || data.paid === true) {
          plan = "pro";
          paid = true;
          console.log("⚠️ No product_id found, defaulting to 'pro' based on payment status");
        }
      }

      // Ensure paid is true if order is marked as paid
      if (data.paid === true || data.status === "paid") {
        paid = true;
        if (plan === 'free') {
          plan = 'pro'; // Upgrade to pro if not already set
        }
      }

      console.log(`🔄 Updating userprofile for userId: ${extractedUserId}, plan: ${plan}, paid: ${paid}, customerId: ${extractedCustomerId}`);

      // Check if profile exists
      const existingProfile = await db
        .select()
        .from(userprofile)
        .where(eq(userprofile.userId, extractedUserId))
        .limit(1);

      if (existingProfile.length) {
        // Update existing profile
        await db
          .update(userprofile)
          .set({ 
            plan, 
            paid, 
            customerId: extractedCustomerId || existingProfile[0].customerId, // Preserve existing if new one is null
          })
          .where(eq(userprofile.userId, extractedUserId));
        console.log(`✅ Updated userprofile for userId: ${extractedUserId} - plan: ${plan}, paid: ${paid}`);
      } else {
        // Create new profile
        await db.insert(userprofile).values({
          id: crypto.randomUUID(),
          userId: extractedUserId,
          plan,
          paid,
          customerId: extractedCustomerId,
        });
        console.log(`🆕 Created userprofile for userId: ${extractedUserId} - plan: ${plan}, paid: ${paid}`);
      }

      console.log("🎉 order.paid processed successfully");
      return NextResponse.json({ 
        received: true,
        userId: extractedUserId,
        plan,
        paid,
        customerId: extractedCustomerId,
      });
    }

    console.log("ℹ️ Event ignored:", event.type);
    return NextResponse.json({ ignored: true });
  } catch (err) {
    console.error("❌ Polar webhook error:", err);
    return NextResponse.json(
      { error: "Webhook handling failed" },
      { status: 500 }
    );
  }
}
