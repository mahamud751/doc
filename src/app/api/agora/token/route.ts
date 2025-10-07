import { NextRequest } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";

// Real Agora token generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelName, uid, role } = body;

    // Validate required parameters
    if (!channelName || uid === undefined || uid === null) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required parameters: channelName and uid are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    // Validate environment variables
    if (!appId || !appCertificate) {
      console.error("Missing Agora credentials:", {
        hasAppId: !!appId,
        hasCertificate: !!appCertificate,
      });
      return new Response(
        JSON.stringify({
          error: "Server configuration error: Missing Agora credentials",
          details:
            "Please configure NEXT_PUBLIC_AGORA_APP_ID and AGORA_APP_CERTIFICATE",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate App ID format
    if (appId.length !== 32) {
      return new Response(
        JSON.stringify({
          error: "Invalid App ID format",
          details: "App ID must be 32 characters long",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convert uid to number if it's a string
    const numericUid = typeof uid === "string" ? parseInt(uid, 10) : uid;
    if (isNaN(numericUid)) {
      return new Response(
        JSON.stringify({ error: "Invalid UID: must be a number" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Set token expiration time (24 hours from now)
    const expirationTimeInSeconds =
      Math.floor(Date.now() / 1000) + 24 * 60 * 60;

    // Determine role - default to publisher for video calls
    const tokenRole =
      role === "audience" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

    try {
      // Generate the token
      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        numericUid,
        tokenRole,
        expirationTimeInSeconds,
        0 // privilegeExpiredTs for additional privileges (set to 0 for default)
      );

      console.log("Token generated successfully:", {
        channelName,
        uid: numericUid,
        role: tokenRole,
        expiresAt: new Date(expirationTimeInSeconds * 1000).toISOString(),
      });

      return new Response(
        JSON.stringify({
          token,
          appId,
          channel: channelName,
          uid: numericUid,
          expires: expirationTimeInSeconds,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (tokenError) {
      console.error("Token generation failed:", tokenError);
      return new Response(
        JSON.stringify({
          error: "Token generation failed",
          details:
            tokenError instanceof Error ? tokenError.message : "Unknown error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in token generation endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
