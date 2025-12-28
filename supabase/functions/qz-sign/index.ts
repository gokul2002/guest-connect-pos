import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

serve(async (req) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    // Read raw text body EXACTLY as sent by QZ Tray (do NOT parse JSON, do NOT trim)
    const toSign = await req.text();

    // Validate input
    if (!toSign || typeof toSign !== "string") {
      return new Response("Invalid request body", { status: 400 });
    }

    // Get private key from Supabase secrets
    // IMPORTANT: Store your private key in Supabase secrets as QZ_PRIVATE_KEY
    // Command: supabase secrets set QZ_PRIVATE_KEY="$(cat qz-private.key)"
    const privateKeyPem = Deno.env.get("QZ_PRIVATE_KEY");
    if (!privateKeyPem) {
      console.error("QZ_PRIVATE_KEY not configured in Supabase secrets");
      return new Response("", { status: 500 });
    }

    // Parse PEM to get the base64 content
    const pemContent = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/g, "")
      .replace(/-----END PRIVATE KEY-----/g, "")
      .replace(/\r?\n|\r/g, "")
      .trim();

    // Decode base64 to binary
    const binaryString = atob(pemContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Import as PKCS#8 private key
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      bytes.buffer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );

    // Sign the EXACT raw string using RSA-SHA256 (PKCS#1 v1.5)
    const encoder = new TextEncoder();
    const dataToSign = encoder.encode(toSign);
    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, dataToSign);

    // Convert signature ArrayBuffer to base64
    const signatureBytes = new Uint8Array(signature);
    let binarySignature = "";
    for (let i = 0; i < signatureBytes.length; i++) {
      binarySignature += String.fromCharCode(signatureBytes[i]);
    }
    const signatureBase64 = btoa(binarySignature);

    console.log(`[QZ-SIGN] Signed ${toSign.length} bytes, signature: ${signatureBase64.substring(0, 50)}...`);

    // Return ONLY the base64 signature as plain text (no JSON, no extra whitespace)
    return new Response(signatureBase64, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[QZ-SIGN] Error:", error);
    return new Response("", { status: 500 });
  }
});
