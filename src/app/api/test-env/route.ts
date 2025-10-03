import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get environment variables
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const cert = process.env.AGORA_APP_CERTIFICATE;

    return NextResponse.json({
      appId: appId || "NOT SET",
      cert: cert ? `${cert.substring(0, 8)}...` : "NOT SET",
      appIdLength: appId ? appId.length : 0,
      certLength: cert ? cert.length : 0,
      isAppIdValid: appId && appId.length === 32,
      isCertValid: cert && cert.length === 32,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to check environment variables: " + error.message },
      { status: 500 }
    );
  }
}