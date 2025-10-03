import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";
import { verifyJWT } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    let decoded;
    try {
      // For testing purposes, we can bypass the token verification
      // In production, always verify the token
      decoded = verifyJWT(token);
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return NextResponse.json(
        {
          error: "Invalid authentication token",
          details: (jwtError as Error).message,
        },
        { status: 401 }
      );
    }

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { channelName, uid, role } = await request.json();

    if (!channelName || uid === undefined) {
      return NextResponse.json(
        {
          error: "channelName and uid are required",
        },
        { status: 400 }
      );
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    // Log for debugging
    console.log("Token generation parameters:", {
      appId: appId ? `${appId.substring(0, 8)}...` : "NOT SET",
      appCertificate: appCertificate
        ? `${appCertificate.substring(0, 8)}...`
        : "NOT SET",
      channelName,
      uid,
      role,
    });

    if (!appId || !appCertificate) {
      console.error("Agora credentials missing:", {
        appId: !!appId,
        appCertificate: !!appCertificate,
      });
      return NextResponse.json(
        {
          error: "Agora credentials not configured",
        },
        { status: 500 }
      );
    }

    // Validate App ID format
    if (appId.length !== 32) {
      console.error("Invalid App ID length:", appId.length);
      return NextResponse.json(
        {
          error: `Invalid App ID length: ${appId.length}, expected 32 characters`,
          appIdLength: appId.length,
          appId: appId,
        },
        { status: 500 }
      );
    }

    // Validate Certificate format
    if (appCertificate.length !== 32) {
      console.error("Invalid Certificate length:", appCertificate.length);
      return NextResponse.json(
        {
          error: `Invalid Certificate length: ${appCertificate.length}, expected 32 characters`,
          certLength: appCertificate.length,
          cert: appCertificate,
        },
        { status: 500 }
      );
    }

    // Check if App ID contains only valid characters
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(appId)) {
      console.error("Invalid App ID characters");
      return NextResponse.json(
        {
          error:
            "Invalid App ID format. App ID should only contain hexadecimal characters",
        },
        { status: 500 }
      );
    }

    // Check if Certificate contains only valid characters
    if (!hexRegex.test(appCertificate)) {
      console.error("Invalid Certificate characters");
      return NextResponse.json(
        {
          error:
            "Invalid Certificate format. Certificate should only contain hexadecimal characters",
        },
        { status: 500 }
      );
    }

    // Token expires in 1 hour
    const expirationTimeInSeconds = Math.floor(Date.now() / 1000) + 3600;

    // Determine role - doctors can be publishers, patients can be subscribers or publishers
    const agoraRole = role === "doctor" ? RtcRole.PUBLISHER : RtcRole.PUBLISHER;

    console.log("Generating token with:", {
      appId: appId.substring(0, 8) + "...",
      appCertificate: appCertificate.substring(0, 8) + "...",
      channelName,
      uid,
      role,
      agoraRole,
      expirationTimeInSeconds,
    });

    // Generate the Agora RTC token
    const agoraToken = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      agoraRole,
      expirationTimeInSeconds,
      expirationTimeInSeconds // privilegeExpiredTs
    );

    console.log("Token generated successfully for channel:", channelName);
    console.log("Generated token:", agoraToken.substring(0, 20) + "...");

    return NextResponse.json({
      token: agoraToken,
      appId: appId,
      channel: channelName,
      uid: uid,
      expires: expirationTimeInSeconds,
    });
  } catch (error) {
    console.error("Token generation error:", error);
    console.error("Error stack:", (error as Error).stack);

    // Provide more specific error messages
    if (
      (error as Error).message &&
      (error as Error).message.includes("certificate")
    ) {
      return NextResponse.json(
        {
          error: "Invalid Agora certificate configuration",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to generate token: " +
          ((error as Error).message || "Unknown error"),
      },
      { status: 500 }
    );
  }
}
