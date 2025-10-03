import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";

export async function POST(request: NextRequest) {
  try {
    const { channelName, uid } = await request.json();

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

    // Generate the Agora RTC token
    const agoraToken = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
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
    return NextResponse.json(
      {
        error:
          "Failed to generate token: " + (error.message || "Unknown error"),
      },
      { status: 500 }
    );
  }
}
