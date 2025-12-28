import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Read raw text body EXACTLY as sent by QZ Tray (do NOT parse JSON, do NOT trim)
    const toSign = await req.text();
    console.log("QZ Sign request received, data length:", toSign.length);

    // Validate input
    if (!toSign || typeof toSign !== "string") {
      console.error("Invalid request body");
      return new Response("Invalid request body", { status: 400, headers: corsHeaders });
    }

    // Get private key from Supabase secrets
    const privateKeyPem = Deno.env.get("QZ_PRIVATE_KEY");
    if (!privateKeyPem) {
      console.error("QZ_PRIVATE_KEY not configured in Supabase secrets");
      return new Response("", { status: 500, headers: corsHeaders });
    }

    // Parse PKCS#8 PEM properly - convert PEM to DER
    const pemContent = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/g, "")
      .replace(/-----END PRIVATE KEY-----/g, "")
      .replace(/\r?\n|\r/g, "");

    const binaryString = atob(pemContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Import as PKCS#8 private key
    const key = await crypto.subtle.importKey(
      "pkcs8",
      bytes.buffer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

    // Sign the EXACT raw string using RSA-SHA256 (PKCS#1 v1.5)
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(toSign);
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      data
    );

    // Convert signature ArrayBuffer to base64
    const signatureBytes = new Uint8Array(signature);
    const binarySignature = String.fromCharCode(...signatureBytes);
    const signatureBase64 = btoa(binarySignature);

    console.log("QZ Sign successful, signature length:", signatureBase64.length);

    // Return ONLY the base64 signature as plain text (no JSON, no extra whitespace)
    return new Response(signatureBase64, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("QZ signing error:", error);
    return new Response("", { status: 500, headers: corsHeaders });
  }
});
