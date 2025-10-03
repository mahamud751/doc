import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get environment variables
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    // Validate App ID format
    const isValidAppId = appId && appId.length === 32;
    const isValidCert = appCertificate && appCertificate.length === 32;

    return NextResponse.json({
      appId: appId || "Not set",
      appCertificate: appCertificate ? "Set" : "Not set",
      appIdValid: isValidAppId,
      certValid: isValidCert,
      appIdLength: appId ? appId.length : 0,
      certLength: appCertificate ? appCertificate.length : 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to check Agora config: " + error.message },
      { status: 500 }
    );
  }
}
