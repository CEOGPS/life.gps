import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const webhook = await request.json();

  // ZeroBounce webhook format
  const { email, status, sub_status, score, ip_address } = webhook;

  if (email) {
    await supabase
      .from("contacts")
      .update({
        verification_status: status,
        verification_score: score,
        verification_data: webhook,
        verified_at: new Date().toISOString(),
      })
      .eq("email", email);
  }

  return NextResponse.json({ received: true });
}
