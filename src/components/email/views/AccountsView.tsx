"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
} from "lucide-react";
import WarmupDashboard from "./WarmupDashboard";

export default function AccountsView() {
  const [domain, setDomain] = useState("yourcompany.com");
  const [copied, setCopied] = useState("");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  // Recommended Records
  const spfRecord = `v=spf1 include:_spf.google.com include:sendgrid.net ~all`;
  const dkimRecord = `google._domainkey IN TXT "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."`; // shortened for display
  const dmarcRecord = `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourcompany.com`;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-semibold mb-2">
          Email Accounts & Deliverability
        </h2>
        <p className="text-zinc-500">
          Manage accounts and configure DNS records for maximum inbox placement
        </p>
      </div>

      {/* Connected Accounts */}
      <div>
        <h3 className="text-lg font-medium mb-4">Connected Sending Accounts</h3>
        {/* ... existing account cards ... */}
      </div>

      {/* === NEW: DNS Configuration Tool === */}
      <Card className="bg-zinc-950 border border-zinc-800 p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold flex items-center gap-3">
            <ShieldCheck className="text-violet-500" /> DNS Records
            Configuration
          </h3>
          <Badge variant="outline" className="text-emerald-400">
            Recommended for Brevo + SendGrid + Gmail
          </Badge>
        </div>

        <div className="mb-6">
          <label className="text-sm text-zinc-400 block mb-2">
            Your Sending Domain
          </label>
          <div className="flex gap-3">
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-lg font-medium"
              placeholder="yourcompany.com"
            />
            <Button variant="outline">Verify Domain</Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* SPF Record */}
          <div className="border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold">SPF Record</h4>
                <Badge className="bg-emerald-500/10 text-emerald-400">
                  Critical
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(spfRecord, "SPF")}
              >
                <Copy size={16} className="mr-2" />
                {copied === "SPF" ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="bg-black/50 p-4 rounded-xl font-mono text-sm break-all text-zinc-300 border border-zinc-800">
              {spfRecord}
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              Type: <strong>TXT</strong> • Host/Name: <strong>@</strong>
            </p>
          </div>

          {/* DKIM Record */}
          <div className="border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold">DKIM Record</h4>
                <Badge className="bg-emerald-500/10 text-emerald-400">
                  Critical
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(dkimRecord, "DKIM")}
              >
                <Copy size={16} className="mr-2" />
                {copied === "DKIM" ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="bg-black/50 p-4 rounded-xl font-mono text-sm break-all text-zinc-300 border border-zinc-800">
              google._domainkey.{domain} IN TXT "v=DKIM1; k=rsa; p=..."
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              Type: <strong>TXT</strong> • Host/Name:{" "}
              <strong>google._domainkey</strong>
            </p>
            <Button variant="outline" className="mt-4 text-sm" asChild>
              <a
                href="https://admin.google.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Full DKIM Record from Google{" "}
                <ExternalLink size={14} className="ml-2" />
              </a>
            </Button>
          </div>

          {/* DMARC Record */}
          <div className="border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold">DMARC Record (Recommended)</h4>
                <Badge variant="secondary">Protection</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(dmarcRecord, "DMARC")}
              >
                <Copy size={16} className="mr-2" />
                {copied === "DMARC" ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="bg-black/50 p-4 rounded-xl font-mono text-sm break-all text-zinc-300 border border-zinc-800">
              {dmarcRecord}
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              Type: <strong>TXT</strong> • Host/Name: <strong>_dmarc</strong>
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-zinc-900/50 rounded-2xl border border-amber-500/20">
          <div className="flex gap-3">
            <AlertTriangle className="text-amber-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-400">Next Step</p>
              <p className="text-zinc-400">
                Add these records in your DNS provider (Cloudflare, GoDaddy,
                Namecheap, etc.), then click "Verify Domain" above.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Warm-up Dashboard */}
      <WarmupDashboard />
    </div>
  );
}
