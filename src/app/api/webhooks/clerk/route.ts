import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");

export async function POST(req: Request) {
  const body = await req.text();
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Missing svix headers", { status: 400 });
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  const wh = new Webhook(secret);
  let evt: {
    type: string;
    data: {
      id: string;
      email_addresses?: { email_address: string }[];
      first_name?: string;
      last_name?: string;
      [key: string]: unknown;
    };
  };

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as typeof evt;
  } catch (err) {
    console.error("Svix verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // Handle user creation / update
  if (evt.type === "user.created" || evt.type === "user.updated") {
    const { id, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses?.[0]?.email_address ?? "";
    const displayName = [first_name, last_name].filter(Boolean).join(" ") || email;

    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      console.warn("NEXT_PUBLIC_CONVEX_URL not set — skipping Convex sync");
      return NextResponse.json({ ok: true });
    }

    await convex.mutation(api.users.getOrCreate, {
      clerkId: id,
      email,
      displayName,
    });
  }

  if (evt.type === "user.deleted") {
    const { id } = evt.data;
    await convex.mutation(api.users.anonymizeUser, { clerkId: id });
  }

  return NextResponse.json({ ok: true });
}
