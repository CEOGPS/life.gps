// lib/zerobounce.ts
import { supabase } from "./supabase";

const ZEROBOUNDE_API_KEY = process.env.ZEROBOUNDE_API_KEY;
const ZEROBOUNDE_API_URL = "https://api.zerobounce.net/v2";

export interface ZeroBounceResponse {
  status:
    | "valid"
    | "invalid"
    | "catch-all"
    | "unknown"
    | "spamtrap"
    | "abuse"
    | "do_not_mail";
  sub_status?: string;
  account: string;
  domain: string;
  email: string;
  firstname?: string;
  lastname?: string;
  gender?: string;
  city?: string;
  region?: string;
  zipcode?: string;
  country?: string;
  processed_at?: string;
  score?: number;
}

export class ZeroBounceVerifier {
  static async validateEmail(email: string): Promise<ZeroBounceResponse> {
    const params = new URLSearchParams({
      api_key: ZEROBOUNDE_API_KEY!,
      email: email,
    });

    const response = await fetch(`${ZEROBOUNDE_API_URL}/validate?${params}`);
    const data = await response.json();

    return {
      status: data.status,
      sub_status: data.sub_status,
      account: data.account,
      domain: data.domain,
      email: data.email,
      score: data.score,
    };
  }

  static async validateBatch(emails: string[]): Promise<ZeroBounceResponse[]> {
    const results = await Promise.all(
      emails.map((email) => this.validateEmail(email)),
    );
    return results;
  }

  static async verifyAndUpdateContact(contactId: string, email: string) {
    const result = await this.validateEmail(email);

    // Map ZeroBounce status to our verification status
    const verificationStatus = this.mapStatus(result.status);

    await supabase
      .from("contacts")
      .update({
        verification_status: verificationStatus,
        verification_score: result.score,
        verification_data: result,
        verified_at: new Date().toISOString(),
      })
      .eq("id", contactId);

    return result;
  }

  static async verifyAllPendingContacts(userId: string, limit: number = 100) {
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, email")
      .eq("user_id", userId)
      .eq("verification_status", "pending")
      .limit(limit);

    if (!contacts?.length) return [];

    const results = await Promise.all(
      contacts.map((contact) =>
        this.verifyAndUpdateContact(contact.id, contact.email),
      ),
    );

    return results;
  }

  private static mapStatus(zeroBounceStatus: string): string {
    const statusMap: Record<string, string> = {
      valid: "valid",
      invalid: "invalid",
      "catch-all": "catch_all",
      unknown: "unknown",
      spamtrap: "spamtrap",
      abuse: "abuse",
      do_not_mail: "do_not_mail",
    };
    return statusMap[zeroBounceStatus] || "unknown";
  }
}
