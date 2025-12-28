import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    // Read raw text body EXACTLY as sent by QZ Tray
    const toSign = await req.text();
    console.log(`[QZ-SIGN] Received request to sign ${toSign.length} bytes`);

    if (!toSign || typeof toSign !== "string") {
      console.error("[QZ-SIGN] Invalid request body");
      return new Response("Invalid request body", {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Get private key from Supabase secrets
    const privateKeyPem = Deno.env.get("QZ_PRIVATE_KEY");
    if (!privateKeyPem) {
      console.error("[QZ-SIGN] QZ_PRIVATE_KEY not found in secrets");
      return new Response("", {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    console.log("[QZ-SIGN] Private key loaded, length:", privateKeyPem.length);

    // Parse PEM to get the base64 content
    const pemContent = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/g, "")
      .replace(/-----END PRIVATE KEY-----/g, "")
      .replace(/\r?\n|\r/g, "")
      .trim();

    if (!pemContent) {
      throw new Error("PEM content is empty after parsing");
    }

    console.log("[QZ-SIGN] PEM content length:", pemContent.length);

    // Decode base64 to binary
    const binaryString = atob(pemContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log("[QZ-SIGN] Decoded key bytes:", bytes.length);

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

    console.log("[QZ-SIGN] Private key imported successfully");

    // Sign the EXACT raw string using RSA-SHA256 (PKCS#1 v1.5)
    const encoder = new TextEncoder();
    const dataToSign = encoder.encode(toSign);

    console.log("[QZ-SIGN] Data to sign bytes:", dataToSign.length);

    const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, dataToSign);

    console.log("[QZ-SIGN] Signature generated, length:", new Uint8Array(signature).length);

    // Convert signature ArrayBuffer to base64
    const signatureBytes = new Uint8Array(signature);
    let binarySignature = "";
    for (let i = 0; i < signatureBytes.length; i++) {
      binarySignature += String.fromCharCode(signatureBytes[i]);
    }
    const signatureBase64 = btoa(binarySignature);

    console.log("[QZ-SIGN] Signature base64:", signatureBase64.substring(0, 100) + "...");

    // Return ONLY the base64 signature as plain text
    return new Response(signatureBase64, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("[QZ-SIGN] Error:", error);
    return new Response("", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
