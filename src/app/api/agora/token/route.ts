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
    const decoded = verifyJWT(token);

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

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return NextResponse.json(
        {
          error: "Agora credentials not configured",
        },
        { status: 500 }
      );
    }

    // Token expires in 1 hour
    const expirationTimeInSeconds = Math.floor(Date.now() / 1000) + 3600;

    // Determine role - doctors can be publishers, patients can be subscribers or publishers
    const agoraRole = role === "doctor" ? RtcRole.PUBLISHER : RtcRole.PUBLISHER;

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

    return NextResponse.json({
      token: agoraToken,
      appId: appId,
      channel: channelName,
      uid: uid,
      expires: expirationTimeInSeconds,
    });
  } catch (error: any) {
    console.error("Token generation error:", error);

    // Provide more specific error messages
    if (error.message && error.message.includes("certificate")) {
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
          "Failed to generate token: " + (error.message || "Unknown error"),
      },
      { status: 500 }
    );
  }
}
