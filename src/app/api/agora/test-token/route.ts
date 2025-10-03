import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";

// This is a TEST endpoint without authentication for debugging purposes only
export async function GET(request: NextRequest) {
  try {
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const channelName = searchParams.get("channelName") || "test-channel";
    const uid = searchParams.get("uid") || "0";
    const role = searchParams.get("role") || "publisher";

    console.log("Test token generation request:", {
      channelName,
      uid,
      role,
    });

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    // Log environment variables for debugging
    console.log("Environment variables:");
    console.log(
      "NEXT_PUBLIC_AGORA_APP_ID:",
      appId ? `${appId.substring(0, 8)}...` : "NOT SET"
    );
    console.log(
      "AGORA_APP_CERTIFICATE:",
      appCertificate ? `${appCertificate.substring(0, 8)}...` : "NOT SET"
    );

    // Validate environment variables
    if (!appId) {
      return NextResponse.json(
        {
          error: "NEXT_PUBLIC_AGORA_APP_ID not found in environment variables",
        },
        { status: 500 }
      );
    }

    if (!appCertificate) {
      return NextResponse.json(
        {
          error: "AGORA_APP_CERTIFICATE not found in environment variables",
        },
        { status: 500 }
      );
    }

    // Validate App ID format
    if (appId.length !== 32) {
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
      return NextResponse.json(
        {
          error: `Invalid Certificate length: ${appCertificate.length}, expected 32 characters`,
          certLength: appCertificate.length,
          cert: appCertificate,
        },
        { status: 500 }
      );
    }

    // Token expires in 1 hour
    const expirationTimeInSeconds = Math.floor(Date.now() / 1000) + 3600;

    // Determine role
    const agoraRole =
      role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    console.log("Generating test token with:", {
      appId: appId.substring(0, 8) + "...",
      appCertificate: appCertificate.substring(0, 8) + "...",
      channelName,
      uid: parseInt(uid),
      agoraRole,
      expirationTimeInSeconds,
    });

    // Generate the Agora RTC token
    const agoraToken = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      parseInt(uid),
      agoraRole,
      expirationTimeInSeconds,
      expirationTimeInSeconds
    );

    console.log("Test token generated successfully");

    return NextResponse.json({
      success: true,
      token: agoraToken,
      appId: appId,
      channel: channelName,
      uid: parseInt(uid),
      expires: expirationTimeInSeconds,
      message: "Test token generated successfully",
    });
  } catch (error) {
    console.error("Test token generation error:", error);
    console.error("Error stack:", (error as Error).stack);

    // Provide detailed error information
    return NextResponse.json(
      {
        error: "Failed to generate test token",
        message: (error as Error).message || "Unknown error",
        stack:
          process.env.NODE_ENV === "development"
            ? (error as Error).stack
            : undefined,
      },
      { status: 500 }
    );
  }
}
